import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import queryClient from '../lib/queryClient';

export const AuthContext = createContext(null);

let memoryToken = null;

export const getToken = () => memoryToken;
export const setToken = (token) => {
  memoryToken = token;
};

// ─── Demo credentials ────────────────────────────────────────────────────────
const DEMO_USERS = {
  'demo@clienthub.com': {
    password: 'demo123',
    user: {
      id: 'demo-agency-1',
      name: 'Alex Parker',
      email: 'demo@clienthub.com',
      role: 'agency',
      agencyId: 'demo-agency',
    },
  },
  'client@demo.com': {
    password: 'client123',
    user: {
      id: 'demo-client-1',
      name: 'Sarah Johnson',
      email: 'client@demo.com',
      role: 'client',
      agencyId: 'demo-agency',
    },
  },
};

const MOCK_PROJECTS = [
  {
    _id: 'p1', id: 'p1',
    name: 'Acme SaaS Redesign',
    clientName: 'Acme Corp',
    status: 'active',
    dueDate: '2024-09-15',
    phases: [
      { name: 'Discovery', done: true },
      { name: 'Wireframes', done: true },
      { name: 'Design', done: false },
      { name: 'Development', done: false },
      { name: 'Launch', done: false },
    ],
    files: [],
    comments: [],
  },
  {
    _id: 'p2', id: 'p2',
    name: 'Brand Identity System',
    clientName: 'Nexus Digital',
    status: 'review',
    dueDate: '2024-08-30',
    phases: [
      { name: 'Discovery', done: true },
      { name: 'Wireframes', done: true },
      { name: 'Design', done: true },
      { name: 'Development', done: false },
      { name: 'Launch', done: false },
    ],
    files: [],
    comments: [],
  },
  {
    _id: 'p3', id: 'p3',
    name: 'E-commerce Platform',
    clientName: 'TechNova Inc',
    status: 'active',
    dueDate: '2024-10-01',
    phases: [
      { name: 'Discovery', done: true },
      { name: 'Wireframes', done: false },
      { name: 'Design', done: false },
      { name: 'Development', done: false },
      { name: 'Launch', done: false },
    ],
    files: [],
    comments: [],
  },
];

const MOCK_INVOICES = [
  {
    _id: 'i1', id: 'i1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'Acme Corp',
    projectName: 'Acme SaaS Redesign',
    amount: 12500,
    status: 'paid',
    dueDate: '2024-07-15',
  },
  {
    _id: 'i2', id: 'i2',
    invoiceNumber: 'INV-2024-002',
    clientName: 'Nexus Digital',
    projectName: 'Brand Identity System',
    amount: 8750,
    status: 'unpaid',
    dueDate: '2024-08-01',
  },
  {
    _id: 'i3', id: 'i3',
    invoiceNumber: 'INV-2024-003',
    clientName: 'TechNova Inc',
    projectName: 'E-commerce Platform',
    amount: 24000,
    status: 'unpaid',
    dueDate: '2024-09-01',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateToken = useCallback((token) => {
    setToken(token);
  }, []);

  const seedDemoData = useCallback(() => {
    queryClient.setQueryData(['projects'], MOCK_PROJECTS);
    queryClient.setQueryData(['invoices'], MOCK_INVOICES);
  }, []);

  const login = useCallback(async (email, password) => {
    // ── Demo mode check ──
    const demoEntry = DEMO_USERS[email.toLowerCase()];
    if (demoEntry && demoEntry.password === password) {
      updateToken('demo-token');
      setUser(demoEntry.user);
      seedDemoData();
      return { success: true, user: demoEntry.user };
    }

    // ── Real API call ──
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
        error: error.response?.data?.message || 'Invalid credentials. Please try again.',
      };
    }
  }, [updateToken, seedDemoData]);

  const logout = useCallback(async () => {
    try {
      if (memoryToken && memoryToken !== 'demo-token') {
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      updateToken(null);
      setUser(null);
      queryClient.clear();
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
        // No active session — this is expected on first load
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
    updateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
