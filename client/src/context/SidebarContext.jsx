import React, { createContext, useState, useContext } from 'react';

const SidebarContext = createContext({
  isCollapsed: false,
  toggle: () => {},
  isMobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
});

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggle,
        isMobileOpen,
        openMobile: () => setIsMobileOpen(true),
        closeMobile: () => setIsMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
export default SidebarContext;
