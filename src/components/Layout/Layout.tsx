import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import PlanStatusBanner from './PlanStatusBanner';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import SubscriptionLockOverlay from './SubscriptionLockOverlay';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  const { profile, selectedArenaContext } = useAuth();
  const { isExpired } = useSubscriptionStatus();
  const location = useLocation();

  const isAdminOrStaff = profile?.role === 'admin_arena' || profile?.role === 'funcionario';
  
  // The banner is only for active or past_due states, not for expired.
  const showBanner = isAdminOrStaff && selectedArenaContext && profile && !isExpired;
  
  // The lock overlay is for expired plans, but it should NOT show on the settings page.
  const showLockOverlay = isAdminOrStaff && isExpired && location.pathname !== '/settings';

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-brand-gray-900">
      {showHeader && <Header />}
      {showLockOverlay && <SubscriptionLockOverlay />}
      <main className={`relative z-0 ${showHeader ? "pt-16" : ""}`}>
        {showBanner && <PlanStatusBanner arena={selectedArenaContext!} profile={profile!} />}
        {children}
      </main>
    </div>
  );
};

export default Layout;
