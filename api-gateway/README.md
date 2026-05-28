# API Gateway Service

The API Gateway serves as the single entry point for all client requests, handling authentication, routing, and request proxying.

## Overview

The API Gateway is responsible for:
- **Authentication:** Validating JWT tokens for protected routes
- **Request Routing:** Proxying requests to appropriate backend services
- **Header Propagation:** Injecting user context headers for downstream services
- **Request Logging:** Morgan middleware for request logging

## Architecture

```
Client Request
    │
    ▼
API Gateway (Port 8000)
    │
    ├──► Authentication Middleware
    │       └──► JWT Validation
    └──► Proxy Routes
            ├──► /api/users → user-service:8001
            ├──► /api/products → product-service:8002
            ├──► /api/orders → order-service:8003
            ├──► /api/notifications → notification-service:8005
            ├──► /api/dashboard → analytics-dashboard-service:8006
            └──► /api/analytics → analytics-service:8007
```

## Public Routes

These routes do not require authentication:
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /healthz` - Health check
- `POST /api/analytics/track` - Analytics tracking (public)

All other `/api/*` routes require a valid JWT token.

## Authentication Flow

1. Client sends request with `Authorization: Bearer <token>` header
2. Gateway extracts token from header or query parameter
3. JWT is verified using `JWT_SECRET`
4. User context (`x-user-id`, `x-user-username`) is added to request headers
5. Request is forwarded to backend service

## SSE Token Support

Server-Sent Events connections (for example `/api/notifications/events`) sometimes cannot set custom headers.
The gateway supports including a `token` query parameter on those routes. When present, it extracts the token,
verifies it, injects user headers, and removes the token from the proxied request so it is not forwarded downstream.

## Configuration

**Environment Variables:**
- `JWT_SECRET`: Secret key for JWT verification (default: 'devsecret')
- `LOG_LEVEL`: Logging level - 'debug' or 'tiny' (default: 'tiny')
- `NODE_ENV`: Standard Node environment value (affects logging verbosity)

## Dependencies

- `express`: Web framework
- `http-proxy-middleware`: Request proxying
- `jsonwebtoken`: JWT verification
- `morgan`: HTTP request logger

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export JWT_SECRET=your-secret-key
export LOG_LEVEL=debug

# Start server
node index.js
```

## Docker

The service is containerized and runs on port 8000. It depends on all backend services being available.

