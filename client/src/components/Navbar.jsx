import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { Bell, LogOut, Menu, User, Settings, FolderKanban, Receipt, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, isAgency } = useAuth();
  const location = useLocation();
  const socket = useSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Set up socket listeners for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleFileApproved = (data) => {
      setNotifications((prev) => [
        { id: Date.now(), text: `File "${data.fileName}" was approved!`, read: false },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleInvoicePaid = (data) => {
      setNotifications((prev) => [
        { id: Date.now(), text: `Invoice #${data.invoiceNumber} has been paid.`, read: false },
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

  const handleBellClick = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#EEEDFE] bg-white px-6 py-3">
      <div className="mx-auto flex items-center justify-between">
        
        {/* Left Section: Logo + Toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5 text-[#6B7280]" />
          </Button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111111] font-sans">
              Client<span className="text-primary">Hub</span>
            </span>
          </Link>
        </div>

        {/* Center Section: Navigation Links (Agency only) */}
        {isAgency && (
          <div className="hidden items-center gap-1 md:flex">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary-light text-primary'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/projects') || location.pathname.startsWith('/projects/')
                  ? 'bg-primary-light text-primary'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-gray-50'
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </Link>
            <Link
              to="/invoices"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/invoices')
                  ? 'bg-primary-light text-primary'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-gray-50'
              }`}
            >
              <Receipt className="h-4 w-4" />
              Invoices
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'bg-primary-light text-primary'
                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        )}

        {/* Right Section: Notifications Bell + Profile Dropdown */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-[#6B7280] hover:text-[#111111] hover:bg-gray-50 rounded-full"
                onClick={handleBellClick}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <DropdownMenuLabel className="font-semibold text-[#111111]">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#6B7280]">
                  No new notifications
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg text-sm transition-colors ${
                        n.read ? 'text-[#6B7280] bg-white' : 'text-[#111111] bg-primary-light/40 font-medium'
                      }`}
                    >
                      {n.text}
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary-light">
                <Avatar className="h-9 w-9 border border-[#EEEDFE]">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary-light text-primary font-bold text-sm">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 py-1">
                  <p className="text-sm font-semibold leading-none text-[#111111]">{user?.name}</p>
                  <p className="text-xs leading-none text-[#6B7280]">{user?.email}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-primary mt-1">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAgency && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex w-full items-center gap-2 cursor-pointer py-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={logout}
                className="flex w-full items-center gap-2 text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer py-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </div>
    </nav>
  );
}
