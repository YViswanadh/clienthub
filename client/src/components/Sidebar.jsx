import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';

export default function Sidebar({ isOpen, onToggleCollapse }) {
  const { logout, isAgency } = useAuth();
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
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (!isAgency) return null; // Sidebar is for agency dashboard navigation

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#111111]/30 md:hidden backdrop-blur-sm"
          onClick={() => onToggleCollapse(true)}
        />
      )}

      <aside
        className={`fixed top-[61px] bottom-0 left-0 z-30 flex flex-col border-r border-[#EEEDFE] bg-white transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-60'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Navigation Actions */}
        <div className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-light text-primary'
                    : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111111]'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary' : 'text-[#6B7280]'}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions / Collapse Toggle */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]`}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Sign out</span>}
          </Button>

          {/* Collapsible toggle */}
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden w-full justify-center text-[#6B7280] hover:bg-gray-50 hover:text-[#111111] md:flex py-2"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="h-5 w-5" />
                <span>Collapse menu</span>
              </div>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
