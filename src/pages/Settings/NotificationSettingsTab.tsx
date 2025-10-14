import React from 'react';
import { Profile } from '../../types';
import { ToggleSwitch } from '../../components/Gamification/ToggleSwitch';
import { Users, UserPlus, Mail } from 'lucide-react';

interface NotificationSettingsTabProps {
  profile: Partial<Profile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<Profile>>>;
}

const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({ profile, setProfile }) => {
  const handleToggle = (key: 'game_invites' | 'friend_requests' | 'arena_news') => {
    setProfile(prev => ({
      ...prev,
      notification_preferences: {
        ...(prev.notification_preferences || { game_invites: true, friend_requests: true, arena_news: true }),
        [key]: !(prev.notification_preferences?.[key] ?? true), // Default to true if undefined
      },
    }));
  };

  const preferences = profile.notification_preferences || { game_invites: true, friend_requests: true, arena_news: true };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Preferências de Notificação</h3>
      <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-4">
        Escolha quais notificações você deseja receber. As alterações são salvas automaticamente ao clicar em "Salvar Alterações".
      </p>

      <div className="space-y-4 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
        <SettingItem
          icon={Users}
          title="Convites para Jogos"
          description="Receba alertas quando amigos convidarem você para uma partida."
          enabled={preferences.game_invites ?? true}
          onToggle={() => handleToggle('game_invites')}
        />
        <SettingItem
          icon={UserPlus}
          title="Solicitações de Amizade"
          description="Seja notificado sobre novos pedidos de amizade e confirmações."
          enabled={preferences.friend_requests ?? true}
          onToggle={() => handleToggle('friend_requests')}
        />
        <SettingItem
          icon={Mail}
          title="Novidades da Arena"
          description="Receba promoções, notícias e atualizações importantes da arena."
          enabled={preferences.arena_news ?? true}
          onToggle={() => handleToggle('arena_news')}
        />
      </div>
    </div>
  );
};

const SettingItem: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ icon: Icon, title, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between pt-4 first:pt-0">
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-brand-gray-400 mt-1 flex-shrink-0" />
      <div>
        <h4 className="font-medium text-brand-gray-800 dark:text-brand-gray-200">{title}</h4>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{description}</p>
      </div>
    </div>
    <ToggleSwitch enabled={enabled} setEnabled={onToggle} />
  </div>
);

export default NotificationSettingsTab;
