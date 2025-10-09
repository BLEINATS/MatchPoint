import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Notificacao } from '../../types';
import { Bell, Check, X, Info, User, DollarSign, Calendar, Gift, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';

interface NotificationsPanelProps {
  notifications: Notificacao[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  unreadCount: number;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'nova_reserva':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'cancelamento':
      return <X className="h-5 w-5 text-red-500" />;
    case 'credito':
      return <DollarSign className="h-5 w-5 text-green-500" />;
    case 'novo_cliente':
      return <User className="h-5 w-5 text-purple-500" />;
    case 'gamification_points':
      return <Gift className="h-5 w-5 text-yellow-500" />;
    case 'gamification_reward':
      return <Trophy className="h-5 w-5 text-orange-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

const NotificationItem: React.FC<{ notification: Notificacao; onMarkAsRead: (id: string) => void }> = ({ notification, onMarkAsRead }) => {
  return (
    <div
      className={`p-3 flex items-start gap-3 transition-colors ${
        !notification.read ? 'bg-blue-50 dark:bg-brand-blue-500/10' : 'hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50'
      }`}
    >
      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1">
        <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200">{notification.message}</p>
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {!notification.read && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          title="Marcar como lida"
          className="p-1 rounded-full text-brand-gray-400 hover:text-brand-blue-500 hover:bg-blue-100 dark:hover:bg-brand-blue-900/50"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose, onMarkAsRead, onMarkAllAsRead, unreadCount }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-80 bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 flex flex-col max-h-[70vh]"
    >
      <div className="flex justify-between items-center p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="font-semibold text-brand-gray-900 dark:text-white">Notificações</h3>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            Marcar todas como lidas
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onMarkAsRead={onMarkAsRead} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-brand-gray-500">
            <Bell className="h-10 w-10 mx-auto mb-2 text-brand-gray-400" />
            <p className="text-sm">Nenhuma notificação por aqui.</p>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-brand-gray-200 dark:border-brand-gray-700 text-center">
        <Link to="#" className="text-sm font-medium text-brand-blue-600 dark:text-brand-blue-400 hover:underline">
          Ver todas
        </Link>
      </div>
    </motion.div>
  );
};

export default NotificationsPanel;
