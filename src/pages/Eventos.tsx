import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, PartyPopper, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Evento, Quadra, Reserva } from '../types';
import EventoModal from '../components/Eventos/EventoModal';
import KanbanBoard from '../components/Eventos/KanbanBoard';
import { eachDayOfInterval, format } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { supabaseApi } from '../lib/supabaseApi';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

const Eventos: React.FC = () => {
  const { selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canView = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.eventos === 'view' || profile?.permissions?.eventos === 'edit', [profile]);
  const canEdit = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.eventos === 'edit', [profile]);

  const loadData = useCallback(async () => {
    if (!arena) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const [eventosRes, quadrasRes, reservasRes] = await Promise.all([
        supabaseApi.select<Evento>('eventos', arena.id),
        supabaseApi.select<Quadra>('quadras', arena.id),
        supabaseApi.select<Reserva>('reservas', arena.id),
      ]);
      
      setEventos(eventosRes.data || []);
      setQuadras(quadrasRes.data || []);
      setReservas(reservasRes.data || []);
      
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados de eventos: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const handleSaveEvento = async (eventoData: Omit<Evento, 'id' | 'arena_id' | 'created_at'> | Evento) => {
    if (!arena) return;

    try {
        const isEditing = 'id' in eventoData;
        const eventoId = isEditing ? eventoData.id : `evento_privado_${uuidv4()}`;
        
        const newEvento: Evento = isEditing 
          ? eventoData as Evento
          : { 
              ...eventoData, 
              id: eventoId, 
              arena_id: arena.id, 
              created_at: new Date().toISOString(),
              checklist: [
                { id: `task_${eventoId}_1`, text: 'Confirmar pagamento do sinal', completed: false },
                { id: `task_${eventoId}_2`, text: 'Enviar contrato para o cliente', completed: false },
                { id: `task_${eventoId}_3`, text: 'Reservar equipe (segurança, limpeza)', completed: false },
                { id: `task_${eventoId}_4`, text: 'Verificar limpeza pré-evento', completed: false },
              ],
              payments: [],
            } as Evento;

        await supabaseApi.upsert('eventos', [newEvento], arena.id);

        const { data: currentReservas } = await supabaseApi.select<Reserva>('reservas', arena.id);
        const otherReservas = currentReservas.filter(r => r.evento_id !== eventoId);
        let finalReservas = [...otherReservas];

        if ((newEvento.status === 'confirmado' || newEvento.status === 'realizado') && newEvento.quadras_ids.length > 0) {
            const eventDays = eachDayOfInterval({
                start: parseDateStringAsLocal(newEvento.startDate),
                end: parseDateStringAsLocal(newEvento.endDate),
            });

            for (const day of eventDays) {
                for (const quadraId of newEvento.quadras_ids) {
                    finalReservas.push({
                        id: `reserva_evento_${eventoId}_${quadraId}_${format(day, 'yyyyMMdd')}`,
                        arena_id: arena.id,
                        quadra_id: quadraId,
                        evento_id: eventoId,
                        date: format(day, 'yyyy-MM-dd'),
                        start_time: newEvento.courtStartTime || newEvento.startTime,
                        end_time: newEvento.courtEndTime || newEvento.endTime,
                        type: 'evento',
                        status: 'confirmada',
                        clientName: `Evento: ${newEvento.name}`,
                        isRecurring: false,
                        profile_id: '',
                        created_at: new Date().toISOString(),
                    });
                }
            }
        }
        
        await supabaseApi.upsert('reservas', finalReservas, arena.id, true);

        addToast({ message: 'Evento salvo com sucesso!', type: 'success' });
        await loadData();
        setIsModalOpen(false);
        setEditingEvento(null);

    } catch (error: any) {
        addToast({ message: `Erro ao salvar evento: ${error.message}`, type: 'error' });
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  }

  if (!canView) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-brand-gray-500">Você não tem permissão para acessar esta área.</p>
          <Link to="/dashboard"><Button className="mt-4">Voltar para o Painel</Button></Link>
        </div>
      </Layout>
    );
  }

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
                  <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Gestão de Eventos Privados</h1>
                  <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie orçamentos e locações de espaço para festas, aniversários e mais.</p>
              </div>
              {canEdit && (
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Orçamento
                </Button>
              )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" />
          </div>
        ) : eventos.length > 0 ? (
            <KanbanBoard eventos={eventos} setEventos={setEventos} />
        ) : (
            <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
                <div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6">
                <PartyPopper className="h-8 w-8 text-brand-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">Nenhum evento encontrado</h3>
                <p className="text-brand-gray-600 dark:text-brand-gray-400">Clique em 'Novo Orçamento' para criar sua primeira proposta de evento.</p>
            </motion.div>
            </div>
        )}
      </div>

      <EventoModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveEvento} 
        initialData={editingEvento}
        quadras={quadras}
        reservas={reservas}
      />
    </Layout>
  );
};

export default Eventos;
