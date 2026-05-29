import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';

export default function Navbar({ onToggleMobile }) {
  const { user, logout, isAgency } = useAuth();
  const location = useLocation();
  const socket = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: agencyData } = useQuery({
    queryKey: ['agency'],
    queryFn: async () => {
      const r = await axios.get('/agency');
      return r.data;
    },
    enabled: !!user,
    retry: false,
  });

  const agencyLogo = agencyData?.agency?.logo || agencyData?.logo;

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

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/dashboard') return 'Dashboard';
    if (p.startsWith('/projects')) return 'Projects';
    if (p === '/invoices') return 'Invoices';
    if (p === '/settings') return 'Settings';
    if (p === '/clients') return 'Clients';
    if (p === '/portal') return 'Client Portal';
    return 'ClientHub';
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : '';

  return (
    <header>
      <div>
        {isAgency && onToggleMobile && (
          <button onClick={onToggleMobile}>[Menu]</button>
        )}
        {agencyLogo && (
          <img src={agencyLogo} alt="Agency logo" style={{ height: 20 }} />
        )}
        <span>{getPageTitle()}</span>
      </div>

      <div>
        <div>
          <button onClick={() => { setUnreadCount(0); setShowNotifications(!showNotifications); }}>
            Notifications ({unreadCount})
          </button>
          {showNotifications && (
            <div>
              <h3>Notifications</h3>
              {notifications.length === 0 ? (
                <p>No notifications</p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id} style={{ fontWeight: n.read ? 'normal' : 'bold' }}>
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div>
          <span>Welcome, {user?.name || 'User'} ({initials})</span>
          {isAgency && <Link to="/settings">[Settings]</Link>}
          <button onClick={logout}>[Sign Out]</button>
        </div>
      </div>
    </header>
  );
}
