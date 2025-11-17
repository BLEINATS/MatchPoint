import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Send, Loader2, User } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabaseApi } from '../lib/supabaseApi';
import { Notificacao, Aluno, Profile, Professor, AtletaAluguel } from '../types';
import Button from '../components/Forms/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NotificationComposerModal from '../components/Notificacoes/NotificationComposerModal';

const Notificacoes: React.FC = () => {
  const { selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canEdit = useMemo(() => profile?.role === 'admin_arena', [profile]);

  const loadData = useCallback(async () => {
    if (!arena || !profile) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [notifRes, alunosRes, profilesRes, profsRes, atletasRes] = await Promise.all([
        supabaseApi.select<Notificacao>('notificacoes', arena.id),
        supabaseApi.select<Aluno>('alunos', arena.id),
        supabaseApi.select<Profile>('profiles', 'all'),
        supabaseApi.select<Professor>('professores', arena.id),
        supabaseApi.select<AtletaAluguel>('atletas_aluguel', arena.id),
      ]);
      
      let filteredNotifs = notifRes.data || [];
      if (profile.role !== 'admin_arena') {
        filteredNotifs = filteredNotifs.filter(n => n.profile_id === profile.id);
      }

      setNotifications(filteredNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setAlunos(alunosRes.data || []);
      setProfiles(profilesRes.data || []);
      setProfessores(profsRes.data || []);
      setAtletas(atletasRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar notificações: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast, profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendNotification = async (target: 'all' | 'students' | 'clients' | 'individual', message: string, profileId?: string) => {
    if (!arena || !profile) return;

    let targetProfileIds: string[] = [];

    if (target === 'individual' && profileId) {
        targetProfileIds = [profileId];
    } else if (target === 'all') {
      targetProfileIds = alunos.map(a => a.profile_id).filter((id): id is string => !!id);
    } else if (target === 'students') {
      targetProfileIds = alunos.filter(a => a.plan_id).map(a => a.profile_id).filter((id): id is string => !!id);
    } else if (target === 'clients') {
      targetProfileIds = alunos.filter(a => !a.plan_id).map(a => a.profile_id).filter((id): id is string => !!id);
    }

    const uniqueProfileIds = [...new Set(targetProfileIds)];

    if (uniqueProfileIds.length === 0) {
      addToast({ message: 'Nenhum destinatário encontrado para este público.', type: 'info' });
      return;
    }

    const { data: allProfiles } = await supabaseApi.select<Profile>('profiles', 'all');
    const profilesMap = new Map((allProfiles || []).map(p => [p.id, p]));

    const newNotifications: Omit<Notificacao, 'id' | 'created_at'>[] = uniqueProfileIds
        .map(pId => {
            const recipientProfile = profilesMap.get(pId);
            const wantsNews = recipientProfile?.notification_preferences?.arena_news ?? true;
            if (wantsNews) {
                return {
                    arena_id: arena.id,
                    profile_id: pId,
                    message,
                    type: 'announcement',
                    read: false,
                    sender_id: profile.id,
                    sender_name: profile.name,
                    sender_avatar_url: profile.avatar_url,
                };
            }
            return null;
        })
        .filter((n): n is NonNullable<typeof n> => n !== null);

    if (newNotifications.length === 0) {
        addToast({ message: 'Nenhum destinatário com notificações de novidades ativadas foi encontrado.', type: 'info' });
        return;
    }

    try {
      await supabaseApi.upsert('notificacoes', newNotifications, arena.id);
      addToast({ message: `Notificação enviada para ${newNotifications.length} usuário(s)!`, type: 'success' });
      loadData();
      setIsModalOpen(false);
    } catch (error: any) {
      addToast({ message: `Erro ao enviar notificação: ${error.message}`, type: 'error' });
    }
  };

  const getTargetDescription = (notification: Notificacao): string => {
    if (notification.profile_id) {
      const profile = profiles.find(p => p.id === notification.profile_id);
      return profile?.name || 'Usuário individual';
    }
    return 'Todos os usuários';
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Central de Notificações</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Envie comunicados para seus clientes e alunos.</p>
            </div>
            {canEdit && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
        ) : (
          <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Mensagem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Destinatário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                  {notifications.map(notif => (
                    <tr key={notif.id}>
                      <td className="px-6 py-4 whitespace-pre-wrap text-sm text-brand-gray-800 dark:text-brand-gray-200 max-w-md">{notif.message}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{getTargetDescription(notif)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                    </tr>
                  ))}
                  {notifications.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-brand-gray-500">Nenhuma notificação enviada ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200 whitespace-pre-wrap">{notif.message}</p>
                  <div className="mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-600 text-xs text-brand-gray-500 dark:text-brand-gray-400 flex justify-between items-center">
                    <span className="flex items-center gap-1"><User className="h-3 w-3"/>{getTargetDescription(notif)}</span>
                    <span>{format(new Date(notif.created_at), 'dd/MM/yy HH:mm')}</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center py-8 text-sm text-brand-gray-500">Nenhuma notificação enviada.</p>
              )}
            </div>
          </div>
        )}
      </div>
      <NotificationComposerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSendNotification}
        alunos={alunos}
        professores={professores}
        atletas={atletas}
      />
    </Layout>
  );
};

export default Notificacoes;
