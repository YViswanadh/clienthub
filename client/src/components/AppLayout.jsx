import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import useAuth from '../hooks/useAuth';

function MobileSidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  if (!isOpen) return null;

  const isActive = (path) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Projects', path: '/projects', icon: 'folder' },
    { name: 'Invoices', path: '/invoices', icon: 'receipt_long' },
    { name: 'Clients', path: '/clients', icon: 'group' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-primary/40 backdrop-blur-sm transition-opacity" 
      />
      
      {/* Sidebar Panel */}
      <div className="relative w-64 max-w-xs bg-surface border-r border-outline-variant flex flex-col h-full z-10 p-6">
        <div className="flex justify-between items-center pb-6 border-b border-outline-variant">
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-semibold">ClientHub</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Agency Portal</p>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-DEFAULT transition-all
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

        <div className="pt-4 border-t border-outline-variant space-y-4">
          <Link
            to="/projects?create=true"
            onClick={onClose}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-DEFAULT border border-primary hover:bg-surface hover:text-primary transition-colors flex justify-center items-center gap-2"
          >
            New Project
          </Link>
          <div className="space-y-1">
            <Link
              to="/settings"
              onClick={onClose}
              className={`
                flex items-center gap-4 px-4 py-2 rounded-DEFAULT
                ${location.pathname === '/settings' ? 'text-primary font-semibold bg-surface-container-high' : 'text-on-surface-variant'}
              `}
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label-sm text-label-sm">Settings</span>
            </Link>
            <button
              onClick={() => { onClose(); logout(); }}
              className="w-full flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:text-primary transition-all duration-150 rounded-DEFAULT cursor-pointer text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-sm text-label-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgencyShell() {
  const { isCollapsed, openMobile, setOpenMobile } = useSidebar();

  return (
    <div className="min-h-screen flex bg-background text-on-surface w-full">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar isOpen={openMobile} onClose={() => setOpenMobile(false)} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Navbar onToggleMobile={() => setOpenMobile(true)} />
        <main className="flex-1 w-full max-w-container-max mx-auto p-margin-mobile md:p-margin-desktop min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AgencyLayout() {
  return (
    <SidebarProvider>
      <AgencyShell />
    </SidebarProvider>
  );
}

export function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface w-full">
      <Navbar />
      <main className="flex-1 w-full max-w-container-max mx-auto p-margin-mobile md:p-margin-desktop">
        <Outlet />
      </main>
    </div>
  );
}
