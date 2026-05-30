import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Projects', path: '/projects', icon: 'folder' },
  { name: 'Invoices', path: '/invoices', icon: 'receipt_long' },
  { name: 'Clients', path: '/clients', icon: 'group' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

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

  const isActive = (path) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface-container-low z-40 font-body-md">
      {/* Header */}
      <div className="px-6 py-8 border-b border-outline-variant flex items-center gap-3">
        {agencyLogo ? (
          <img
            alt="Agency Logo"
            className="w-8 h-8 rounded bg-surface-container object-cover border border-outline-variant"
            src={agencyLogo}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-bold font-display-lg text-lg border border-outline-variant select-none">
            C
          </div>
        )}
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-semibold tracking-tight">ClientHub</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Agency Portal</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex items-center gap-4 px-4 py-3 transition-all duration-150 rounded-DEFAULT
                ${active 
                  ? 'bg-secondary-container text-on-secondary-container font-semibold border border-secondary-container' 
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary border border-transparent'
                }
              `}
            >
              <span className={`material-symbols-outlined ${active ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* CTA & Footer */}
      <div className="p-4 border-t border-outline-variant space-y-4">
        <Link
          to="/projects?create=true"
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-DEFAULT border border-primary hover:bg-surface hover:text-primary transition-colors flex justify-center items-center gap-2"
        >
          New Project
        </Link>
        <div className="space-y-1">
          <Link
            to="/settings"
            className={`
              flex items-center gap-4 px-4 py-2 transition-all duration-150 rounded-DEFAULT
              ${location.pathname === '/settings'
                ? 'text-primary font-semibold bg-surface-container-high'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }
            `}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-sm text-label-sm">Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all duration-150 rounded-DEFAULT cursor-pointer text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-sm text-label-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
