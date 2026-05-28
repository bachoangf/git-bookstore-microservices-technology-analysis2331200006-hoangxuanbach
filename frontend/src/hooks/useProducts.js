/**
 * Products Management Hook
 * 
 * This hook manages product creation form state and submission.
 * It handles product form inputs and creates new products via the API.
 * Also handles product deletion.
 * 
 * @param {Function} fetchWithAuth - Authenticated fetch function
 * @param {Function} refreshData - Function to refresh products list after creation/deletion
 * @param {Object} user - Current user object (for analytics tracking)
 * @returns {Object} Product form state and handlers:
 *   - productForm: Form state object (title, author, price, stock)
 *   - productStatus: Status message for product creation/deletion
 *   - handleProductForm: Function to update form fields
 *   - handleCreateProduct: Function to submit product creation
 *   - handleDeleteProduct: Function to delete a product
 */
import { useState, useCallback } from 'react';
import { trackClick } from '../utils/api.js';

export function useProducts(fetchWithAuth, refreshData, user) {
  const [productForm, setProductForm] = useState({
    title: '',
    author: '',
    price: '',
    stock: '100'
  });
  const [productStatus, setProductStatus] = useState('');

  const handleProductForm = useCallback((field) => (event) => {
    setProductForm((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleCreateProduct = useCallback(async (event) => {
    event.preventDefault();
    setProductStatus('');
    await trackClick('create-product-button', { 
      productTitle: productForm.title.trim() 
    }, user?.id || user?.username);
    
    try {
      const payload = {
        title: productForm.title.trim(),
        author: productForm.author.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock || 0)
      };
      
      await fetchWithAuth('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setProductStatus('Product created successfully!');
      setProductForm({ title: '', author: '', price: '', stock: '100' });
      await refreshData();
    } catch (err) {
      setProductStatus(err.message);
    }
  }, [productForm, user, fetchWithAuth, refreshData]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (!confirm('Are you sure you want to delete this product? All associated orders will also be deleted.')) {
      return;
    }

    setProductStatus('');
    await trackClick('delete-product-button', { 
      productId 
    }, user?.id || user?.username);
    
    try {
      const result = await fetchWithAuth(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      const message = result.deletedOrdersCount > 0 
        ? `Product deleted successfully! ${result.deletedOrdersCount} associated order(s) were also deleted.`
        : 'Product deleted successfully!';
      setProductStatus(message);
      await refreshData();
    } catch (err) {
      setProductStatus(err.message);
    }
  }, [user, fetchWithAuth, refreshData]);

  return {
    productForm,
    productStatus,
    handleProductForm,
    handleCreateProduct,
    handleDeleteProduct
  };
}

