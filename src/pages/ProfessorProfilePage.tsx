import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, User, Mail, Phone, Briefcase, Percent, FileText, Calendar, DollarSign, BarChart2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Professor, Turma, Quadra } from '../types';
import { localApi } from '../lib/localApi';
import ProfessorAgendaView from '../components/Alunos/ProfessorAgendaView';
import ProfessorFinancialTab from '../components/Financeiro/ProfessorFinancialTab';
import ProfessorPerformanceTab from '../components/Financeiro/ProfessorPerformanceTab';
import Button from '../components/Forms/Button';

type TabType = 'agenda' | 'financeiro' | 'performance';

const ProfessorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { arena } = useAuth();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('agenda');

  const loadData = useCallback(async () => {
    if (!arena || !id) return;
    setIsLoading(true);
    try {
      const [profRes, turmasRes, quadrasRes] = await Promise.all([
        localApi.select<Professor>('professores', arena.id),
        localApi.select<Turma>('turmas', arena.id),
        localApi.select<Quadra>('quadras', arena.id),
      ]);
      const currentProfessor = profRes.data?.find(p => p.id === id);
      setProfessor(currentProfessor || null);
      setTurmas(turmasRes.data || []);
      setQuadras(quadrasRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados do professor:", error);
    } finally {
      setIsLoading(false);
    }
  }, [arena, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const professorTurmas = turmas.filter(t => t.professor_id === professor?.id);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
  ];

  const renderContent = () => {
    if (!professor) return null;
    switch (activeTab) {
      case 'agenda':
        return <ProfessorAgendaView professores={[professor]} turmas={professorTurmas} quadras={quadras} />;
      case 'financeiro':
        return <ProfessorFinancialTab professor={professor} turmas={professorTurmas} />;
      case 'performance':
        return <ProfessorPerformanceTab professor={professor} turmas={professorTurmas} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Layout><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div></Layout>;
  }

  if (!professor) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Professor não encontrado</h2>
          <Link to="/alunos"><Button className="mt-4">Voltar</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/alunos" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Gerenciamento
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
            <img src={professor.avatar_url || `https://avatar.vercel.sh/${professor.id}.svg`} alt={professor.name} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-brand-gray-700" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{professor.name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">
                <span className="flex items-center"><Mail className="h-4 w-4 mr-1.5" />{professor.email}</span>
                <span className="flex items-center"><Phone className="h-4 w-4 mr-1.5" />{professor.phone}</span>
                <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" />{professor.nivel_experiencia}</span>
                <span className="flex items-center"><Percent className="h-4 w-4 mr-1.5" />{professor.comissao}% de comissão</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700'}`}>
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
    </Layout>
  );
};

export default ProfessorProfilePage;
