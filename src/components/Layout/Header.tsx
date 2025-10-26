import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Sun, Moon, Settings, Bookmark, LayoutGrid, 
  User as UserIcon, LayoutDashboard, GraduationCap, Trophy, 
  PartyPopper, Calendar, ChevronDown, Loader2, Bell, Gift, DollarSign, Clock, Users, BarChart2, Send, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Forms/Button';
import { localApi } from '../../lib/localApi';
import { Notificacao } from '../../types';
import NotificationsPanel from './NotificationsPanel';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

const Header: React.FC = () => {
  const { user, arena, profile, signOut, isLoading, selectedArenaContext } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isAdminView = profile?.role === 'admin_arena';
  const isStaffView = profile?.role === 'funcionario';

  const dashboardPath = useMemo(() => {
    switch (profile?.role) {
      case 'super_admin':
        return '/superadmin';
      case 'admin_arena':
      case 'funcionario':
        return '/dashboard';
      case 'cliente':
        return '/perfil';
      default:
        return '/';
    }
  }, [profile]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
      setIsProfileMenuOpen(false);
    }
    if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
      setIsNotificationsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  useEffect(() => {
    if (!profile || !selectedArenaContext) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      const { data, error } = await localApi.select<Notificacao>('notificacoes', selectedArenaContext.id);

      if (error) {
        console.error("Erro ao buscar notificações:", error);
      } else {
        let filteredData = data || [];

        if (profile.role === 'admin_arena') {
          filteredData = filteredData.filter(n => n.profile_id === profile.id || !n.profile_id);
        } else {
          filteredData = filteredData.filter(n => n.profile_id === profile.id);
        }

        const sortedAndLimitedData = filteredData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20);

        setNotifications(sortedAndLimitedData);
        setUnreadCount(sortedAndLimitedData.filter(n => !n.read).length);
      }
    };

    fetchNotifications();
  }, [profile, selectedArenaContext, addToast]);


  const handleMarkAsRead = async (id: string) => {
    if (!selectedArenaContext) return;
    const notificationToUpdate = notifications.find(n => n.id === id);
    if (!notificationToUpdate) return;

    const { error } = await localApi.upsert('notificacoes', [{ ...notificationToUpdate, read: true }], selectedArenaContext.id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!selectedArenaContext) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;
    
    const updatedNotifications = unreadNotifications.map(n => ({ ...n, read: true }));

    const { error } = await localApi.upsert('notificacoes', updatedNotifications, selectedArenaContext.id);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavIconButton: React.FC<{ to: string; title: string; children: React.ReactNode }> = ({ to, title, children }) => (
    <button
      onClick={() => navigate(to)}
      title={title}
      className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
    >
      {children}
    </button>
  );

  return (
    <header className="bg-white dark:bg-brand-gray-800 shadow-sm border-b border-brand-gray-200 dark:border-brand-gray-700 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={dashboardPath} className="flex items-center">
              <Calendar className="h-8 w-8 text-brand-blue-500" />
              <span className="ml-2 text-xl font-bold text-brand-gray-900 dark:text-white">
                MatchPlay
              </span>
            </Link>
            {(isAdminView || isStaffView) && selectedArenaContext && (
              <div className="ml-4 pl-4 border-l border-brand-gray-300 dark:border-brand-gray-600 hidden sm:flex items-center gap-3">
                {selectedArenaContext.logo_url ? (
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-brand-gray-200 dark:border-brand-gray-700">
                    <img src={selectedArenaContext.logo_url} alt={`Logo de ${selectedArenaContext.name}`} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center text-brand-gray-500 font-bold">
                    {selectedArenaContext.name ? selectedArenaContext.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <span className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">
                  {selectedArenaContext.name}
                  {isStaffView && profile && <span className="font-normal text-brand-gray-500"> • {profile.name}</span>}
                </span>
                <div className="w-px h-6 bg-brand-gray-300 dark:bg-brand-gray-600"></div>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-gray-600 dark:text-brand-gray-400" title="Horário Atual">
                  <Clock className="h-4 w-4" />
                  <span>{format(currentTime, 'HH:mm:ss')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand-gray-500" />
            ) : user && profile ? (
              <>
                {isAdminView && (
                  <div className="hidden md:flex items-center gap-1">
                    <NavIconButton to="/quadras" title="Minhas Quadras"><LayoutGrid className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/reservas" title="Reservas"><Bookmark className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/alunos" title="Gerenciamento"><GraduationCap className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/torneios" title="Torneios"><Trophy className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/eventos" title="Eventos"><PartyPopper className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/loja" title="Loja"><ShoppingBag className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/financeiro" title="Financeiro"><DollarSign className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/gamification" title="Gamificação"><Gift className="h-5 w-5" /></NavIconButton>
                    <NavIconButton to="/notificacoes" title="Notificações"><Send className="h-5 w-5" /></NavIconButton>
                  </div>
                )}
                {isStaffView && (
                  <div className="hidden md:flex items-center gap-1">
                    {profile.permissions?.reservas !== 'none' && <NavIconButton to="/reservas" title="Reservas"><Bookmark className="h-5 w-5" /></NavIconButton>}
                    {profile.permissions?.quadras !== 'none' && <NavIconButton to="/quadras" title="Quadras"><LayoutGrid className="h-5 w-5" /></NavIconButton>}
                    {profile.permissions?.gerenciamento_arena !== 'none' && <NavIconButton to="/alunos" title="Gerenciamento"><GraduationCap className="h-5 w-5" /></NavIconButton>}
                    {profile.permissions?.torneios !== 'none' && <NavIconButton to="/torneios" title="Torneios"><Trophy className="h-5 w-5" /></NavIconButton>}
                    {profile.permissions?.eventos !== 'none' && <NavIconButton to="/eventos" title="Eventos"><PartyPopper className="h-5 w-5" /></NavIconButton>}
                    {profile.permissions?.financeiro !== 'none' && <NavIconButton to="/financeiro" title="Financeiro"><DollarSign className="h-5 w-5" /></NavIconButton>}
                    {profile.permissions?.gamification !== 'none' && <NavIconButton to="/gamification" title="Gamificação"><Gift className="h-5 w-5" /></NavIconButton>}
                  </div>
                )}
                
                <div className="relative" ref={notificationsRef}>
                  <button onClick={() => setIsNotificationsOpen(p => !p)} className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-brand-gray-800" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <NotificationsPanel 
                        notifications={notifications} 
                        onClose={() => setIsNotificationsOpen(false)}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        unreadCount={unreadCount}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                    <div className="w-8 h-8 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-brand-gray-500" />
                      )}
                    </div>
                    {(!isAdminView && !isStaffView) && (
                      <span className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200 hidden sm:block">
                        {profile.name}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 text-brand-gray-500 hidden sm:block" />
                  </button>
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-56 bg-white dark:bg-brand-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="px-4 py-3">
                          <p className="text-sm font-medium text-brand-gray-900 dark:text-white truncate">{profile.name}</p>
                          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate">{profile.email}</p>
                        </div>
                        <div className="py-1 border-t border-brand-gray-200 dark:border-brand-gray-700">
                          <Link to={dashboardPath} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center w-full px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                            <LayoutDashboard className="h-4 w-4 mr-3" /> Meu Painel
                          </Link>
                          <Link to="/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center w-full px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                            <Settings className="h-4 w-4 mr-3" /> Configurações
                          </Link>
                        </div>
                        <div className="py-1 border-t border-brand-gray-200 dark:border-brand-gray-700">
                          <button onClick={handleSignOut} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <LogOut className="h-4 w-4 mr-3" /> Sair
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="outline">Entrar</Button>
            )}
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
              whileTap={{ scale: 0.9, rotate: 90 }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
