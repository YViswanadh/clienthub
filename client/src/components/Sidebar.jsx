import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useSidebar } from '../context/SidebarContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Projects', path: '/projects' },
  { name: 'Clients', path: '/clients' },
  { name: 'Invoices', path: '/invoices' },
  { name: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { isCollapsed, toggle } = useSidebar();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path;
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <aside>
      <div>
        <strong>ClientHub</strong>
      </div>

      <nav>
        <ul>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.name}>
                <Link to={item.path}>
                  {active ? `* ${item.name}` : item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div>
        <button onClick={toggle}>
          {isCollapsed ? '[Expand Sidebar]' : '[Collapse Sidebar]'}
        </button>
        <br />
        <div>
          <span>{initials} - {user?.name || 'User'}</span>
          <button onClick={logout}>[Sign Out]</button>
        </div>
      </div>
    </aside>
  );
}
