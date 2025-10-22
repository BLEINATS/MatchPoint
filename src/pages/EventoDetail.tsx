import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, CheckCircle, PartyPopper, List, CreditCard, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Evento, Quadra, Reserva } from '../types';
import EventoModal from '../components/Eventos/EventoModal';
import VisaoGeralTab from '../components/Eventos/VisaoGeralTab';
import ChecklistTab from '../components/Eventos/ChecklistTab';
import FinanceiroTab from '../components/Eventos/FinanceiroTab';
import { eachDayOfInterval, format } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { localApi } from '../lib/localApi';
import { useToast } from '../context/ToastContext';

type TabType = 'overview' | 'checklist' | 'financial';

const EventoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canEdit = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.eventos === 'edit', [profile]);

  const loadData = useCallback(async () => {
    if (arena && id) {
      try {
        const [eventosRes, quadrasRes, reservasRes] = await Promise.all([
          localApi.select<Evento>('eventos', arena.id),
          localApi.select<Quadra>('quadras', arena.id),
          localApi.select<Reserva>('reservas', arena.id)
        ]);
        const currentEvento = eventosRes.data?.find(e => e.id === id);
        setEvento(currentEvento || null);
        setQuadras(quadrasRes.data || []);
        setReservas(reservasRes.data || []);
      } catch (error) {
        addToast({ message: 'Erro ao carregar dados do evento.', type: 'error' });
      }
    }
  }, [arena, id, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSave = async (eventoToSave: Evento) => {
    if (!arena) return;

    try {
      // 1. Save the event itself
      await localApi.upsert('eventos', [eventoToSave], arena.id);
      setEvento(eventoToSave); // Update local state

      // 2. Manage reservation blocks
      const { data: allReservas } = await localApi.select<Reserva>('reservas', arena.id);
      
      // Keep all reservations that are NOT related to this event
      const otherReservas = allReservas.filter(r => r.evento_id !== eventoToSave.id);
      
      let finalReservas = [...otherReservas];

      // 3. If event is confirmed, create new reservation blocks
      if ((eventoToSave.status === 'confirmado' || eventoToSave.status === 'realizado') && eventoToSave.quadras_ids.length > 0) {
          const eventDays = eachDayOfInterval({
              start: parseDateStringAsLocal(eventoToSave.startDate),
              end: parseDateStringAsLocal(eventoToSave.endDate),
          });

          for (const day of eventDays) {
              for (const quadraId of eventoToSave.quadras_ids) {
                  finalReservas.push({
                      id: `reserva_evento_${eventoToSave.id}_${quadraId}_${format(day, 'yyyyMMdd')}`,
                      arena_id: arena.id,
                      quadra_id: quadraId,
                      evento_id: eventoToSave.id,
                      date: format(day, 'yyyy-MM-dd'),
                      start_time: eventoToSave.courtStartTime || eventoToSave.startTime,
                      end_time: eventoToSave.courtEndTime || eventoToSave.endTime,
                      type: 'evento',
                      status: 'confirmada',
                      clientName: `Evento: ${eventoToSave.name}`,
                      isRecurring: false,
                      profile_id: '',
                      created_at: new Date().toISOString(),
                  });
              }
          }
      }
      
      // 4. Overwrite all reservations with the updated list
      await localApi.upsert('reservas', finalReservas, arena.id, true);

    } catch (error: any) {
      addToast({ message: `Erro ao salvar evento: ${error.message}`, type: 'error' });
    }
  };
  
  const handleSaveAndCloseModal = async (eventoData: Evento) => {
    await handleSave(eventoData);
    setIsModalOpen(false);
    addToast({ message: 'Evento atualizado com sucesso!', type: 'success' });
  };

  const handleSaveFromButton = async () => {
    if (!evento) return;
    setIsSaving(true);
    await handleSave(evento);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    addToast({ message: 'Alterações salvas!', type: 'success' });
  }
  
  const handleDelete = async () => {
    if (!arena || !evento || !window.confirm("Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.")) return;
    
    try {
      await localApi.delete('eventos', [evento.id], arena.id);
      
      const { data: currentReservas } = await localApi.select<Reserva>('reservas', arena.id);
      const updatedReservas = currentReservas.filter(r => r.evento_id !== evento.id);
      await localApi.upsert('reservas', updatedReservas, arena.id, true);
      
      addToast({ message: 'Evento excluído com sucesso.', type: 'success' });
      navigate('/eventos');
    } catch (error: any) {
      addToast({ message: `Erro ao excluir evento: ${error.message}`, type: 'error' });
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral', icon: PartyPopper },
    { id: 'checklist', label: 'Checklist', icon: List },
    { id: 'financial', label: 'Financeiro', icon: CreditCard },
  ];

  const renderContent = () => {
    if (!evento) return null;
    switch (activeTab) {
      case 'overview': return <VisaoGeralTab evento={evento} quadras={quadras} />;
      case 'checklist': return <ChecklistTab evento={evento} setEvento={setEvento} />;
      case 'financial': return <FinanceiroTab evento={evento} setEvento={setEvento} />;
      default: return null;
    }
  };

  if (!evento) {
    return <Layout><div className="text-center p-8">Carregando evento...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/eventos" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Painel de Eventos
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{evento.name}</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie todos os detalhes do evento privado.</p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                  </Button>
                  <Button onClick={handleSaveFromButton} isLoading={isSaving} disabled={isSaving}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={showSuccess ? 'success' : 'save'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center">
                        {showSuccess ? <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
                      </motion.span>
                    </AnimatePresence>
                  </Button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'}`}>
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
      
      <EventoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveAndCloseModal} 
        initialData={evento}
        quadras={quadras}
        reservas={reservas}
      />
    </Layout>
  );
};

export default EventoDetail;
