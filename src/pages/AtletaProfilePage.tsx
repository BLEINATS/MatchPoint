import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AtletaAluguel, Reserva, Aluno, Quadra, Arena } from '../types';
import { Loader2, Calendar, List, DollarSign, Star, User, ArrowLeft, Mail, Phone, Briefcase, Percent } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import SolicitacoesTab from '../components/Atleta/SolicitacoesTab';
import Layout from '../components/Layout/Layout';
import AtletaAgendaTab from '../components/Atleta/AtletaAgendaTab';
import AtletaFinanceiroTab from '../components/Atleta/AtletaFinanceiroTab';
import AtletaPerfilTab from '../components/Atleta/AtletaPerfilTab';
import AtletaAvaliacoesTab from '../components/Atleta/AtletaAvaliacoesTab';

type TabType = 'solicitacoes' | 'agenda' | 'financeiro' | 'avaliacoes' | 'perfil';

interface AtletaProfileContentProps {
  atletaProfile: AtletaAluguel;
  isAdminView: boolean;
}

const AtletaProfileContent: React.FC<AtletaProfileContentProps> = ({ atletaProfile: initialProfile, isAdminView }) => {
  const { selectedArenaContext, profile } = useAuth();
  const { addToast } = useToast();
  const [atletaProfile, setAtletaProfile] = useState<AtletaAluguel>(initialProfile);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [clientes, setClientes] = useState<Aluno[]>([]);
  const [arenaSettings, setArenaSettings] = useState<Partial<Arena>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('solicitacoes');

  const loadData = useCallback(async () => {
    if (!selectedArenaContext || !atletaProfile.id) return;
    setIsLoading(true);
    try {
      const [reservasRes, quadrasRes, clientesRes, arenaRes] = await Promise.all([
        localApi.select<Reserva>('reservas', selectedArenaContext.id),
        localApi.select<Quadra>('quadras', selectedArenaContext.id),
        localApi.select<Aluno>('alunos', selectedArenaContext.id),
        localApi.select<Arena>('arenas', 'all'),
      ]);

      const atletaReservas = (reservasRes.data || []).filter(r => r.atleta_aluguel_id === atletaProfile.id);
      setReservas(atletaReservas);
      setQuadras(quadrasRes.data || []);
      setClientes(clientesRes.data || []);
      setArenaSettings(arenaRes.data?.find(a => a.id === selectedArenaContext.id) || {});
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedArenaContext, addToast, atletaProfile.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateRequest = async (reserva: Reserva, newStatus: 'aceito' | 'recusado') => {
    if (!atletaProfile || !selectedArenaContext) return;
    try {
      const paymentWindow = arenaSettings.athlete_payment_window_minutes || 30;
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + paymentWindow);

      const updatedReserva: Reserva = {
        ...reserva,
        atleta_aceite_status: newStatus,
        status: 'confirmada', // Status da reserva principal não muda
        atleta_aluguel_id: newStatus === 'recusado' ? null : reserva.atleta_aluguel_id,
        atleta_cost: newStatus === 'recusado' ? undefined : reserva.atleta_cost,
        athlete_payment_deadline: newStatus === 'aceito' ? deadline.toISOString() : null,
      };

      await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);

      const notificationMessage = newStatus === 'aceito'
        ? `aceitou seu convite para o jogo.`
        : `não está disponível para o seu jogo.`;
      
      if (reserva.profile_id) {
        await localApi.upsert('notificacoes', [{
          profile_id: reserva.profile_id,
          arena_id: selectedArenaContext.id,
          message: notificationMessage,
          type: 'game_invite_response',
          sender_id: profile?.id,
          sender_name: profile?.name,
          sender_avatar_url: profile?.avatar_url,
        }], selectedArenaContext.id);
      }
      
      addToast({ message: `Solicitação ${newStatus === 'aceito' ? 'aceita' : 'recusada'}!`, type: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao atualizar solicitação: ${error.message}`, type: 'error' });
    }
  };

  const handleProfileSave = async (updatedData: Partial<AtletaAluguel>) => {
    if (!atletaProfile || !selectedArenaContext) return;
    try {
      const updatedProfile = { ...atletaProfile, ...updatedData };
      await localApi.upsert('atletas_aluguel', [updatedProfile], selectedArenaContext.id);
      setAtletaProfile(updatedProfile);
      addToast({ message: 'Perfil atualizado com sucesso!', type: 'success' });
    } catch (error: any) {
      addToast({ message: `Erro ao salvar perfil: ${error.message}`, type: 'error' });
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'solicitacoes', label: 'Solicitações', icon: List },
    { id: 'agenda', label: 'Minha Agenda', icon: Calendar },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'avaliacoes', label: 'Avaliações', icon: Star },
    { id: 'perfil', label: 'Meu Perfil', icon: User },
  ];

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    
    switch (activeTab) {
      case 'solicitacoes':
        return <SolicitacoesTab reservas={reservas} quadras={quadras} clientes={clientes} onUpdateRequest={handleUpdateRequest} arenaSettings={arenaSettings} />;
      case 'agenda':
        return <AtletaAgendaTab reservas={reservas} quadras={quadras} />;
      case 'financeiro':
        return <AtletaFinanceiroTab atleta={atletaProfile} reservas={reservas} />;
      case 'avaliacoes':
        return <AtletaAvaliacoesTab atleta={atletaProfile} />;
      case 'perfil':
        return <AtletaPerfilTab atleta={atletaProfile} onSave={handleProfileSave} />;
      default: return null;
    }
  };

  const content = (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        {isAdminView && (
          <Link to="/alunos" state={{ activeTab: 'atletas' }} className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Gerenciamento
          </Link>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
          <img src={atletaProfile.avatar_url || `https://avatar.vercel.sh/${atletaProfile.id}.svg`} alt={atletaProfile.name} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-brand-gray-700" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{atletaProfile.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">
              <span className="flex items-center"><Mail className="h-4 w-4 mr-1.5" />{atletaProfile.email}</span>
              <span className="flex items-center"><Phone className="h-4 w-4 mr-1.5" />{atletaProfile.phone}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
        <nav className="-mb-px flex justify-around sm:justify-start sm:space-x-4 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400'
              }`}
            >
              <tab.icon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (isAdminView) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {content}
        </div>
      </Layout>
    );
  }

  return content;
};

const AtletaProfilePageWrapper: React.FC = () => {
    const { id: paramId } = useParams<{ id: string }>();
    const { profile, selectedArenaContext, currentAtletaId } = useAuth();
    const { addToast } = useToast();
    const [atletaProfile, setAtletaProfile] = useState<AtletaAluguel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAdminView = profile?.role === 'admin_arena' || profile?.role === 'funcionario';
    const atletaIdToLoad = isAdminView ? paramId : currentAtletaId;

    useEffect(() => {
        const loadAtletaData = async () => {
            if (!selectedArenaContext || !atletaIdToLoad) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const { data: atletasRes } = await localApi.select<AtletaAluguel>('atletas_aluguel', selectedArenaContext.id);
                const foundProfile = (atletasRes || []).find(p => p.id === atletaIdToLoad);
                setAtletaProfile(foundProfile || null);
            } catch (error: any) {
                addToast({ message: `Erro ao carregar perfil do atleta: ${error.message}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        loadAtletaData();
    }, [selectedArenaContext, addToast, atletaIdToLoad]);

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
            </Layout>
        );
    }
    
    if (!atletaProfile) {
        return (
            <Layout>
                <div className="text-center p-8">Perfil do atleta não encontrado.</div>
            </Layout>
        );
    }

    return <AtletaProfileContent atletaProfile={atletaProfile} isAdminView={isAdminView} />;
};

export default AtletaProfilePageWrapper;
