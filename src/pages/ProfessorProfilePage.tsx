import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Professor, Turma, Quadra } from '../types';
import { Loader2, Calendar, DollarSign, BarChart2, User, ArrowLeft, Mail, Phone, Briefcase, Percent } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import ProfessorAgendaView from '../components/Alunos/ProfessorAgendaView';
import ProfessorFinancialTab from '../components/Financeiro/ProfessorFinancialTab';
import ProfessorPerformanceTab from '../components/Financeiro/ProfessorPerformanceTab';
import Layout from '../components/Layout/Layout';

type TabType = 'agenda' | 'financeiro' | 'performance';

interface ProfessorProfileContentProps {
  professorProfile: Professor;
  isAdminView: boolean;
}

const ProfessorProfileContent: React.FC<ProfessorProfileContentProps> = ({ professorProfile, isAdminView }) => {
  const { selectedArenaContext } = useAuth();
  const { addToast } = useToast();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('agenda');

  const loadData = useCallback(async () => {
    if (!selectedArenaContext) return;
    setIsLoading(true);
    try {
      const [turmasRes, quadrasRes] = await Promise.all([
        localApi.select<Turma>('turmas', selectedArenaContext.id),
        localApi.select<Quadra>('quadras', selectedArenaContext.id),
      ]);
      setTurmas(turmasRes.data || []);
      setQuadras(quadrasRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedArenaContext, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const professorTurmas = turmas.filter(t => t.professor_id === professorProfile.id);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
  ];

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    
    switch (activeTab) {
      case 'agenda':
        return <ProfessorAgendaView professores={[professorProfile]} turmas={professorTurmas} quadras={quadras} />;
      case 'financeiro':
        return <ProfessorFinancialTab professor={professorProfile} turmas={professorTurmas} />;
      case 'performance':
        return <ProfessorPerformanceTab professor={professorProfile} turmas={professorTurmas} />;
      default:
        return null;
    }
  };

  const content = (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        {isAdminView && (
          <Link to="/alunos" state={{ activeTab: 'professores' }} className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Gerenciamento
          </Link>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
          <img src={professorProfile.avatar_url || `https://avatar.vercel.sh/${professorProfile.id}.svg`} alt={professorProfile.name} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-brand-gray-700" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{professorProfile.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">
              <span className="flex items-center"><Mail className="h-4 w-4 mr-1.5" />{professorProfile.email}</span>
              <span className="flex items-center"><Phone className="h-4 w-4 mr-1.5" />{professorProfile.phone}</span>
              <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" />{professorProfile.nivel_experiencia}</span>
              {professorProfile.comissao && <span className="flex items-center"><Percent className="h-4 w-4 mr-1.5" />{professorProfile.comissao}% de comissão</span>}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400'}`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
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

const ProfessorProfilePage: React.FC = () => {
    const { id: paramId } = useParams<{ id: string }>();
    const { profile, selectedArenaContext, currentProfessorId } = useAuth();
    const { addToast } = useToast();
    const [professorProfile, setProfessorProfile] = useState<Professor | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAdminView = profile?.role === 'admin_arena' || profile?.role === 'funcionario';
    const professorIdToLoad = isAdminView ? paramId : currentProfessorId;

    useEffect(() => {
        const loadProfessorData = async () => {
            if (!selectedArenaContext || !professorIdToLoad) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const { data: profsRes } = await localApi.select<Professor>('professores', selectedArenaContext.id);
                const foundProfile = (profsRes || []).find(p => p.id === professorIdToLoad);
                setProfessorProfile(foundProfile || null);
            } catch (error: any) {
                addToast({ message: `Erro ao carregar perfil do professor: ${error.message}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        loadProfessorData();
    }, [selectedArenaContext, addToast, professorIdToLoad]);

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
            </Layout>
        );
    }
    
    if (!professorProfile) {
        return (
            <Layout>
                <div className="text-center p-8">Perfil do professor não encontrado.</div>
            </Layout>
        );
    }

    return <ProfessorProfileContent professorProfile={professorProfile} isAdminView={isAdminView} />;
};

export default ProfessorProfilePage;
