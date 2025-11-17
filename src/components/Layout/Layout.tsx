import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import PlanStatusBanner from './PlanStatusBanner';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import SubscriptionLockOverlay from './SubscriptionLockOverlay';
import HelpChatWidget from '../HelpChat/HelpChatWidget';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  const { profile, selectedArenaContext } = useAuth();
  const { isExpired, isLoading } = useSubscriptionStatus();
  const location = useLocation();

  const isAdminOrStaff = profile?.role === 'admin_arena' || profile?.role === 'funcionario';
  
  const showBanner = isAdminOrStaff && selectedArenaContext && profile && selectedArenaContext.status !== 'suspended';
  const showLockOverlay = isAdminOrStaff && isExpired && location.pathname !== '/settings';
  const showHelpChat = isAdminOrStaff;

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-brand-gray-950 flex flex-col">
      {showHeader && <Header />}
      
      <main className={`relative z-0 flex-1 flex flex-col ${showHeader ? "pt-16" : ""}`}>
        {showLockOverlay && <SubscriptionLockOverlay />}
        {showBanner && <PlanStatusBanner arena={selectedArenaContext!} profile={profile!} />}
        {children}
      </main>
      
      {showHelpChat && <HelpChatWidget />}
    </div>
  );
};

export default Layout;
