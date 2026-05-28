/**
 * Main Application Component
 * 
 * This is the root component of the bookstore frontend application.
 * It manages authentication, data fetching, and coordinates all major features:
 * - User authentication (login/register)
 * - Product management (list, create)
 * - Order management (create, list)
 * - Real-time notifications
 */

import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useData } from './hooks/useData.js';
import { useProducts } from './hooks/useProducts.js';
import { useOrders } from './hooks/useOrders.js';
import { useNotifications } from './hooks/useNotifications.js';
import Header from './components/Header.jsx';
import AuthModal from './components/AuthModal.jsx';
import ProductList from './components/ProductList.jsx';
import ProductForm from './components/ProductForm.jsx';
import OrderForm from './components/OrderForm.jsx';
import OrderList from './components/OrderList.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import WelcomeMessage from './components/WelcomeMessage.jsx';

export default function App() {
  // State for authentication modal visibility
  const [isAuthOpen, setAuthOpen] = useState(false);
  
  // Authentication hook - manages user login, registration, and JWT tokens
  const {
    token,
    user,
    loading,
    authMessage,
    authForm,
    authHeaders,
    setToken,
    setUser,
    setLoading,
    handleAuthInput,
    handleLogin,
    handleLogout,
    loadUser,
    fetchWithAuth
  } = useAuth();

  // Data fetching hook - manages products and orders data
  const {
    products,
    orders,
    dataError,
    setProducts,
    setOrders,
    refreshData
  } = useData(fetchWithAuth);

  // Products management hook - handles product creation form and submission
  const {
    productForm,
    productStatus,
    handleProductForm,
    handleCreateProduct,
    handleDeleteProduct
  } = useProducts(fetchWithAuth, refreshData, user);

  // Orders management hook - handles order creation form and submission
  const {
    orderForm,
    orderStatus,
    handleOrderForm,
    handleCreateOrder,
    handlePrefillOrder
  } = useOrders(fetchWithAuth, refreshData, user);

  // Notifications hook - manages real-time notifications via SSE
  const {
    notifications,
    isNotificationOpen,
    setNotificationOpen,
    unseenCount,
    loadNotifications,
    markNotificationsAsSeen
  } = useNotifications(token, fetchWithAuth);

  /**
   * Effect: Load user data and application data when authentication token changes
   * 
   * If token is removed:
   * - Clear localStorage
   * - Reset user state
   * - Clear products and orders
   * 
   * If token exists:
   * - Load user profile
   * - Fetch products and orders
   * - Load notifications
   */
  useEffect(() => {
    // No token - clear all data and reset state
    if (!token) {
      localStorage.removeItem('token');
      setUser(null);
      setProducts([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    // Token exists - load all user data
    (async () => {
      try {
        await loadUser();           // Load user profile
        await refreshData();         // Load products and orders
        await loadNotifications();   // Load notifications
      } catch (err) {
        console.error(err);
        // On error, clear token to force re-authentication
        setToken('');
        setLoading(false);
      }
    })();
  }, [token, loadUser, refreshData, loadNotifications, setUser, setProducts, setOrders, setToken, setLoading]);

  /**
   * Handles login/register and closes modal on success
   * 
   * @param {string} mode - 'login' or 'register'
   */
  const handleLoginWithClose = async (mode) => {
    const success = await handleLogin(mode);
    if (success) {
      setAuthOpen(false);
    }
  };

  // Determine if user is authenticated
  const isAuthenticated = Boolean(user);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-14 pt-10">
        {/* Header with user info, logout, and notifications */}
        <Header
          user={user}
          onLogout={handleLogout}
          onOpenAuth={() => setAuthOpen(true)}
          notifications={notifications}
          isNotificationOpen={isNotificationOpen}
          setNotificationOpen={setNotificationOpen}
          unseenCount={unseenCount}
          onMarkAsSeen={markNotificationsAsSeen}
        />

        {/* Display any data fetching errors */}
        <ErrorMessage message={dataError} />

        {/* Conditional rendering based on loading and authentication state */}
        {loading ? (
          // Show loading spinner while initializing
          <LoadingSpinner />
        ) : !isAuthenticated ? (
          // Show welcome message for unauthenticated users
          <WelcomeMessage onOpenAuth={() => setAuthOpen(true)} />
        ) : (
          // Main application content for authenticated users
          <main className="mt-12 grid flex-1 gap-8 lg:grid-cols-[2fr,1fr]">
            {/* Left column: Products */}
            <section className="flex flex-col gap-8">
              {/* Display list of products */}
              <ProductList
                products={products}
                onPrefillOrder={handlePrefillOrder}
                onDelete={handleDeleteProduct}
              />
              {/* Form to create new products */}
              <ProductForm
                productForm={productForm}
                productStatus={productStatus}
                onProductFormChange={handleProductForm}
                onSubmit={handleCreateProduct}
              />
            </section>

            {/* Right column: Orders */}
            <section className="flex flex-col gap-8">
              {/* Form to create new orders */}
              <OrderForm
                orderForm={orderForm}
                orderStatus={orderStatus}
                onOrderFormChange={handleOrderForm}
                onSubmit={handleCreateOrder}
              />
              {/* Display list of orders */}
              <OrderList orders={orders} />
            </section>
          </main>
        )}
      </div>

      {/* Authentication modal (login/register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        authForm={authForm}
        authMessage={authMessage}
        onAuthInput={handleAuthInput}
        onLogin={handleLoginWithClose}
      />
    </div>
  );
}
