import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';
import { Bell, LogOut, Settings, Search, User, Menu } from 'lucide-react';

// Custom outside click and date helper inside the notification dropdown
function NotificationDropdown({ notifications, onClose, onMarkAllRead }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const getRelativeTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getDotColor = (type) => {
    switch (type) {
      case 'file_approved':
        return 'var(--mint)';
      case 'invoice_paid':
        return 'var(--gold)';
      default:
        return 'var(--electric)';
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-10 w-[280px] bg-white border z-50 animate-fadeUp p-3"
      style={{
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <span className="text-xs font-semibold text-[#0E0E1A]">Notifications</span>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] font-medium border-none bg-transparent cursor-pointer hover:underline"
            style={{ color: 'var(--brand-color, var(--electric))' }}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#94A3B8]">
          No notifications yet
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
          {notifications.slice(0, 5).map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2.5 p-2 rounded-lg transition-colors hover:bg-[#F2F2F8]"
              style={{
                backgroundColor: n.read ? 'transparent' : 'rgba(91, 78, 245, 0.04)',
              }}
            >
              <span
                className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: getDotColor(n.type) }}
              />
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs text-[#0E0E1A] leading-normal font-medium break-words m-0">
                  {n.text}
                </p>
                <span className="text-[9px] text-[#94A3B8] block">
                  {getRelativeTime(n.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, isAgency } = useAuth();
  const location = useLocation();
  const socket = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Sync collapsed state dynamically from localStorage for margins
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const syncSidebarState = () => {
      setSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };

    // Listen to storage events and check at intervals to sync perfectly
    window.addEventListener('storage', syncSidebarState);
    const interval = setInterval(syncSidebarState, 150);

    return () => {
      window.removeEventListener('storage', syncSidebarState);
      clearInterval(interval);
    };
  }, []);

  // Fetch agency cache
  const { data: agencyData } = useQuery({
    queryKey: ['agency'],
    enabled: !!user,
  });

  const agencyLogo = agencyData?.agency?.logo || agencyData?.logo;

  // Set up socket listeners for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleFileApproved = (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: 'file_approved',
          text: `File "${data.fileName || 'Asset'}" was approved!`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleInvoicePaid = (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: 'invoice_paid',
          text: `Invoice #${data.invoiceNumber || 'INV'} has been paid.`,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('file_approved', handleFileApproved);
    socket.on('invoice_paid', handleInvoicePaid);

    return () => {
      socket.off('file_approved', handleFileApproved);
      socket.off('invoice_paid', handleInvoicePaid);
    };
  }, [socket]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/projects' || path.startsWith('/projects/')) return 'Projects';
    if (path === '/invoices') return 'Invoices';
    if (path === '/settings') return 'Settings';
    if (path === '/clients') return 'Clients';
    if (path === '/portal') return 'Client Portal';
    return 'ClientHub';
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';

  // Close profile dropdown when clicking outside
  const userMenuRef = useRef(null);
  useEffect(() => {
    const handleUserOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleUserOutsideClick);
    return () => document.removeEventListener('mousedown', handleUserOutsideClick);
  }, []);

  return (
    <nav
      className="sticky top-0 right-0 z-20 flex items-center justify-between px-6 bg-white border-b transition-all duration-200"
      style={{
        height: '56px',
        marginLeft: isAgency ? (sidebarCollapsed ? '60px' : '220px') : '0px',
        borderColor: 'var(--border-light)',
      }}
    >
      {/* Left Section: Dynamic Page Title / Agency Branding */}
      <div className="flex items-center gap-3">
        {isAgency && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden flex items-center justify-center h-8 w-8 text-[#64748B] hover:text-[#0E0E1A] hover:bg-[#F2F2F8] rounded-full border-none bg-transparent cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {agencyLogo ? (
          <img src={agencyLogo} alt="Agency Logo" className="h-6 max-w-[120px] object-contain" />
        ) : null}
        <h1 className="text-base font-semibold text-[#0E0E1A] font-sans m-0">{getPageTitle()}</h1>
      </div>

      {/* Right Section: Search + Notifications + Avatar */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative w-[200px] hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 rounded-lg outline-none transition-all"
            style={{
              height: '32px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--brand-color, var(--electric))')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setUnreadCount(0);
              setShowNotifications(!showNotifications);
            }}
            className="relative flex items-center justify-center h-8 w-8 text-[#64748B] hover:text-[#0E0E1A] hover:bg-[#F2F2F8] rounded-full transition-colors border-none bg-transparent cursor-pointer"
            style={{ transition: 'var(--transition-fast)' }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: 'var(--ember)' }}
              />
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
              }}
            />
          )}
        </div>

        {/* User initials / Dropdown Trigger */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex h-8 w-8 rounded-full overflow-hidden items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 border-none cursor-pointer"
            style={{
              backgroundColor: 'var(--electric-muted)',
              color: 'var(--brand-color, var(--electric))',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            {initials ? initials : <User className="h-4 w-4" />}
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 top-10 w-44 bg-white border py-1 z-50 animate-fadeUp"
              style={{
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {isAgency && (
                <Link
                  to="/settings"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer no-underline"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              )}
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-[#E85454] hover:bg-[#FEECEC] cursor-pointer text-left border-none bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
