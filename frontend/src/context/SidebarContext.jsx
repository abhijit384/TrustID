import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('trustid_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem('trustid_sidebar_open', String(next));
      return next;
    });
  };

  const closeSidebar = () => {
    setIsOpen(false);
    localStorage.setItem('trustid_sidebar_open', 'false');
  };

  const openSidebar = () => {
    setIsOpen(true);
    localStorage.setItem('trustid_sidebar_open', 'true');
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, openSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
