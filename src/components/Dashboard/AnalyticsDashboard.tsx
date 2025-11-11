import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
    DollarSign, Users, Plus, Lock, Send, Calendar, Clock, 
    User, Sparkles, Star, TrendingUp, TrendingDown, Phone, MessageSquare, MessageCircle, Bookmark, Loader2, GraduationCap,
    CheckCircle, AlertCircle, CreditCard, ClipboardList, XCircle, Repeat, ShoppingBag, PieChart, Trophy, PartyPopper, Edit, Trash2, BookOpen, Handshake, Percent
} from 'lucide-react';
import StatCard from './StatCard';
import { Quadra, Reserva, Aluno, Torneio, Evento, Professor, AtletaAluguel, Notificacao, FinanceTransaction } from '../../types';
import { expandRecurringReservations, getReservationTypeDetails } from '../../utils/reservationUtils';
import { calculateMonthlyOccupancy } from '../../utils/analytics';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import { isSameDay, startOfMonth, endOfMonth, format, parse, startOfDay, formatDistanceToNow, getDay, addDays, differenceInMinutes, endOfDay, isBefore, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';
import Timer from '../Shared/Timer';
import InsightsWidget from './InsightsWidget';
import NotificationComposerModal from '../Notificacoes/NotificationComposerModal';
import MensalistasHojeWidget from './MensalistasHojeWidget';
import MensalistaDetailModal from '../Reservations/MensalistaDetailModal';
import ConfirmationModal from '../Shared/ConfirmationModal';
import AtletasPendentesWidget, { RepassePaymentItem } from './AtletasPendentesWidget';
import { cn } from '../../lib/utils';

interface TopCourtData {
  id: string;
  name: string;
  totalBookedHours: number;
  totalRevenue: number;
}

const TopCourtsWidget: React.FC<{ topCourts: TopCourtData[], className?: string }> = ({ topCourts, className }) => {
  const maxHours = topCourts.length > 0 ? Math.max(...topCourts.map(c => c.totalBookedHours), 1) : 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.4 }} 
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col", className)}
    >
        <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Top Quadras</h3>
        <div className="space-y-4 flex-grow">
            {topCourts.length > 0 ? topCourts.map((q, i) => {
              const percentage = maxHours > 0 ? (q.totalBookedHours / maxHours) * 100 : 0;
              return (
                <div key={q.id} className="flex items-center gap-4">
                    <span className="font-bold text-brand-gray-500 text-lg w-4 text-center">{i + 1}</span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200">{q.name}</p>
                        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2 mt-1">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-24">
                        <p className="font-bold text-brand-gray-800 dark:text-white">{q.totalBookedHours}h</p>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">{formatCurrency(q.totalRevenue)}</p>
                    </div>
                </div>
              )
            }) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-center text-brand-gray-500 py-4">Dados de ocupação insuficientes.</p>
                </div>
            )}
        </div>
    </motion.div>
  );
};

const getPaymentStatusDetails = (status?: 'pago' | 'pendente' | 'parcialmente_pago') => {
    switch (status) {
        case 'pago':
            return { icon: CheckCircle, label: 'Pago', classes: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
        case 'pendente':
            return { icon: AlertCircle, label: 'Pendente', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
        case 'parcialmente_pago':
            return { icon: DollarSign, label: 'Parcial', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
        default:
            return null;
    }
};

const TodaysAgenda: React.FC<{ reservations: Reserva[], quadras: Quadra[], allReservas: Reserva[], arenaName: string }> = ({ reservations, quadras, allReservas, arenaName }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Agenda do Dia</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {reservations.length > 0 ? reservations.map(r => {
          const quadra = quadras.find(q => q.id === r.quadra_id);
          const clientReservations = allReservas.filter(res => res.clientName === r.clientName && res.status !== 'cancelada').length;
          const typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
          const paymentStatus = getPaymentStatusDetails(r.payment_status);
          
          let durationHours = 0;
          if (r.start_time && r.end_time) {
              try {
                  const startTime = parse(r.start_time.slice(0, 5), 'HH:mm', new Date());
                  let endTime = parse(r.end_time.slice(0, 5), 'HH:mm', new Date());
                  if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
                      if (endTime <= startTime) {
                          endTime = addDays(endTime, 1);
                      }
                      const diffMinutes = differenceInMinutes(endTime, startTime);
                      durationHours = diffMinutes / 60;
                  }
              } catch (e) { /* silent */ }
          }

          const totalRentedItems = r.rented_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const rentedItemsTitle = totalRentedItems > 0
            ? `Itens: ${r.rented_items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}`
            : undefined;

          return (
            <div key={r.id} className="flex items-start gap-4 p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
              <div className="flex flex-col items-center justify-center rounded-lg p-2 w-20 text-center bg-brand-blue-500 text-white flex-shrink-0">
                <span className="font-bold text-lg">{r.start_time.slice(0, 5)}</span>
                <span className="text-xs">às {r.end_time.slice(0, 5)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 truncate pr-2">
                        {r.clientName}
                    </p>
                    {paymentStatus && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus.classes}`}>
                            <paymentStatus.icon className="h-3 w-3 mr-1" />
                            {paymentStatus.label}
                        </span>
                    )}
                </div>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate">{quadra?.name || arenaName} • {r.sport_type || 'Esporte'} ({typeDetails.label})</p>
                
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-gray-500 dark:text-brand-gray-400">
                  {r.clientPhone && (
                      <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {r.clientPhone}
                      </span>
                  )}
                  <span className="flex items-center">
                      <Bookmark className="h-3 w-3 mr-1" />
                      {clientReservations} reserva(s)
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-gray-500 dark:text-brand-gray-400">
                  <span className="font-semibold text-brand-gray-700 dark:text-brand-gray-300 flex items-center text-sm">
                      {formatCurrency(r.total_price)}
                  </span>
                  
                  {durationHours > 0 && (
                    <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {durationHours.toFixed(1).replace('.', ',')}h
                    </span>
                  )}

                  {r.credit_used && r.credit_used > 0 && (
                    <span className="flex items-center text-blue-500 dark:text-blue-400" title={`Pago com ${formatCurrency(r.credit_used)} de crédito`}>
                        <CreditCard className="h-4 w-4 mr-1" />
                        Crédito
                    </span>
                  )}
                  
                  {totalRentedItems > 0 && (
                    <span className="flex items-center text-purple-500 dark:text-purple-400" title={rentedItemsTitle}>
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      {totalRentedItems} {totalRentedItems > 1 ? 'itens' : 'item'}
                    </span>
                  )}
                </div>
              </div>
               {r.clientPhone && (
                  <a
                      href={`https://wa.me/55${r.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${r.clientName}! Lembrete da sua reserva na ${arenaName}, quadra ${quadra?.name}, hoje das ${r.start_time.slice(0, 5)} às ${r.end_time.slice(0, 5)}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full text-green-500 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 self-center"
                      title="Enviar lembrete no WhatsApp"
                  >
                      <MessageCircle className="h-5 w-5" />
                  </a>
              )}
            </div>
          );
        }) : (
          <div className="text-center py-10">
            <Calendar className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
            <p className="text-brand-gray-500">Nenhuma reserva para hoje.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface AnalyticsDashboardProps {
  onReopenOnboarding: () => void;
}

const SplitStatCard: React.FC<{ icon: React.ElementType, label: string, value1: string | number, label1: string, value2: string | number, label2: string, color: string, index: number }> = ({ icon: Icon, label, value1, label1, value2, label2, color, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-brand-gray-200 dark:divide-brand-gray-700">
        <div className="text-center pr-4">
          <p className="text-3xl font-bold text-brand-gray-900 dark:text-white">{value1}</p>
          <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">{label1}</p>
        </div>
        <div className="text-center pl-4">
          <p className="text-3xl font-bold text-brand-gray-900 dark:text-white">{value2}</p>
          <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">{label2}</p>
        </div>
      </div>
    </motion.div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onReopenOnboarding }) => {
  const { selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  const [isMensalistaModalOpen, setIsMensalistaModalOpen] = useState(false);
  const [selectedMensalista, setSelectedMensalista] = useState<Reserva | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'reserva' } | null>(null);
  
  const [repassToConfirm, setRepassToConfirm] = useState<RepassePaymentItem | null>(null);
  const [isRepasseConfirmOpen, setIsRepasseConfirmOpen] = useState(false);

  const canManageReservas = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.reservas === 'edit', [profile]);
  const canManageAlunos = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.gerenciamento_arena === 'edit', [profile]);

  const loadData = useCallback(async () => {
    if (!arena) {
        setIsLoading(false);
        return;
    }
    try {
      const [quadrasRes, reservasRes, alunosRes, torneiosRes, eventosRes, profsRes, atletasRes] = await Promise.all([
        localApi.select<Quadra>('quadras', arena.id),
        localApi.select<Reserva>('reservas', arena.id),
        localApi.select<Aluno>('alunos', arena.id),
        localApi.select<Torneio>('torneios', arena.id),
        localApi.select<Evento>('eventos', arena.id),
        localApi.select<Professor>('professores', arena.id),
        localApi.select<AtletaAluguel>('atletas_aluguel', arena.id),
      ]);
      
      setQuadras(quadrasRes.data || []);
      setReservas(reservasRes.data || []);
      setAlunos(alunosRes.data || []);
      setTorneios(torneiosRes.data || []);
      setEventos(eventosRes.data || []);
      setProfessores(profsRes.data || []);
      setAtletas(atletasRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados do dashboard: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const handleOpenMensalistaModal = (reserva: Reserva) => {
    setSelectedMensalista(reserva);
    setIsMensalistaModalOpen(true);
  };

  const handleUpdateMasterReserva = async (updatedReserva: Reserva) => {
    if (!arena) return;
    try {
      await localApi.upsert('reservas', [updatedReserva], arena.id);
      addToast({ message: 'Dados do mensalista atualizados!', type: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
    } finally {
      setIsMensalistaModalOpen(false);
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setItemToDelete({ id, name, type: 'reserva' });
    setIsDeleteModalOpen(true);
    setIsMensalistaModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !arena) return;
    try {
      await localApi.delete('reservas', [itemToDelete.id], arena.id);
      addToast({ message: 'Plano de mensalista excluído com sucesso.', type: 'success' });
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleRepasseRequest = (payment: RepassePaymentItem) => {
    setRepassToConfirm(payment);
    setIsRepasseConfirmOpen(true);
  };

  const handleConfirmRepasse = async () => {
    if (!repassToConfirm || !arena || !profile) return;
  
    try {
      const reservaToUpdate = reservas.find(r => r.id === repassToConfirm.reservaId);
      if (!reservaToUpdate) throw new Error("Reserva não encontrada");
  
      const updatedReserva = { ...reservaToUpdate, atleta_payment_status: 'pago' as 'pago', atleta_paid_at: new Date().toISOString() };
      await localApi.upsert('reservas', [updatedReserva], arena.id);
  
      const expenseTransaction: Omit<FinanceTransaction, 'id' | 'created_at'> = {
        arena_id: arena.id,
        description: `Pagamento para ${repassToConfirm.profissionalName} (Jogo com ${repassToConfirm.clientName})`,
        amount: repassToConfirm.netAmount,
        type: 'despesa',
        category: 'Pagamento de Profissionais',
        date: new Date().toISOString().split('T')[0],
      };
      await localApi.upsert('finance_transactions', [expenseTransaction], arena.id);
      
      const profissional = atletas.find(p => p.id === repassToConfirm.profissionalId);
      if (profissional && profissional.profile_id) {
        const notification: Omit<Notificacao, 'id' | 'created_at'> = {
          arena_id: arena.id,
          profile_id: profissional.profile_id,
          message: `A arena realizou o repasse de ${formatCurrency(repassToConfirm.netAmount)} referente ao jogo com ${repassToConfirm.clientName}.`,
          type: 'payment_received',
          read: false,
          sender_id: profile.id,
          sender_name: profile.name,
          sender_avatar_url: profile.avatar_url,
        };
        await localApi.upsert('notificacoes', [notification], arena.id);
      }
  
      addToast({ message: 'Repasse registrado e profissional notificado!', type: 'success' });
      loadData();
  
    } catch (error: any) {
      addToast({ message: `Erro ao registrar repasse: ${error.message}`, type: 'error' });
    } finally {
      setIsRepasseConfirmOpen(false);
      setRepassToConfirm(null);
    }
  };

  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date());

    const futureTorneios = (torneios || [])
      .filter(t => !isBefore(parseDateStringAsLocal(t.start_date), now) && t.status !== 'cancelado')
      .map(t => ({
        id: t.id,
        name: t.name,
        date: t.start_date,
        type: 'torneio' as const,
        path: `/torneios/${t.id}`
      }));
    
    const futureEventos = (eventos || [])
      .filter(e => !isBefore(parseDateStringAsLocal(e.startDate), now) && e.status !== 'cancelado')
      .map(e => ({
        id: e.id,
        name: e.name,
        date: e.startDate,
        type: 'evento' as const,
        path: `/eventos/${e.id}`
      }));

    return [...futureTorneios, ...futureEventos]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [torneios, eventos]);

  const analyticsData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const allExpandedReservationsInMonth = expandRecurringReservations(reservas, monthStart, monthEnd, quadras);

    const receitaDoMes = allExpandedReservationsInMonth
      .filter(r => r.payment_status === 'pago')
      .reduce((sum, r) => sum + (r.total_price || 0), 0);

    const receitaDoDia = allExpandedReservationsInMonth
      .filter(r => r.payment_status === 'pago' && r.updated_at && isSameDay(parseDateStringAsLocal(r.updated_at), today))
      .reduce((sum, r) => sum + (r.total_price || 0), 0);
      
    const contasAReceber = reservas.filter(r => r.status === 'aguardando_pagamento' || r.payment_status === 'pendente').reduce((sum, r) => sum + (r.total_price || 0), 0);
    
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todaysBookings = expandRecurringReservations(reservas, todayStart, todayEnd, quadras).filter(r => r.status !== 'cancelada');
    
    const activeQuadras = quadras.filter(q => q.status === 'ativa');
    const dayOfWeek = getDay(today);

    const totalAvailableHoursToday = activeQuadras.reduce((total, quadra) => {
        let horario = quadra.horarios ? (dayOfWeek === 0 ? quadra.horarios.sunday : dayOfWeek === 6 ? quadra.horarios.saturday : quadra.horarios.weekday) : null;
        if (!horario || !horario.start || !horario.end) horario = { start: '08:00', end: '22:00' };
        try {
            const start = parse(horario.start.slice(0, 5), 'HH:mm', new Date());
            let end = parse(horario.end.slice(0, 5), 'HH:mm', new Date());
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return total;
            if (horario.end === '00:00') end = addDays(startOfDay(end), 1);
            else if (end <= start) end = addDays(end, 1);
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + (isNaN(diff) || diff < 0 ? 0 : diff);
        } catch { return total; }
    }, 0);

    const totalBookedHoursToday = todaysBookings.reduce((sum, r) => {
        if (!r.start_time || !r.end_time) return sum;
        try {
            const startTime = parse(r.start_time.slice(0, 5), 'HH:mm', new Date());
            let endTime = parse(r.end_time.slice(0, 5), 'HH:mm', new Date());
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return sum;
            if (r.end_time === '00:00') endTime = addDays(startOfDay(endTime), 1);
            else if (endTime <= startTime) endTime = addDays(endTime, 1);
            const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            return sum + (isNaN(diffHours) || diffHours < 0 ? 0 : diffHours);
        } catch { return sum; }
    }, 0);

    const ocupacaoHoje = totalAvailableHoursToday > 0 ? (totalBookedHoursToday / totalAvailableHoursToday) * 100 : 0;
    
    const novosClientesMes = alunos.filter(a => {
        const joinDate = parseDateStringAsLocal(a.join_date);
        return isWithinInterval(joinDate, { start: monthStart, end: monthEnd });
    }).length;

    const novosAlunosMes = alunos.filter(a => {
        const joinDate = parseDateStringAsLocal(a.join_date);
        return a.plan_id && isWithinInterval(joinDate, { start: monthStart, end: monthEnd });
    }).length;
    
    const cancelamentosHoje = reservas.filter(r => 
      r.status === 'cancelada' && 
      isSameDay(parseDateStringAsLocal(r.updated_at || r.created_at), today)
    ).length;

    return { receitaDoMes, receitaDoDia, contasAReceber, ocupacaoHoje: Math.min(ocupacaoHoje, 100), novosClientesMes, novosAlunosMes, cancelamentosHoje };
  }, [quadras, reservas, alunos]);
  
  const topCourtsData = useMemo(() => {
    const historyStartDate = new Date(2020, 0, 1);
    const today = new Date();
    const allExpandedReservations = expandRecurringReservations(reservas, historyStartDate, endOfDay(today), quadras);
    return quadras.map(quadra => {
        const quadraReservations = allExpandedReservations.filter(r => r.quadra_id === quadra.id && r.status !== 'cancelada');
        const totalBookedHours = quadraReservations.reduce((total, r) => {
          if (!r.start_time || !r.end_time) return total;
          try {
            const start = parse(r.start_time.slice(0, 5), 'HH:mm', new Date());
            let end = parse(r.end_time.slice(0, 5), 'HH:mm', new Date());
            if (end <= start) end = addDays(end, 1);
            const duration = differenceInMinutes(end, start) / 60;
            return total + (isNaN(duration) ? 0 : duration);
          } catch { return total; }
        }, 0);
        const totalRevenue = quadraReservations.filter(r => r.payment_status === 'pago').reduce((total, r) => total + (r.total_price || 0), 0);
        return { id: quadra.id, name: quadra.name, totalBookedHours: Math.round(totalBookedHours), totalRevenue };
      }).sort((a, b) => b.totalBookedHours - a.totalBookedHours).slice(0, 3);
  }, [quadras, reservas]);

  const todaysReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return expandRecurringReservations(reservas, today, today, quadras)
      .filter(r => r.status === 'confirmada')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, quadras]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Nova Reserva':
        if (!canManageReservas) { addToast({ message: 'Você não tem permissão para criar reservas.', type: 'error' }); return; }
        navigate('/reservas', { state: { openModal: true, type: 'avulsa' } });
        break;
      case 'Bloquear Horário':
        if (!canManageReservas) { addToast({ message: 'Você não tem permissão para bloquear horários.', type: 'error' }); return; }
        navigate('/reservas', { state: { openModal: true, type: 'bloqueio' } });
        break;
      case 'Novo Aluno':
        if (!canManageAlunos) { addToast({ message: 'Você não tem permissão para adicionar clientes.', type: 'error' }); return; }
        navigate('/alunos', { state: { openModal: true } });
        break;
      case 'Notificação':
        if (profile?.role !== 'admin_arena') { addToast({ message: 'Apenas administradores podem enviar notificações.', type: 'error' }); return; }
        setIsNotificationModalOpen(true);
        break;
      default: break;
    }
  };
  
  const handleSendNotification = async (target: 'all' | 'students' | 'clients' | 'individual', message: string, profileId?: string) => {
    if (!arena) return;
    let targetProfileIds: string[] = [];
    if (target === 'individual' && profileId) targetProfileIds = [profileId];
    else if (target === 'all') targetProfileIds = alunos.map(a => a.profile_id).filter((id): id is string => !!id);
    else if (target === 'students') targetProfileIds = alunos.filter(a => a.plan_id).map(a => a.profile_id).filter((id): id is string => !!id);
    else if (target === 'clients') targetProfileIds = alunos.filter(a => !a.plan_id).map(a => a.profile_id).filter((id): id is string => !!id);
    const uniqueProfileIds = [...new Set(targetProfileIds)];
    if (uniqueProfileIds.length === 0) { addToast({ message: 'Nenhum destinatário encontrado para este público.', type: 'info' }); return; }
    const { data: allProfiles } = await localApi.select<Profile>('profiles', 'all');
    const profilesMap = new Map((allProfiles || []).map(p => [p.id, p]));
    const newNotifications: Omit<Notificacao, 'id' | 'created_at'>[] = uniqueProfileIds.map(pId => {
        const recipientProfile = profilesMap.get(pId);
        const wantsNews = recipientProfile?.notification_preferences?.arena_news ?? true;
        if (wantsNews) {
            return { arena_id: arena.id, profile_id: pId, message, type: 'announcement', read: false };
        }
        return null;
    }).filter((n): n is NonNullable<typeof n> => n !== null);
    if (newNotifications.length === 0) { addToast({ message: 'Nenhum destinatário com notificações de novidades ativadas foi encontrado.', type: 'info' }); return; }
    try {
      await localApi.upsert('notificacoes', newNotifications, arena.id);
      addToast({ message: `Notificação enviada para ${newNotifications.length} usuário(s)!`, type: 'success' });
      setIsNotificationModalOpen(false);
    } catch (error: any) {
      addToast({ message: `Erro ao enviar notificação: ${error.message}`, type: 'error' });
    }
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Action Center</h1>
                <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
                  Bom dia, {profile?.name}! Você tem <span className="font-bold text-brand-blue-500">{todaysReservations.length}</span> reservas confirmadas para hoje.
                </p>
            </div>
            {profile?.role === 'admin_arena' && (
              <Button variant="outline" onClick={onReopenOnboarding}>
                <BookOpen className="h-4 w-4 mr-2" />
                Ver Tutorial
              </Button>
            )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <SplitStatCard
          icon={TrendingUp}
          label="Desempenho do Dia"
          value1={formatCurrency(analyticsData.receitaDoDia)}
          label1="Receita do Dia"
          value2={`${analyticsData.ocupacaoHoje.toFixed(0)}%`}
          label2="Ocupação Hoje"
          color="text-green-500"
          index={0}
        />
        <StatCard icon={DollarSign} label="Receita do Mês" value={formatCurrency(analyticsData.receitaDoMes)} color="purple" index={1} />
        <SplitStatCard
          icon={Users}
          label="Aquisição (Mês)"
          value1={analyticsData.novosClientesMes}
          label1="Novos Clientes"
          value2={analyticsData.novosAlunosMes}
          label2="Alunos com Plano"
          color="text-purple-500"
          index={2}
        />
        <StatCard icon={XCircle} label="Cancelamentos Hoje" value={analyticsData.cancelamentosHoje} color="red" index={3} />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton icon={Plus} label="Nova Reserva" onClick={() => handleActionClick('Nova Reserva')} />
        <QuickActionButton icon={Lock} label="Bloquear Horário" onClick={() => handleActionClick('Bloquear Horário')} />
        <QuickActionButton icon={User} label="Novo Cliente" onClick={() => handleActionClick('Novo Aluno')} />
        <QuickActionButton icon={Send} label="Notificação" onClick={() => handleActionClick('Notificação')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <TodaysAgenda reservations={todaysReservations} quadras={quadras} allReservas={reservas} arenaName={arena?.name || ''} />
          <MensalistasHojeWidget reservas={reservas} quadras={quadras} alunos={alunos} arena={arena} onCardClick={handleOpenMensalistaModal} />
        </div>
        <div className="space-y-8 flex flex-col h-full">
          <AtletasPendentesWidget reservas={reservas} atletas={atletas} onCardClick={handleRepasseRequest} />
          <UpcomingEventsWidget events={upcomingEvents} />
          <TopCourtsWidget topCourts={topCourtsData} className="flex-grow" />
        </div>
      </div>
      <NotificationComposerModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onSubmit={handleSendNotification}
        alunos={alunos}
        professores={professores}
        atletas={atletas}
      />
      <AnimatePresence>
        {isMensalistaModalOpen && selectedMensalista && (
          <MensalistaDetailModal
            isOpen={isMensalistaModalOpen}
            onClose={() => setIsMensalistaModalOpen(false)}
            reserva={selectedMensalista}
            aluno={alunos.find(a => a.id === selectedMensalista.aluno_id)}
            onSave={handleUpdateMasterReserva}
            onEdit={() => {
              setIsMensalistaModalOpen(false);
              navigate('/reservas', { state: { editReservaId: selectedMensalista.id, forceEdit: true } });
            }}
            onDelete={() => handleDeleteRequest(selectedMensalista.id, selectedMensalista.clientName)}
          />
        )}
      </AnimatePresence>
       <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={<><p>Tem certeza que deseja excluir o plano de mensalista de <strong>{itemToDelete?.name}</strong>?</p><p className="mt-2 text-xs text-red-500 dark:text-red-400">Todas as futuras ocorrências serão removidas.</p></>}
        confirmText="Sim, Excluir"
      />
      <ConfirmationModal
        isOpen={isRepasseConfirmOpen}
        onClose={() => setIsRepasseConfirmOpen(false)}
        onConfirm={handleConfirmRepasse}
        title="Confirmar Repasse"
        message={
          repassToConfirm && (
            <p>
              Você confirma o repasse de{' '}
              <strong>{formatCurrency(repassToConfirm.netAmount)}</strong> para{' '}
              <strong>{repassToConfirm.profissionalName}</strong>?
            </p>
          )
        }
        confirmText="Sim, Confirmar Repasse"
      />
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: React.ElementType, label: string, onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <Button variant="outline" className="w-full h-full flex-col py-4" onClick={onClick}>
    <Icon className="h-6 w-6 mb-2 text-brand-gray-600 dark:text-brand-gray-400" />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

const UpcomingEventsWidget: React.FC<{ events: any[] }> = ({ events }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Próximos Eventos</h3>
    <div className="space-y-4">
      {events.length > 0 ? events.map(event => (
        <Link to={event.path} key={event.id} className="block p-3 rounded-lg hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${event.type === 'torneio' ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-pink-100 dark:bg-pink-900/50'}`}>
              {event.type === 'torneio' ? <Trophy className="h-5 w-5 text-orange-500" /> : <PartyPopper className="h-5 w-5 text-pink-500" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">{event.name}</p>
              <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                {format(parseDateStringAsLocal(event.date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </Link>
      )) : (
        <p className="text-sm text-center text-brand-gray-500 py-4">Nenhum evento futuro agendado.</p>
      )}
    </div>
  </motion.div>
);

export default AnalyticsDashboard;
