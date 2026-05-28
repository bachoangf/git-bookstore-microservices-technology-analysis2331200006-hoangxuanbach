/**
 * Authentication Hook
 * 
 * This React hook manages user authentication state and operations:
 * - Token management (stored in localStorage)
 * - User login and registration
 * - User profile loading
 * - JWT token validation
 * - Authenticated fetch wrapper
 * 
 * Provides authentication state and functions to child components.
 */

import { useState, useCallback, useMemo } from 'react';
import { fetchJSON, trackClick } from '../utils/api.js';

/**
 * Custom hook for authentication management
 * 
 * @returns {Object} Authentication state and functions:
 *   - token: Current JWT token (or empty string)
 *   - user: Current user object (or null)
 *   - loading: Whether authentication is in progress
 *   - authMessage: Status message for login/register operations
 *   - authForm: Form state (username, password)
 *   - authHeaders: Headers object with Authorization token
 *   - handleLogin: Function to login or register
 *   - handleLogout: Function to logout
 *   - loadUser: Function to load current user profile
 *   - fetchWithAuth: Authenticated fetch wrapper
 */
export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));
  const [authMessage, setAuthMessage] = useState('');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchWithAuth = useCallback(
    async (path, options = {}) => {
      return fetchJSON(path, options, authHeaders);
    },
    [authHeaders]
  );

  const handleAuthInput = useCallback((field) => (event) => {
    setAuthForm((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleLogin = useCallback(async (mode) => {
    setAuthMessage('');
    await trackClick(`login-${mode}-button`, {}, user?.id || user?.username);
    
    try {
      const endpoint = mode === 'register' ? '/api/users/register' : '/api/users/login';
      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          username: authForm.username.trim(),
          password: authForm.password
        })
      });
      
      if (res?.token) {
        setToken(res.token);
        setAuthMessage(mode === 'register' ? 'Registration successful!' : 'Logged in successfully!');
        return true;
      }
      return false;
    } catch (err) {
      setAuthMessage(err.message);
      return false;
    }
  }, [authForm, fetchWithAuth, user]);

  const handleLogout = useCallback(() => {
    trackClick('logout-button', {}, user?.id || user?.username);
    setToken('');
    setUser(null);
    setAuthForm({ username: '', password: '' });
  }, [user]);

  const loadUser = useCallback(async () => {
    if (!token) {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    localStorage.setItem('token', token);
    
    try {
      const user = await fetchWithAuth('/api/users/me');
      setUser(user);
      setLoading(false);
      return user;
    } catch (err) {
      console.error(err);
      setToken('');
      setAuthMessage('Session expired. Please login again.');
      setLoading(false);
      throw err;
    }
  }, [token, fetchWithAuth, setUser, setToken, setLoading]);

  return {
    token,
    user,
    loading,
    authMessage,
    authForm,
    authHeaders,
    setToken,
    setUser,
    setLoading,
    setAuthMessage,
    handleAuthInput,
    handleLogin,
    handleLogout,
    loadUser,
    fetchWithAuth
  };
}

