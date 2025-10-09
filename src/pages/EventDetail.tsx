import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, CheckCircle, Trophy, Users, BarChart3, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Evento, Participant, Match } from '../types';
import ParticipantsTab from '../components/Events/ParticipantsTab';
import BracketTab from '../components/Events/BracketTab';
import EventOverviewTab from '../components/Events/EventOverviewTab';
import ResultsTab from '../components/Events/ResultsTab';

type TabType = 'overview' | 'participants' | 'bracket' | 'results';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { arena } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadData = useCallback(() => {
    if (arena && id) {
      const savedEventos = localStorage.getItem(`eventos_${arena.id}`);
      const eventos: Evento[] = savedEventos ? JSON.parse(savedEventos) : [];
      const currentEvento = eventos.find(e => e.id === id);
      setEvento(currentEvento || null);
    }
  }, [arena, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSave = () => {
    if (!arena || !evento) return;
    setIsSaving(true);
    const savedEventos = localStorage.getItem(`eventos_${arena.id}`);
    const eventos: Evento[] = savedEventos ? JSON.parse(savedEventos) : [];
    const updatedEventos = eventos.map(e => e.id === evento.id ? evento : e);
    localStorage.setItem(`eventos_${arena.id}`, JSON.stringify(updatedEventos));
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 1000);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Trophy },
    { id: 'participants', label: 'Inscritos', icon: Users },
    { id: 'bracket', label: 'Chaves', icon: BarChart3 },
    { id: 'results', label: 'Resultados', icon: ImageIcon },
  ];

  const renderContent = () => {
    if (!evento) return null;
    switch (activeTab) {
      case 'overview':
        return <EventOverviewTab evento={evento} />;
      case 'participants':
        return <ParticipantsTab evento={evento} setEvento={setEvento} />;
      case 'bracket':
        return <BracketTab evento={evento} setEvento={setEvento} />;
      case 'results':
        return <ResultsTab evento={evento} setEvento={setEvento} />;
      default:
        return null;
    }
  };

  if (!evento) {
    return (
      <Layout>
        <div className="text-center py-16">
          <Trophy className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Evento não encontrado</h2>
          <p className="text-brand-gray-500">O evento que você está procurando não existe ou foi removido.</p>
          <Link to="/eventos">
            <Button className="mt-6">Voltar para Eventos</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/eventos" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para todos os eventos
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{evento.name}</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie todos os aspectos do seu evento.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                </Button>
                <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showSuccess ? 'success' : 'save'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center"
                    >
                      {showSuccess ? (
                        <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
            </div>
          </div>
        </motion.div>

        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                    : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
                }`}
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
    </Layout>
  );
};

export default EventDetail;
