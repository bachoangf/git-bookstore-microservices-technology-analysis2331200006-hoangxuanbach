/**
 * Data Fetching Hook
 * 
 * This hook manages fetching and storing products and orders data.
 * It provides a unified interface for loading and refreshing application data.
 * 
 * @param {Function} fetchWithAuth - Authenticated fetch function from useAuth hook
 * @returns {Object} Data state and refresh function:
 *   - products: Array of product objects
 *   - orders: Array of order objects
 *   - dataError: Error message if data fetching fails
 *   - setProducts: Function to manually set products
 *   - setOrders: Function to manually set orders
 *   - refreshData: Function to reload products and orders from API
 */
import { useState, useCallback } from 'react';

export function useData(fetchWithAuth) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dataError, setDataError] = useState('');

  const refreshData = useCallback(async () => {
    setDataError('');
    try {
      const [productsData, ordersData] = await Promise.all([
        fetchWithAuth('/api/products'),
        fetchWithAuth('/api/orders')
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      setDataError(err.message);
      setProducts([]);
      setOrders([]);
    }
  }, [fetchWithAuth]);

  return {
    products,
    orders,
    dataError,
    setProducts,
    setOrders,
    refreshData
  };
}

