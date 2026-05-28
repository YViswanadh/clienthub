import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

let memoryToken = null;

export const getToken = () => memoryToken;
export const setToken = (token) => {
  memoryToken = token;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token to local memory reference
  const updateToken = useCallback((token) => {
    setToken(token);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      updateToken(token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  }, [updateToken]);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      updateToken(null);
      setUser(null);
    }
  }, [updateToken]);

  // Initial silent refresh to check if user is already logged in (via HTTP-only cookie)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await axios.post('/api/auth/refresh');
        const { token, user: userData } = response.data;
        updateToken(token);
        setUser(userData);
      } catch (error) {
        console.log('No active session.');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [updateToken]);

  const isAgency = user?.role === 'agency';
  const isClient = user?.role === 'client';

  const value = {
    user,
    loading,
    login,
    logout,
    isAgency,
    isClient,
    updateToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
