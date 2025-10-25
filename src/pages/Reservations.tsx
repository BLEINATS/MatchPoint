import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Calendar, List, Plus, SlidersHorizontal, ArrowLeft, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
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
import { startOfDay, format, startOfMonth, endOfMonth, isBefore, parse, addYears, subDays, getDay, addDays, endOfDay, addMinutes } from 'date-fns';
import { expandRecurringReservations } from '../utils/reservationUtils';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { awardPointsForCompletedReservation, processCancellation } from '../utils/gamificationUtils';
import { formatCurrency } from '../utils/formatters';
import DayDetailView from '../components/Reservations/DayDetailView';

type ViewMode = 'agenda' | 'calendar' | 'list';

const Reservations: React.FC = () => {
  const { selectedArenaContext, profile } = useAuth();
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
  
  const canView = useMemo(() => 
    profile?.role === 'admin_arena' || 
    profile?.permissions?.reservas === 'view' || 
    profile?.permissions?.reservas === 'edit', 
  [profile]);

  const canEdit = useMemo(() => 
    profile?.role === 'admin_arena' || 
    profile?.permissions?.reservas === 'edit', 
  [profile]);

  const loadData = useCallback(async () => {
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
    loadData(); // Direct call to ensure data is fresh
  }, [loadData]);

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
    if (stateHandled) navigate(location.pathname, { replace: true });
  }, [location.state, navigate, canEdit, addToast]);

  const displayedReservations = useMemo(() => {
    let sourceReservas = reservas;
    let viewStartDate, viewEndDate;

    if (viewMode === 'list') {
      const hasDateRangeFilter = filters.startDate && filters.endDate;
      const defaultStart = subDays(new Date(), 30);
      const defaultEnd = addDays(new Date(), 30);
      viewStartDate = hasDateRangeFilter ? parseDateStringAsLocal(filters.startDate) : defaultStart;
      viewEndDate = hasDateRangeFilter ? parseDateStringAsLocal(filters.endDate) : defaultEnd;
      sourceReservas = expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);
    } else {
        if (viewMode === 'calendar') { 
            const monthStart = startOfMonth(selectedDate); 
            const monthEnd = endOfMonth(selectedDate); 
            viewStartDate = startOfDay(subDays(monthStart, getDay(monthStart))); 
            viewEndDate = endOfDay(addDays(monthEnd, 6 - getDay(monthEnd))); 
        } else { // agenda view
            viewStartDate = startOfDay(selectedDate); 
            viewEndDate = endOfDay(selectedDate); 
        }
        sourceReservas = expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);
    }

    let filtered = sourceReservas;
    if (filters.quadraId !== 'all') filtered = filtered.filter(r => r.quadra_id === filters.quadraId);
    if (filters.status !== 'all') filtered = filtered.filter(r => r.status === filters.status);
    if (filters.type !== 'all') filtered = filtered.filter(r => r.type === filters.type);
    if (filters.clientName.trim() !== '') filtered = filtered.filter(r => r.clientName?.toLowerCase().includes(filters.clientName.trim().toLowerCase()));
    
    if (viewMode === 'list') {
      filtered.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.start_time}`);
        const dateTimeB = new Date(`${b.date}T${b.start_time}`);
        if (sortOrder === 'desc') {
          return dateTimeB.getTime() - dateTimeA.getTime();
        }
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
    }

    return filtered;
  }, [reservas, quadras, viewMode, filters, selectedDate, sortOrder]);

  const filteredQuadras = useMemo(() => filters.quadraId === 'all' ? quadras : quadras.filter(q => q.id === filters.quadraId), [quadras, filters.quadraId]);
  const activeFilterCount = Object.values(filters).filter(value => value !== 'all' && value !== '').length;
  const handleClearFilters = () => { setFilters({ status: 'all', type: 'all', clientName: '', quadraId: 'all', startDate: '', endDate: '' }); setIsFilterPanelOpen(false); };

  const handleSaveReservation = async (reservaData: Omit<Reserva, 'id' | 'created_at'> | Reserva) => {
    if (!selectedArenaContext || !profile) return;
    const isEditing = !!(reservaData as Reserva).id;
    
    try {
      const { clientName, clientPhone } = reservaData;
      let alunoForReservation: Aluno | null = null;
      if (clientName) {
        const existingAluno = alunos.find(a => a.name.toLowerCase() === clientName.toLowerCase());
        if (existingAluno) {
          alunoForReservation = existingAluno;
        } else {
          const { data: newAlunos } = await localApi.upsert('alunos', [{ arena_id: selectedArenaContext.id, name: clientName, phone: clientPhone || null, status: 'ativo', plan_name: 'Avulso', join_date: format(new Date(), 'yyyy-MM-dd') }], selectedArenaContext.id);
          if (newAlunos && newAlunos[0]) {
            alunoForReservation = newAlunos[0];
            const { data: allAlunos } = await localApi.select<Aluno>('alunos', selectedArenaContext.id);
            setAlunos(allAlunos);
          }
        }
      }
  
      let dataToUpsert: Partial<Reserva> = { ...reservaData, arena_id: selectedArenaContext.id, profile_id: alunoForReservation?.profile_id || null, aluno_id: alunoForReservation?.id || null };

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
        delete dataToUpsert.payment_deadline;
      }

      const { data: savedReservas } = await localApi.upsert('reservas', [dataToUpsert], selectedArenaContext.id);
      const savedReserva = savedReservas[0];
  
      if (savedReserva && !isEditing && savedReserva.status === 'confirmada') {
        await awardPointsForCompletedReservation(savedReserva, selectedArenaContext.id);
      }
  
      addToast({ message: `Reserva salva com sucesso!`, type: 'success' });
      closeModal();
    } catch (error: any) { addToast({ message: `Erro ao salvar reserva: ${error.message}`, type: 'error' }); }
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
        await localApi.upsert('reservas', [{ ...reserva, ...updatePayload }], selectedArenaContext.id);
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
        await localApi.upsert('reservas', [{ ...reserva, ...updatePayload }], selectedArenaContext.id);
        
        addToast({ message: 'Reserva cancelada com sucesso!', type: 'success' });
        if (creditAmount > 0) addToast({ message: `${formatCurrency(creditAmount)} de crédito aplicado.`, type: 'info' });

    } catch (error: any) {
        addToast({ message: `Erro ao processar cancelamento: ${error.message}`, type: 'error' });
    } finally {
        setIsCancellationModalOpen(false);
        setReservationToCancel(null);
        loadData();
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
  
  const openEditReservationModal = (reserva: Reserva) => {
    const master = reserva.masterId ? reservas.find(r => r.id === reserva.masterId) : reserva;
    setSelectedReservation(master || null);
    setNewReservationSlot(null);
    setIsModalOpen(true);
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
        return <AgendaView quadras={filteredQuadras} reservas={displayedReservations} selectedDate={selectedDate} onSlotClick={openNewReservationModal} onReservationClick={openEditReservationModal} onDataChange={loadData} />;
      case 'calendar':
        return (
          <div className="space-y-8">
            <CalendarView quadras={quadras} reservas={displayedReservations} onReservationClick={openEditReservationModal} selectedDate={selectedDate} onDateChange={setSelectedDate} onDayDoubleClick={openNewReservationOnDay} onSlotClick={openNewReservationOnDay} />
            <DayDetailView date={selectedDate} reservas={displayedReservations} quadras={quadras} onSlotClick={(time) => openNewReservationOnDay(selectedDate, time)} onReservationClick={openEditReservationModal} />
          </div>
        );
      case 'list':
        return <ListView quadras={quadras} reservas={displayedReservations} onReservationClick={openEditReservationModal} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <AnimatePresence>{isModalOpen && <ReservationModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveReservation} onCancelReservation={handleCancelReservation} reservation={selectedReservation} newReservationSlot={newReservationSlot} quadras={quadras} alunos={alunos} allReservations={reservas} arenaId={selectedArenaContext?.id || ''} selectedDate={selectedDate} profissionais={atletas} isReadOnly={!canEdit} />}</AnimatePresence>
      <AnimatePresence>{isCancellationModalOpen && (<CancellationModal isOpen={isCancellationModalOpen} onClose={() => { setIsCancellationModalOpen(false); setReservationToCancel(null); }} onConfirm={handleConfirmCancellation} reserva={reservationToCancel} />)}</AnimatePresence>
      <AnimatePresence>{isManualCancelModalOpen && (<ManualCancellationModal isOpen={isManualCancelModalOpen} onClose={() => { setIsManualCancelModalOpen(false); setReservationToCancel(null); }} onConfirm={handleConfirmManualCancel} reservaName={reservationToCancel?.clientName || 'Reserva'} />)}</AnimatePresence>
    </Layout>
  );
};

export default Reservations;
