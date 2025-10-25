import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-brand-gray-900">
      {showHeader && <Header />}
      <main className={`relative z-0 ${showHeader ? "pt-16" : ""}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
