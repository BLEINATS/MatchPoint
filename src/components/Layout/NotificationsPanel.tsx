import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Notificacao } from '../../types';
import { Bell, Info, User as UserIcon, DollarSign, Calendar, Gift, Trophy, XCircle, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'nova_reserva':
    case 'game_invite':
    case 'game_invite_response':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'cancellation':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'payment_received':
    case 'credito':
      return <DollarSign className="h-5 w-5 text-green-500" />;
    case 'novo_cliente':
    case 'friend_requests':
      return <UserIcon className="h-5 w-5 text-purple-500" />;
    case 'gamification_points':
      return <Gift className="h-5 w-5 text-yellow-500" />;
    case 'gamification_reward':
      return <Trophy className="h-5 w-5 text-orange-500" />;
    case 'announcement':
    case 'tournament_announcement':
      return <Send className="h-5 w-5 text-indigo-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

interface NotificationItemProps {
  notification: Notificacao;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose, onMarkAsRead }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link_to) {
      navigate(notification.link_to);
    }
    onClose();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 flex items-start gap-4 transition-colors ${
        !notification.read ? 'bg-blue-50 dark:bg-brand-blue-500/10' : 'hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50'
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        {notification.sender_avatar_url ? (
          <img src={notification.sender_avatar_url} alt={notification.sender_name || 'Sender'} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200 whitespace-pre-wrap break-words">
          {notification.sender_name ? (
            <>
              <strong className="font-semibold">{notification.sender_name}</strong>
              <span className="text-brand-gray-600 dark:text-brand-gray-400"> {notification.message}</span>
            </>
          ) : (
            notification.message
          )}
        </p>
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-blue-500"></div>
        </div>
      )}
    </button>
  );
};

interface NotificationsPanelProps {
  notifications: Notificacao[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  unreadCount: number;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose, onMarkAsRead, onMarkAllAsRead, onClearAll, unreadCount }) => {
  
  const panelContent = (
    <>
      <div className="flex justify-between items-center p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="font-semibold text-brand-gray-900 dark:text-white">Notificações</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
              Marcar como lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearAll} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              Limpar
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onMarkAsRead={onMarkAsRead} onClose={onClose} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-brand-gray-500">
            <Bell className="h-10 w-10 mx-auto mb-2 text-brand-gray-400" />
            <p className="text-sm">Nenhuma notificação por aqui.</p>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-brand-gray-200 dark:border-brand-gray-700 text-center md:hidden">
        <button onClick={onClose} className="text-sm font-medium text-brand-blue-600 dark:text-brand-blue-400 hover:underline">
          Fechar
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Modal View */}
      <div className="md:hidden">
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-lg bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            {panelContent}
          </motion.div>
        </motion.div>
      </div>

      {/* Desktop Dropdown View */}
      <motion.div
        key="desktop-panel"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="hidden md:block absolute z-50 w-96 top-full right-0 mt-2"
      >
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg flex flex-col max-h-[80vh] border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
          {panelContent}
        </div>
      </motion.div>
    </>
  );
};

export default NotificationsPanel;
