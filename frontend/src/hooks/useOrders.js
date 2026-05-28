/**
 * Orders Management Hook
 * 
 * This hook manages order creation form state and submission.
 * It handles order form inputs and creates new orders via the API.
 * 
 * @param {Function} fetchWithAuth - Authenticated fetch function
 * @param {Function} refreshData - Function to refresh orders list after creation
 * @param {Object} user - Current user object (for analytics tracking)
 * @returns {Object} Order form state and handlers:
 *   - orderForm: Form state object (productId, quantity)
 *   - orderStatus: Status message for order creation
 *   - handleOrderForm: Function to update form fields
 *   - handleCreateOrder: Function to submit order creation
 *   - handlePrefillOrder: Function to prefill form with product ID
 */
import { useState, useCallback } from 'react';
import { trackClick } from '../utils/api.js';

export function useOrders(fetchWithAuth, refreshData, user) {
  const [orderForm, setOrderForm] = useState({ productId: '', quantity: '1' });
  const [orderStatus, setOrderStatus] = useState('');

  const handleOrderForm = useCallback((field) => (event) => {
    setOrderForm((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleCreateOrder = useCallback(async (event) => {
    event.preventDefault();
    setOrderStatus('');
    await trackClick('place-order-button', {
      productId: orderForm.productId,
      quantity: orderForm.quantity
    }, user?.id || user?.username);
    
    try {
      const payload = {
        productId: Number(orderForm.productId),
        quantity: Number(orderForm.quantity)
      };
      
      await fetchWithAuth('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setOrderStatus('Order placed!');
      setOrderForm((prev) => ({ ...prev, quantity: '1' }));
      await refreshData();
    } catch (err) {
      setOrderStatus(err.message);
    }
  }, [orderForm, user, fetchWithAuth, refreshData]);

  const handlePrefillOrder = useCallback((productId) => {
    trackClick('prefill-order-button', { productId }, user?.id || user?.username);
    setOrderForm({ productId: String(productId), quantity: '1' });
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [user]);

  return {
    orderForm,
    orderStatus,
    handleOrderForm,
    handleCreateOrder,
    handlePrefillOrder
  };
}

