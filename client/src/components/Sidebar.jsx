import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Receipt,
  Settings2,
  ChevronLeft,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function Sidebar({ isOpen, onToggleCollapse }) {
  const { logout, isAgency, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
    if (onToggleCollapse) {
      onToggleCollapse(isCollapsed);
    }
  }, [isCollapsed, onToggleCollapse]);

  const isActive = (path) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Settings', path: '/settings', icon: Settings2, hasDivider: true },
  ];

  if (!isAgency) return null; // Sidebar is for agency dashboard navigation

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#0C0C16]/30 md:hidden backdrop-blur-sm"
          onClick={() => onToggleCollapse && onToggleCollapse(true)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col transition-all duration-200 border-r ${
          isCollapsed ? 'w-[60px]' : 'w-[220px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          backgroundColor: 'var(--void)',
          borderColor: 'var(--void-border)',
          transitionProperty: 'width, transform',
        }}
      >
        {/* Logo Area */}
        <div 
          className="flex items-center px-3 shrink-0" 
          style={{ height: '56px', borderBottom: '1px solid var(--void-border)' }}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo Mark */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white font-bold text-base shadow-sm"
              style={{ backgroundColor: 'var(--brand-color, var(--electric))' }}
            >
              C
            </div>
            {/* Logo Text */}
            <span
              className="font-bold tracking-tight text-white font-sans text-lg whitespace-nowrap"
              style={{
                transition: 'opacity 0.15s ease, max-width 0.2s ease',
                opacity: isCollapsed ? 0 : 1,
                maxWidth: isCollapsed ? '0px' : '200px',
                overflow: 'hidden',
              }}
            >
              Client<span style={{ color: 'var(--brand-color, var(--electric))' }}>Hub</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <React.Fragment key={item.name}>
                {item.hasDivider && (
                  <div
                    className="my-2 border-t"
                    style={{ borderColor: 'var(--void-border)' }}
                  />
                )}
                <Link
                  to={item.path}
                  className={`group relative flex items-center h-[40px] mx-2 rounded-lg cursor-pointer transition-all duration-120 ${
                    isCollapsed ? 'justify-center' : 'pl-3'
                  }`}
                  style={{
                    backgroundColor: active ? 'var(--void-active-bg)' : 'transparent',
                    borderLeft: active ? '2px solid var(--brand-color, var(--electric))' : '2px solid transparent',
                    color: active ? '#ffffff' : 'var(--void-text)',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--void-text)';
                    }
                  }}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span
                    className="ml-3 font-medium text-sm whitespace-nowrap"
                    style={{
                      transition: 'opacity 0.15s ease, max-width 0.2s ease',
                      opacity: isCollapsed ? 0 : 1,
                      maxWidth: isCollapsed ? '0px' : '200px',
                      overflow: 'hidden',
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom Actions Section */}
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid var(--void-border)' }}>
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center h-10 hover:bg-white/5 text-[#A3A3C8] hover:text-white"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <ChevronLeft
              className="h-5 w-5 transition-transform duration-200"
              style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {/* Separator line */}
          <div className="border-t" style={{ borderColor: 'var(--void-border)' }} />

          {/* User Sign-out Button */}
          <button
            onClick={logout}
            className="flex items-center h-[60px] w-full px-3 hover:bg-white/5 text-[#A3A3C8] hover:text-white"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              textAlign: 'left',
            }}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback
                  className="text-white font-bold text-xs"
                  style={{ backgroundColor: 'var(--brand-color, var(--electric))' }}
                >
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </div>

            <div
              className="ml-3 overflow-hidden"
              style={{
                transition: 'opacity 0.15s ease, max-width 0.2s ease',
                opacity: isCollapsed ? 0 : 1,
                maxWidth: isCollapsed ? '0px' : '200px',
                overflow: 'hidden',
              }}
            >
              <p className="text-xs font-semibold text-white leading-tight truncate m-0">{user?.name}</p>
              <p className="text-[10px] text-[#A3A3C8]/70 leading-none mt-0.5 m-0">Sign out</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
