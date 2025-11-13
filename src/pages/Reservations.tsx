{`{/*
  ======================================================================
  ||  ATENÇÃO: LÓGICA DE ESTADO CRÍTICA - NÃO ALTERAR LEVEMENTE      ||
  ======================================================================
  || Este arquivo foi refatorado para resolver problemas de          ||
  || inconsistência de estado ao navegar entre as abas (Agenda,      ||
  || Calendário, Lista) e ao fechar modais. A lógica agora           ||
  || centraliza o carregamento e a expansão de dados no componente   ||
  || principal (Reservations) e passa os dados processados para as   ||
  || abas filhas.                                                    ||
  ||                                                                 ||
  || -> NÃO reintroduza lógicas de fetch ou state management         ||
  ||    separadas dentro das abas individuais.                       ||
  || -> Qualquer alteração aqui deve ser testada exaustivamente      ||
  ||    em todos os cenários de navegação e interação.               ||
  ======================================================================
*/}`}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Calendar, List, Plus, SlidersHorizontal, ArrowLeft, Loader2, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { Quadra, Reserva, ReservationType, Aluno, AtletaAluguel, Arena } from '../types';
import AgendaView from '../components/Reservations/AgendaView';
import ListView from '../components/Reservations/ListView';
import CalendarView from '../components/Reservations/CalendarView';
import ReservationModal from '../components/Reservations/ReservationModal';
import CancellationModal from '../components/Reservations/CancellationModal';
import ManualCancellationModal from '../components/Reservations/ManualCancellationModal';
import ReservationLegend from '../components/Reservations/ReservationLegend';
import FilterPanel from '../components/Reservations/FilterPanel';
import { startOfDay, format, startOfMonth, endOfMonth, isBefore, parse, addYears, subYears, getDay, addDays, endOfDay, addMinutes, isSameDay, isWithinInterval } from 'date-fns';
import { expandRecurringReservations } from '../utils/reservationUtils';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { awardPointsForCompletedReservation, processCancellation } from '../utils/gamificationUtils';
import { formatCurrency } from '../utils/formatters';
import DayDetailView from '../components/Reservations/DayDetailView';
import MensalistaDetailModal from '../components/Reservations/MensalistaDetailModal';
import ConfirmationModal from '../components/Shared/ConfirmationModal';

type ViewMode = 'agenda' | 'calendar' | 'list';

const Reservations: React.FC = () => {
  const { selectedArenaContext, profile, allArenas, updateArena } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reserva | null>(null);
  const [newReservationSlot, setNewReservationSlot] = useState<{ quadraId: string, time: string, type?: ReservationType } | null>(null);
  
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | Reserva['status'],
    type: 'all' as 'all' | ReservationType,
    clientName: '',
    quadraId: 'all' as 'all' | string,
    startDate: '',
    endDate: '',
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isManualCancelModalOpen, setIsManualCancelModalOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reserva | null>(null);
  const [isMensalistaModalOpen, setIsMensalistaModalOpen] = useState(false);
  const [selectedMensalistaReserva, setSelectedMensalistaReserva] = useState<Reserva | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'reserva' } | null>(null);
  
  const canView = useMemo(() => 
    profile?.role === 'admin_arena' || 
    profile?.permissions?.reservas === 'view' || 
    profile?.permissions?.reservas === 'edit', 
  [profile]);

  const canEdit = useMemo(() => 
    profile?.role === 'admin_arena' || 
    profile?.permissions?.reservas === 'edit', 
  [profile]);

  const loadData = useCallback(async (forceReload = false) => {
    if (!selectedArenaContext) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [quadrasRes, reservasRes, alunosRes, atletasRes] = await Promise.all([
        localApi.select<Quadra>('quadras', selectedArenaContext.id),
        localApi.select<Reserva>('reservas', selectedArenaContext.id),
        localApi.select<Aluno>('alunos', selectedArenaContext.id),
        localApi.select<AtletaAluguel>('atletas_aluguel', selectedArenaContext.id),
      ]);
      
      const now = new Date();
      let reservationsData = reservasRes.data || [];
      let updated = false;

      reservationsData = reservationsData.map(r => {
        if (r.status === 'aguardando_pagamento' && r.payment_deadline && isBefore(new Date(r.payment_deadline), now)) {
          updated = true;
          return { ...r, status: 'cancelada', notes: (r.notes || '') + ' [Cancelado automaticamente por falta de pagamento]' };
        }
        return r;
      });

      if (updated) {
        await localApi.upsert('reservas', reservationsData, selectedArenaContext.id, true);
        addToast({ message: 'Algumas reservas pendentes expiraram e foram canceladas.', type: 'info' });
      }

      setQuadras(quadrasRes.data || []);
      setReservas(reservationsData);
      setAlunos(alunosRes.data || []);
      setAtletas(atletasRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedArenaContext, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedReservation(null);
    setNewReservationSlot(null);
    loadData(true);
  }, [loadData]);
  
  const closeMensalistaModal = useCallback(() => {
    setIsMensalistaModalOpen(false);
    setSelectedMensalistaReserva(null);
  }, []);

  useEffect(() => {
    let stateHandled = false;
    if (location.state?.selectedDate) {
      const dateFromState = new Date(location.state.selectedDate);
      if (!isNaN(dateFromState.getTime())) { setSelectedDate(startOfDay(dateFromState)); stateHandled = true; }
    }
    if (location.state?.quadraId) {
      setFilters(prev => ({ ...prev, quadraId: location.state.quadraId }));
      setIsFilterPanelOpen(true); setViewMode('agenda'); stateHandled = true;
    }
    if (location.state?.openModal) {
      if (!canEdit) {
        addToast({ message: 'Você não tem permissão para criar novas reservas.', type: 'error' });
        return;
      }
      setNewReservationSlot({ 
        quadraId: location.state.quadraId || '',
        time: location.state.time || '',
        type: location.state.type || 'avulsa' 
      });
      setSelectedReservation(null); setIsModalOpen(true); stateHandled = true;
    }
    if (location.state?.editReservaId) {
        const reservaToEdit = reservas.find(r => r.id === location.state.editReservaId);
        if (reservaToEdit) {
            openEditReservationModal(reservaToEdit, location.state.forceEdit);
            stateHandled = true;
        }
    }
    if (stateHandled) navigate(location.pathname, { replace: true });
  }, [location.state, navigate, canEdit, addToast, reservas]);

  const allExpandedReservations = useMemo(() => {
    const viewStartDate = subYears(new Date(), 1);
    const viewEndDate = addYears(new Date(), 1);
    return expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);
  }, [reservas, quadras]);

  const displayedReservations = useMemo(() => {
    let filtered = allExpandedReservations;

    if (filters.quadraId !== 'all') {
      filtered = filtered.filter(r => r.quadra_id === filters.quadraId);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type);
    }
    if (filters.clientName.trim() !== '') {
      filtered = filtered.filter(r => r.clientName?.toLowerCase().includes(filters.clientName.trim().toLowerCase()));
    }
    
    return filtered;
  }, [allExpandedReservations, filters]);

  const agendaReservations = useMemo(() => {
    return displayedReservations.filter(r => isSameDay(parseDateStringAsLocal(r.date), selectedDate) && r.status !== 'cancelada');
  }, [displayedReservations, selectedDate]);

  const filteredQuadras = useMemo(() => filters.quadraId === 'all' ? quadras : quadras.filter(q => q.id === filters.quadraId), [quadras, filters.quadraId]);
  const activeFilterCount = Object.values(filters).filter(value => value !== 'all' && value !== '').length;
  const handleClearFilters = () => { setFilters({ status: 'all', type: 'all', clientName: '', quadraId: 'all', startDate: '', endDate: '' }); setIsFilterPanelOpen(false); };

  const handleSaveReservation = async (reservaData: any) => {
    if (!selectedArenaContext || !profile) return;

    if (reservaData.newSportCreated) {
        const newSport = reservaData.newSportCreated;
        const currentArena = allArenas.find(a => a.id === selectedArenaContext.id);
        if (currentArena && !currentArena.available_sports?.includes(newSport)) {
            const updatedArena = {
                ...currentArena,
                available_sports: [...(currentArena.available_sports || []), newSport]
            };
            await updateArena(updatedArena);
        }
        delete reservaData.newSportCreated;
    }
    
    const isEditing = !!(reservaData as Reserva).id;
    
    try {
      const { clientName, clientPhone } = reservaData;
      let alunoForReservation: Aluno | null = null;
  
      if (isEditing && (reservaData as Reserva).aluno_id) {
          alunoForReservation = alunos.find(a => a.id === (reservaData as Reserva).aluno_id) || null;
      }
      
      if (!alunoForReservation && clientName) {
        const existingAluno = alunos.find(a => a.name.toLowerCase() === clientName.toLowerCase());
        if (existingAluno) {
          alunoForReservation = existingAluno;
        } else if (!isEditing) {
          const { data: newAlunos } = await localApi.upsert('alunos', [{ arena_id: selectedArenaContext.id, name: clientName, phone: clientPhone || null, status: 'ativo', plan_name: 'Avulso', join_date: format(new Date(), 'yyyy-MM-dd') }], selectedArenaContext.id);
          if (newAlunos && newAlunos[0]) {
            alunoForReservation = newAlunos[0];
          }
        }
      }
  
      let dataToUpsert: Partial<Reserva> = { 
        ...reservaData, 
        arena_id: selectedArenaContext.id, 
        aluno_id: alunoForReservation?.id || null,
        profile_id: alunoForReservation?.profile_id || null,
      };
  
      if (!isEditing) {
        dataToUpsert.created_by_name = profile.name;
        if (dataToUpsert.total_price && dataToUpsert.total_price > 0 && dataToUpsert.payment_status === 'pendente') {
          dataToUpsert.status = 'aguardando_pagamento';
          const { data: arenas } = await localApi.select<Arena>('arenas', 'all');
          const currentArena = arenas.find(a => a.id === selectedArenaContext.id);
          const paymentWindow = currentArena?.single_booking_payment_window_minutes || 30;
          dataToUpsert.payment_deadline = addMinutes(new Date(), paymentWindow).toISOString();
        } else {
          dataToUpsert.status = 'confirmada';
        }
      }
      
      if (reservaData.type === 'bloqueio') {
        dataToUpsert.clientName = reservaData.notes || 'Horário Bloqueado';
        dataToUpsert.total_price = 0;
        dataToUpsert.credit_used = 0;
        dataToUpsert.status = 'confirmada';
        dataToUpsert.payment_status = 'pago';
        delete dataToUpsert.payment_deadline;
      }
    
      dataToUpsert.isRecurring = reservaData.recurringType !== 'none';
      if((dataToUpsert as any).isRecurringIndefinite) {
        dataToUpsert.recurringEndDate = null;
      }
    
      const { data: savedReservas } = await localApi.upsert('reservas', [dataToUpsert], selectedArenaContext.id);
      const savedReserva = savedReservas[0];
  
      if (savedReserva && alunoForReservation) {
        const originalCreditUsed = reservaData.originalCreditUsed || 0;
        const newlyAppliedCredit = (savedReserva.credit_used || 0) - originalCreditUsed;
    
        if (newlyAppliedCredit !== 0) {
            const updatedBalance = (alunoForReservation.credit_balance || 0) - newlyAppliedCredit;
            await localApi.upsert('alunos', [{ ...alunoForReservation, credit_balance: updatedBalance }], selectedArenaContext.id);
    
            if (newlyAppliedCredit > 0) {
                const quadraName = quadras.find(q => q.id === savedReserva.quadra_id)?.name || 'Quadra';
                const reservaDetails = `${quadraName} em ${format(parseDateStringAsLocal(savedReserva.date), 'dd/MM/yy')} às ${savedReserva.start_time.slice(0,5)}`;
                const newDescription = `Pagamento da reserva: ${reservaDetails}`;
                await localApi.upsert('credit_transactions', [{ 
                    aluno_id: alunoForReservation.id, 
                    arena_id: selectedArenaContext.id, 
                    amount: -newlyAppliedCredit, 
                    type: 'reservation_payment', 
                    description: newDescription,
                    related_reservation_id: savedReserva.id 
                }], selectedArenaContext.id);
            }
        }
      }

      addToast({ message: `Reserva salva com sucesso!`, type: 'success' });
      closeModal();
    } catch (error: any) { addToast({ message: `Erro ao salvar reserva: ${error.message}`, type: 'error' }); }
  };

  const handleUpdateMasterReserva = async (updatedReserva: Reserva) => {
    if (!selectedArenaContext) return;
    try {
      await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);
      addToast({ message: 'Dados do mensalista atualizados!', type: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
    } finally {
      closeMensalistaModal();
    }
  };

  const handleCancelReservation = (reserva: Reserva) => {
    const masterId = reserva.masterId || reserva.id;
    const masterReserva = reservas.find(r => r.id === masterId);
    if (!masterReserva) { addToast({ message: 'Erro ao encontrar a reserva original para cancelar.', type: 'error' }); return; }
    setReservationToCancel(masterReserva);
    if (masterReserva.total_price && masterReserva.total_price > 0) { setIsCancellationModalOpen(true); }
    else { setIsManualCancelModalOpen(true); }
    closeModal();
  };

  const handleConfirmManualCancel = async () => {
    if (!selectedArenaContext || !reservationToCancel) return;
    try {
        const reserva = reservationToCancel;
        const updatePayload: Partial<Reserva> = { status: 'cancelada' };
        if (reserva.total_price && reserva.total_price > 0) updatePayload.payment_status = 'pago';
        const updatedReserva = { ...reserva, ...updatePayload };
        await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);
        addToast({ message: 'Reserva cancelada com sucesso!', type: 'success' });
        loadData();
    } catch (error: any) { addToast({ message: `Erro ao cancelar reserva: ${error.message}`, type: 'error' }); }
    finally { setIsManualCancelModalOpen(false); setReservationToCancel(null); }
  };

  const handleConfirmCancellation = async (reservaId: string, creditAmount: number, reason: string) => {
    if (!selectedArenaContext) return;
    try {
        const reserva = reservas.find(r => r.id === reservaId);
        if (!reserva) throw new Error('Reserva não encontrada.');

        await processCancellation(reserva, selectedArenaContext.id, quadras, creditAmount, reason);
        
        const updatePayload: Partial<Reserva> = { status: 'cancelada' };
        if (creditAmount === 0 && reserva.total_price && reserva.total_price > 0) {
            updatePayload.payment_status = 'pago';
        }
        const updatedReserva = { ...reserva, ...updatePayload };
        await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);
        
        addToast({ message: 'Reserva cancelada com sucesso!', type: 'success' });
        if (creditAmount > 0) addToast({ message: `${formatCurrency(creditAmount)} de crédito aplicado.`, type: 'info' });
        loadData();
    } catch (error: any) {
        addToast({ message: `Erro ao processar cancelamento: ${error.message}`, type: 'error' });
    } finally {
        setIsCancellationModalOpen(false);
        setReservationToCancel(null);
    }
  };

  const openNewReservationModal = (quadraId: string, time: string) => {
    if (!canEdit) {
      addToast({ message: 'Você não tem permissão para criar novas reservas.', type: 'error' });
      return;
    }
    setNewReservationSlot({ quadraId, time, type: 'avulsa' });
    setSelectedReservation(null);
    setIsModalOpen(true);
  };
  
  const openNewReservationOnDay = (date: Date, time?: string) => {
    if (!canEdit) {
      addToast({ message: 'Você não tem permissão para criar novas reservas.', type: 'error' });
      return;
    }
    setSelectedDate(date);
    setNewReservationSlot({ quadraId: filters.quadraId !== 'all' ? filters.quadraId : '', time: time || '' });
    setSelectedReservation(null);
    setIsModalOpen(true);
  };
  
  const openEditReservationModal = (reserva: Reserva, forceEdit = false) => {
    const isRecurring = reserva.isRecurring || reserva.recurringType !== 'none';
    const masterReserva = reserva.masterId ? reservas.find(r => r.id === reserva.masterId) : reserva;
    
    if (forceEdit || !isRecurring) {
      setSelectedReservation(masterReserva || null);
      setNewReservationSlot(null);
      setIsModalOpen(true);
    } else if (isRecurring && masterReserva) {
      setSelectedMensalistaReserva(masterReserva);
      setIsMensalistaModalOpen(true);
    }
  };

  const handleDeleteRequest = (reserva: Reserva) => {
    setItemToDelete({ id: reserva.id, name: reserva.clientName, type: 'reserva' });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !selectedArenaContext) return;
    try {
      await localApi.delete('reservas', [itemToDelete.id], selectedArenaContext.id);
      addToast({ message: 'Reserva excluída com sucesso.', type: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      closeMensalistaModal();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { const newDate = parseDateStringAsLocal(e.target.value); if (!isNaN(newDate.getTime())) setSelectedDate(newDate); };

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

  const renderContent = () => {
    switch (viewMode) {
      case 'agenda':
        return <AgendaView quadras={filteredQuadras} reservationsForDay={agendaReservations} selectedDate={selectedDate} onSlotClick={openNewReservationModal} onReservationClick={openEditReservationModal} onDataChange={loadData} />;
      case 'calendar':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CalendarView 
                  quadras={quadras} 
                  allReservations={displayedReservations}
                  onReservationClick={openEditReservationModal} 
                  selectedDate={selectedDate} 
                  onDateChange={setSelectedDate} 
                  onDayDoubleClick={openNewReservationOnDay} 
                  onSlotClick={openNewReservationOnDay} 
              />
            </div>
            <div className="lg:col-span-1">
              <DayDetailView
                date={selectedDate}
                reservas={displayedReservations}
                quadras={quadras}
                onReservationClick={openEditReservationModal}
              />
            </div>
          </div>
        );
      case 'list':
        return <ListView quadras={quadras} allReservations={displayedReservations} onReservationClick={openEditReservationModal} filters={filters} sortOrder={sortOrder} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link><div><h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Hub de Reservas</h1><p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Visualize e gerencie todas as suas reservas.</p></div></div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700"><div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4"><div className="flex items-center space-x-1 bg-brand-gray-100 dark:bg-brand-gray-900 p-1 rounded-lg">{(['agenda', 'calendar', 'list'] as ViewMode[]).map(mode => (<button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${viewMode === mode ? 'bg-white dark:bg-brand-gray-700 text-brand-blue-600 dark:text-white shadow' : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-white/50 dark:hover:bg-brand-gray-700/50'}`}>{mode === 'agenda' && <LayoutGrid className="h-4 w-4 sm:mr-1" />}{mode === 'calendar' && <Calendar className="h-4 w-4 sm:mr-1" />}{mode === 'list' && <List className="h-4 w-4 sm:mr-1" />}<span className="capitalize hidden sm:inline-block">{mode}</span></button>))}</div><div className="flex items-center flex-wrap justify-center gap-4">
          {viewMode !== 'calendar' && <Input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={handleDateChange} className="py-1.5"/>}
        {viewMode === 'list' && (
            <Button variant="outline" size="sm" onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />}
                {sortOrder === 'asc' ? 'Mais Antigas Primeiro' : 'Mais Recentes Primeiro'}
            </Button>
        )}
        <div className="relative"><Button variant={activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => setIsFilterPanelOpen(prev => !prev)}><SlidersHorizontal className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Filtros</span>{activeFilterCount > 0 && <span className="ml-2 bg-white dark:bg-brand-gray-900 text-brand-blue-500 dark:text-brand-blue-400 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}</Button></div>
        <Button onClick={() => openNewReservationModal(filters.quadraId !== 'all' ? filters.quadraId : '', '')} disabled={!canEdit} title={!canEdit ? "Você não tem permissão para criar reservas" : ""}>
          <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Reserva</span>
        </Button>
        </div></div><AnimatePresence>{isFilterPanelOpen && <FilterPanel filters={filters} onFilterChange={setFilters} onClearFilters={handleClearFilters} quadras={quadras}/>}</AnimatePresence></div>
        <ReservationLegend />
        <AnimatePresence mode="wait"><motion.div key={viewMode + filters.quadraId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>{isLoading ? <div className="text-center py-16"><Loader2 className="w-8 h-8 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : renderContent()}</motion.div></AnimatePresence>
      </div>
      <AnimatePresence>{isModalOpen && <ReservationModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveReservation} onCancelReservation={handleCancelReservation} reservation={selectedReservation} newReservationSlot={newReservationSlot} quadras={quadras} alunos={alunos} allReservations={reservas} arenaId={selectedArenaContext?.id || ''} selectedDate={selectedDate} profissionais={atletas} isReadOnly={!canEdit} allArenas={allArenas} />}</AnimatePresence>
      <AnimatePresence>{isCancellationModalOpen && (<CancellationModal isOpen={isCancellationModalOpen} onClose={() => { setIsCancellationModalOpen(false); setReservationToCancel(null); }} onConfirm={handleConfirmCancellation} reserva={reservationToCancel} />)}</AnimatePresence>
      <AnimatePresence>{isManualCancelModalOpen && (<ManualCancellationModal isOpen={isManualCancelModalOpen} onClose={() => { setIsManualCancelModalOpen(false); setReservationToCancel(null); }} onConfirm={handleConfirmManualCancel} reservaName={reservationToCancel?.clientName || 'Reserva'} />)}</AnimatePresence>
      <AnimatePresence>{isMensalistaModalOpen && selectedMensalistaReserva && <MensalistaDetailModal isOpen={isMensalistaModalOpen} onClose={closeMensalistaModal} reserva={selectedMensalistaReserva} aluno={alunos.find(a => a.id === selectedMensalistaReserva.aluno_id)} onSave={handleUpdateMasterReserva} onEdit={() => { closeMensalistaModal(); openEditReservationModal(selectedMensalistaReserva, true); }} onDelete={() => handleDeleteRequest(selectedMensalistaReserva)} />}</AnimatePresence>
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={<><p>Tem certeza que deseja excluir a reserva de <strong>{itemToDelete?.name}</strong>?</p><p className="mt-2 text-xs text-red-500 dark:text-red-400">Se for uma reserva recorrente, todas as futuras ocorrências serão removidas.</p></>} confirmText="Sim, Excluir" />
    </Layout>
  );
};

export default Reservations;
