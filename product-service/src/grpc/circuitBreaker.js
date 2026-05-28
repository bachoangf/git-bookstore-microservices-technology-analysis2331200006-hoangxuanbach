/**
 * Circuit Breaker Pattern Implementation
 * 
 * The circuit breaker prevents cascading failures when the Order Service
 * is experiencing issues. It has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are rejected immediately
 * - HALF_OPEN: Testing if service has recovered
 */

import grpc from '@grpc/grpc-js';

/**
 * Custom error thrown when circuit breaker is in OPEN state
 * Indicates that requests are being rejected to protect the system
 */
export class CircuitOpenError extends Error {
  constructor(resetAt) {
    super('Order service circuit is open');
    this.name = 'CircuitOpenError';
    this.code = 'CIRCUIT_OPEN';
    this.resetAt = resetAt; // Timestamp when circuit will attempt to close
  }
}

/**
 * Circuit Breaker class for managing service resilience
 * 
 * Opens the circuit after multiple timeout failures to prevent
 * overwhelming a failing service with requests.
 */
export class CircuitBreaker {
  constructor({ maxTimeoutAttempts, resetMs }) {
    this.maxTimeoutAttempts = maxTimeoutAttempts; // Max timeouts before opening circuit
    this.resetMs = resetMs; // Time to wait before attempting to close circuit
    this.state = 'CLOSED'; // Current state: CLOSED, OPEN, or HALF_OPEN
    this.failureCount = 0; // Count of consecutive timeout failures
    this.nextAttemptAfter = 0; // Timestamp when circuit can attempt to close
  }

  /**
   * Called before making a request
   * Throws CircuitOpenError if circuit is OPEN and reset time hasn't passed
   * Transitions from OPEN to HALF_OPEN if reset time has passed
   */
  preRequest() {
    const now = Date.now();

    if (this.state === 'OPEN') {
      // If reset time hasn't passed, reject the request immediately
      if (now < this.nextAttemptAfter) {
        throw new CircuitOpenError(this.nextAttemptAfter);
      }

      // Reset time has passed, transition to HALF_OPEN to test if service recovered
      this.state = 'HALF_OPEN';
    }
  }

  /**
   * Called after a successful request
   * Resets the circuit to CLOSED state and clears failure count
   */
  handleSuccess() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttemptAfter = 0;
  }

  /**
   * Called after a failed request
   * Updates failure count and circuit state based on error type
   * 
   * @param {Error} err - The error that occurred
   */
  handleFailure(err) {
    // Check if error is a timeout (DEADLINE_EXCEEDED)
    const isTimeout = err.code === grpc.status.DEADLINE_EXCEEDED;

    if (isTimeout) {
      this.failureCount += 1;

      // Open circuit if max attempts reached or already in HALF_OPEN state
      if (this.failureCount >= this.maxTimeoutAttempts || this.state === 'HALF_OPEN') {
        this.open();
      } else {
        // Still within threshold, keep circuit closed
        this.state = 'CLOSED';
      }
      return;
    }

    // For non-timeout errors:
    // If in HALF_OPEN state, open circuit (service still failing)
    // Otherwise, keep circuit closed (non-timeout errors don't count toward threshold)
    if (this.state === 'HALF_OPEN') {
      this.open();
    } else {
      this.state = 'CLOSED';
    }
  }

  /**
   * Opens the circuit breaker
   * Sets state to OPEN and schedules when circuit can attempt to close
   */
  open() {
    this.state = 'OPEN';
    this.nextAttemptAfter = Date.now() + this.resetMs;
  }
}

