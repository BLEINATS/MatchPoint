import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Loader2, Users, User } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Notificacao, Aluno, Profile, Professor, AtletaAluguel } from '../types';
import Button from '../components/Forms/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NotificationComposerModal from '../components/Notificacoes/NotificationComposerModal';

const Notificacoes: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const [notifRes, alunosRes, profilesRes, profsRes, atletasRes] = await Promise.all([
        localApi.select<Notificacao>('notificacoes', arena.id),
        localApi.select<Aluno>('alunos', arena.id),
        localApi.select<Profile>('profiles', 'all'),
        localApi.select<Professor>('professores', arena.id),
        localApi.select<AtletaAluguel>('atletas_aluguel', arena.id),
      ]);
      setNotifications((notifRes.data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setAlunos(alunosRes.data || []);
      setProfiles(profilesRes.data || []);
      setProfessores(profsRes.data || []);
      setAtletas(atletasRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar notificações: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendNotification = async (target: 'all' | 'students' | 'clients' | 'individual', message: string, profileId?: string) => {
    if (!arena) return;

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

    const newNotifications: Omit<Notificacao, 'id' | 'created_at'>[] = uniqueProfileIds.map(pId => ({
      arena_id: arena.id,
      profile_id: pId,
      message,
      type: 'announcement',
      read: false,
    }));

    try {
      await localApi.upsert('notificacoes', newNotifications, arena.id);
      addToast({ message: `Notificação enviada para ${uniqueProfileIds.length} usuário(s)!`, type: 'success' });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Notificação
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
        ) : (
          <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
            <div className="overflow-x-auto">
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
