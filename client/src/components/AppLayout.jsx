import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';

function AgencyShell() {
  const { openMobile } = useSidebar();

  return (
    <div>
      <Sidebar />
      <div>
        <Navbar onToggleMobile={openMobile} />
        <main>
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
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
