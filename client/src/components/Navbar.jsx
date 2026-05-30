import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';
import Badge from './ui/badge';

export default function Navbar({ onToggleMobile }) {
  const { user, logout, isAgency } = useAuth();
  const location = useLocation();
  const socket = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const { data: agencyData } = useQuery({
    queryKey: ['agency'],
    queryFn: async () => {
      const r = await axios.get('/agency');
      return r.data;
    },
    enabled: !!user,
    retry: false,
  });

  const agencyLogo = agencyData?.agency?.logo || agencyData?.logo || '';

  useEffect(() => {
    if (!socket) return;
    const onFileApproved = (data) => {
      setNotifications((p) => [{ id: Date.now(), type: 'file_approved', text: `File "${data.fileName || 'Asset'}" was approved!`, timestamp: Date.now(), read: false }, ...p]);
      setUnreadCount((p) => p + 1);
    };
    const onInvoicePaid = (data) => {
      setNotifications((p) => [{ id: Date.now(), type: 'invoice_paid', text: `Invoice #${data.invoiceNumber || 'INV'} has been paid.`, timestamp: Date.now(), read: false }, ...p]);
      setUnreadCount((p) => p + 1);
    };
    socket.on('file_approved', onFileApproved);
    socket.on('invoice_paid', onInvoicePaid);
    return () => {
      socket.off('file_approved', onFileApproved);
      socket.off('invoice_paid', onInvoicePaid);
    };
  }, [socket]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <header className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 h-16 sticky top-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant z-30 font-body-md select-none">
      {/* Left side: Search on desktop, Menu trigger on mobile */}
      <div className="flex items-center gap-4 flex-1">
        {isAgency && (
          <button 
            onClick={onToggleMobile} 
            className="md:hidden text-on-surface hover:text-primary cursor-pointer transition-colors p-1"
            aria-label="Toggle mobile menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}
        
        {/* Search bar (desktop only) */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search workspaces, clients..."
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface font-body-md text-body-md rounded-DEFAULT pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Right side: Notifications, profile, logout */}
      <div className="flex items-center gap-4 relative">
        {/* Notifications Icon Button */}
        <div className="relative">
          <button 
            onClick={() => { setUnreadCount(0); setShowNotifications(!showNotifications); }}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1.5 flex items-center justify-center rounded hover:bg-surface-container-low"
            aria-label="View notifications"
          >
            <span className={`material-symbols-outlined ${unreadCount > 0 ? 'filled' : ''}`}>
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown Panel (Planar layering: border, no shadow) */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-surface border border-outline-variant rounded-DEFAULT z-50 py-2">
              <div className="px-4 py-2 border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Notifications</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => setNotifications([])} 
                    className="text-xs text-on-surface-variant hover:text-primary"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-on-surface-variant">No new alerts</p>
                ) : (
                  <ul className="divide-y divide-outline-variant">
                    {notifications.map((n) => (
                      <li key={n.id} className="px-4 py-3 hover:bg-surface-container-low transition-colors">
                        <p className="text-sm text-on-surface font-medium">{n.text}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-outline-variant mx-1" />

        {/* User profile avatar / initials */}
        <div className="flex items-center gap-3 relative">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-sm font-semibold text-primary">{user?.name || 'User'}</span>
            <span className="text-[11px] text-on-surface-variant capitalize">{user?.role || 'Guest'}</span>
          </div>

          {/* Avatar Profile Frame */}
          <div 
            onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}
            className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden flex items-center justify-center font-bold text-sm text-primary select-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            {initials}
          </div>

          {/* User Profile Dropdown Popup (Planar layering: border, no shadow) */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-surface border border-outline-variant rounded-DEFAULT z-50 py-4 px-6 flex flex-col space-y-4">
              <div className="border-b border-outline-variant pb-3 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-bold text-base text-primary select-none mb-2">
                  {initials}
                </div>
                <h4 className="font-semibold text-primary text-sm">{user?.name || 'User'}</h4>
                <p className="text-[11px] text-on-surface-variant font-mono truncate w-full">{user?.email || 'user@company.com'}</p>
                <Badge variant="in-progress" className="mt-2 text-[10px]">{user?.role || 'Guest'}</Badge>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 py-2 bg-transparent border border-error-container hover:bg-error-container/20 text-error font-label-md text-label-md rounded-DEFAULT cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
