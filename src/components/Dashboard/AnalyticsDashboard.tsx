import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
    DollarSign, Users, Plus, Lock, Send, Calendar, Clock, 
    User, Sparkles, Star, TrendingUp, TrendingDown, Phone, MessageCircle, Bookmark, Loader2, GraduationCap,
    CheckCircle, AlertCircle, CreditCard, ClipboardList, XCircle, Repeat, ShoppingBag, PieChart, Trophy, PartyPopper
} from 'lucide-react';
import StatCard from './StatCard';
import { Quadra, Reserva, Aluno, Torneio, Evento, Notificacao, Professor, AtletaAluguel } from '../../types';
import { expandRecurringReservations, getReservationTypeDetails } from '../../utils/reservationUtils';
import { getAvailableSlotsForDay, calculateMonthlyOccupancy } from '../../utils/analytics';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import { isSameDay, startOfMonth, endOfMonth, format, parse, startOfDay, formatDistanceToNow, getDay, addDays, differenceInMinutes, endOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';
import Timer from '../Shared/Timer';
import InsightsWidget from './InsightsWidget';
import NotificationComposerModal from '../Notificacoes/NotificationComposerModal';

const AnalyticsDashboard: React.FC = () => {
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
    loadData();
  }, [loadData]);

  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date());

    const futureTorneios = (torneios || [])
      .filter(t => !isBefore(parseDateStringAsLocal(t.start_date), now))
      .map(t => ({
        id: t.id,
        name: t.name,
        date: t.start_date,
        type: 'torneio' as const,
        path: `/torneios/${t.id}`
      }));
    
    const futureEventos = (eventos || [])
      .filter(e => !isBefore(parseDateStringAsLocal(e.startDate), now))
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
      .filter(r => r.status === 'confirmada' || (r.status === 'cancelada' && r.payment_status === 'pago'))
      .reduce((sum, r) => sum + (r.total_price || 0), 0);
      
    const isAlunoComPlano = (aluno: Aluno): boolean => {
      return !!(aluno.plan_name && aluno.plan_name.toLowerCase() !== 'avulso' && aluno.plan_name.toLowerCase() !== 'paga por uso');
    }

    const newSignupsThisMonth = alunos.filter(a => {
        try {
            const joinDate = parseDateStringAsLocal(a.join_date);
            return joinDate >= monthStart && joinDate <= monthEnd;
        } catch {
            return false;
        }
    });

    const novosAlunos = newSignupsThisMonth.filter(isAlunoComPlano).length;
    const novosClientes = newSignupsThisMonth.filter(a => !isAlunoComPlano(a)).length;

    const canceledReservationsThisMonth = allExpandedReservationsInMonth.filter(r => r.status === 'cancelada').length;
    
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todaysBookings = expandRecurringReservations(reservas, todayStart, todayEnd, quadras)
        .filter(r => r.status !== 'cancelada');

    const reservasHoje = todaysBookings.length;
    const receitaHoje = todaysBookings.reduce((sum, r) => sum + (r.total_price || 0), 0);
    
    const availableSlotsToday = getAvailableSlotsForDay(quadras, todaysBookings, today);

    const activeQuadras = quadras.filter(q => q.status === 'ativa');
    const dayOfWeek = getDay(today);

    const totalAvailableHoursToday = activeQuadras.reduce((total, quadra) => {
        let horario = quadra.horarios ? (
            dayOfWeek === 0 ? quadra.horarios.sunday :
            dayOfWeek === 6 ? quadra.horarios.saturday :
            quadra.horarios.weekday
        ) : null;

        if (!horario || !horario.start || !horario.end) {
            horario = { start: '08:00', end: '22:00' }; // Fallback robusto
        }

        try {
            const start = parse(horario.start.slice(0, 5), 'HH:mm', new Date());
            let end = parse(horario.end.slice(0, 5), 'HH:mm', new Date());

            if (isNaN(start.getTime()) || isNaN(end.getTime())) return total;

            if (horario.end === '00:00') {
                end = addDays(startOfDay(end), 1);
            } else if (end <= start) {
                end = addDays(end, 1);
            }
            
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + (isNaN(diff) || diff < 0 ? 0 : diff);
        } catch {
            return total;
        }
    }, 0);

    const totalBookedHoursToday = todaysBookings.reduce((sum, r) => {
        if (!r.start_time || !r.end_time) return sum;
        try {
            const startTime = parse(r.start_time.slice(0, 5), 'HH:mm', new Date());
            let endTime = parse(r.end_time.slice(0, 5), 'HH:mm', new Date());

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return sum;

            if (r.end_time === '00:00') {
                endTime = addDays(startOfDay(endTime), 1);
            } else if (endTime <= startTime) {
                endTime = addDays(endTime, 1);
            }
            
            const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            return sum + (isNaN(diffHours) || diffHours < 0 ? 0 : diffHours);
        } catch {
            return sum;
        }
    }, 0);

    const ocupacaoHoje = totalAvailableHoursToday > 0 
      ? (totalBookedHoursToday / totalAvailableHoursToday) * 100 
      : 0;

    return { 
      receitaDoMes, 
      novosAlunos,
      novosClientes,
      reservasHoje,
      receitaHoje,
      canceledReservationsThisMonth,
      availableSlotsToday,
      ocupacaoHoje: Math.min(ocupacaoHoje, 100),
    };
  }, [quadras, reservas, alunos]);
  
  const topCourtsData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const allExpandedReservationsInMonth = expandRecurringReservations(reservas, monthStart, endOfMonth(new Date()), quadras);

    return quadras
      .map(quadra => {
        const quadraReservations = allExpandedReservationsInMonth.filter(
          r => r.quadra_id === quadra.id && r.status !== 'cancelada'
        );
        
        const occupancy = calculateMonthlyOccupancy(new Date(), quadraReservations, [quadra]);

        return {
          id: quadra.id,
          name: quadra.name,
          occupancy: occupancy,
        };
      })
      .sort((a, b) => b.occupancy - a.occupancy)
      .slice(0, 3);
  }, [quadras, reservas]);

  const todaysReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return expandRecurringReservations(reservas, today, today, quadras)
      .filter(r => r.status === 'confirmada')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, quadras]);

  const recentActivities = useMemo(() => {
    const isAlunoComPlano = (aluno: Aluno): boolean => {
      return !!(aluno.plan_name && aluno.plan_name.toLowerCase() !== 'avulso' && aluno.plan_name.toLowerCase() !== 'paga por uso');
    }

    const reservaActivities = reservas.map(r => {
      const quadraName = quadras.find(q => q.id === r.quadra_id)?.name || 'Quadra';
      const typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
      let text = '';
      let details: React.ReactNode = '';
      let color = '';
      let icon: React.ElementType;

      if (r.status === 'aguardando_pagamento' && r.payment_deadline) {
        text = `Reserva aguardando pagamento`;
        details = (
          <div className="flex items-center gap-2">
            <span>{r.clientName || 'Cliente'} na {quadraName}</span>
            <span className="text-xs font-bold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <Timer deadline={r.payment_deadline} onExpire={loadData} />
            </span>
          </div>
        );
        icon = Clock;
        color = 'text-yellow-500';
      } else if (r.status === 'cancelada') {
        text = `Reserva cancelada`;
        details = `${r.clientName || 'Cliente'} na {quadraName}`;
        icon = XCircle;
        color = 'text-red-500';
      } else {
        text = `Nova reserva (${typeDetails.label})`;
        details = `${r.clientName || 'Cliente'} na {quadraName} - ${formatCurrency(r.total_price)}`;
        icon = typeDetails.icon;
        color = 'text-blue-500';
      }
      
      return {
        id: `res-${r.id}`,
        text: text,
        details: details,
        time: r.updated_at || r.created_at,
        icon: icon,
        color: color,
      };
    });

    const alunoActivities = alunos.map(a => ({
      id: `aluno-${a.id}`,
      text: `Novo cadastro`,
      details: `${a.name} (${isAlunoComPlano(a) ? 'Aluno com plano' : 'Cliente'})`,
      time: a.created_at,
      icon: User,
      color: 'text-purple-500',
    }));

    const allActivities = [...reservaActivities, ...alunoActivities];
    allActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return allActivities.slice(0, 5);
  }, [reservas, alunos, quadras, loadData]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Nova Reserva':
        if (!canManageReservas) {
          addToast({ message: 'Você não tem permissão para criar reservas.', type: 'error' });
          return;
        }
        navigate('/reservas', { state: { openModal: true, type: 'avulsa' } });
        break;
      case 'Bloquear Horário':
        if (!canManageReservas) {
          addToast({ message: 'Você não tem permissão para bloquear horários.', type: 'error' });
          return;
        }
        navigate('/reservas', { state: { openModal: true, type: 'bloqueio' } });
        break;
      case 'Novo Aluno':
        if (!canManageAlunos) {
          addToast({ message: 'Você não tem permissão para adicionar clientes.', type: 'error' });
          return;
        }
        navigate('/alunos', { state: { openModal: true } });
        break;
      case 'Notificação':
        if (profile?.role !== 'admin_arena') {
            addToast({ message: 'Apenas administradores podem enviar notificações.', type: 'error' });
            return;
        }
        setIsNotificationModalOpen(true);
        break;
      default:
        break;
    }
  };
  
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
      setIsNotificationModalOpen(false);
    } catch (error: any) {
      addToast({ message: `Erro ao enviar notificação: ${error.message}`, type: 'error' });
    }
  };

  const handleSlotClick = (quadraId: string, time: string) => {
    if (!canManageReservas) {
      addToast({ message: 'Você não tem permissão para criar reservas.', type: 'error' });
      return;
    }
    navigate('/reservas', { 
      state: { 
        openModal: true, 
        quadraId: quadraId, 
        time: time,
        selectedDate: new Date().toISOString()
      } 
    });
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Action Center</h1>
        <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
          Bom dia, {profile?.name}! Você tem <span className="font-bold text-brand-blue-500">{todaysReservations.length}</span> reservas confirmadas para hoje.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={DollarSign}
          label="Receita do Mês"
          value={formatCurrency(analyticsData.receitaDoMes)}
          color="green"
          trend="+12%"
          description="em relação ao mês passado"
          index={0}
        />
        <StatCard
          icon={XCircle}
          label="Canceladas no Mês"
          value={analyticsData.canceledReservationsThisMonth}
          color="red"
          index={1}
        />
        
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 mb-2">Horários Livres Hoje</p>
            {analyticsData.availableSlotsToday.length > 0 ? (
                <div className="grid grid-flow-col auto-cols-max gap-x-6 max-h-24 overflow-y-auto pr-2">
                    {analyticsData.availableSlotsToday.map(courtData => (
                        <div key={courtData.courtId}>
                            <p className="text-sm font-semibold text-brand-gray-800 dark:text-white">{courtData.courtName}</p>
                            <div className="mt-1 flex flex-col items-start">
                                {courtData.slots.map(slot => (
                                    <button 
                                      key={slot.start} 
                                      onClick={() => handleSlotClick(courtData.courtId, slot.start)}
                                      className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors py-0.5"
                                    >
                                      {slot.start} - {slot.end}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-lg font-bold text-brand-gray-500 mt-1">Nenhum horário livre.</p>
            )}
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">Ocupação do Dia</p>
            <p className="text-3xl font-bold text-brand-gray-900 dark:text-white mt-1">{analyticsData.ocupacaoHoje.toFixed(0)}%</p>
            <div className="w-full bg-brand-gray-200 rounded-full h-2.5 dark:bg-brand-gray-700 mt-2">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${analyticsData.ocupacaoHoje}%` }}></div>
            </div>
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex justify-around items-center">
            <MiniStat icon={Users} label="Novos Clientes" value={analyticsData.novosClientes} color="purple" />
            <div className="h-16 w-px bg-brand-gray-200 dark:bg-brand-gray-700"></div>
            <MiniStat icon={GraduationCap} label="Novos Alunos" value={analyticsData.novosAlunos} color="purple" />
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex justify-around items-center">
            <MiniStat icon={DollarSign} label="Receita Hoje" value={formatCurrency(analyticsData.receitaHoje)} color="yellow" />
            <div className="h-16 w-px bg-brand-gray-200 dark:bg-brand-gray-700"></div>
            <MiniStat icon={Calendar} label="Reservas Hoje" value={analyticsData.reservasHoje} color="yellow" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton icon={Plus} label="Nova Reserva" onClick={() => handleActionClick('Nova Reserva')} />
        <QuickActionButton icon={Lock} label="Bloquear Horário" onClick={() => handleActionClick('Bloquear Horário')} />
        <QuickActionButton icon={User} label="Novo Aluno" onClick={() => handleActionClick('Novo Aluno')} />
        <QuickActionButton icon={Send} label="Notificação" onClick={() => handleActionClick('Notificação')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TodaysAgenda reservations={todaysReservations} quadras={quadras} allReservas={reservas} arenaName={arena?.name || ''} />
          <RecentActivityFeed activities={recentActivities} />
        </div>
        <div className="space-y-8">
          <InsightsWidget reservas={reservas} alunos={alunos} quadras={quadras} />
          <UpcomingEventsWidget events={upcomingEvents} />
          <TopCourtsWidget topCourts={topCourtsData} />
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
    </div>
  );
};

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

const MiniStat: React.FC<{ icon: React.ElementType, label: string, value: string | number, color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' }> = ({ icon: Icon, label, value, color }) => {
    const colors = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      yellow: 'text-yellow-500',
      red: 'text-red-500',
      purple: 'text-purple-500',
    };
    return (
      <div className="text-center flex-1">
        <Icon className={`h-6 w-6 mx-auto mb-2 ${colors[color]}`} />
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
      </div>
    );
};

const QuickActionButton: React.FC<{ icon: React.ElementType, label: string, onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <Button variant="outline" className="w-full h-full flex-col py-4" onClick={onClick}>
    <Icon className="h-6 w-6 mb-2 text-brand-gray-600 dark:text-brand-gray-400" />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

const TodaysAgenda: React.FC<{ reservations: Reserva[], quadras: Quadra[], allReservas: Reserva[], arenaName: string }> = ({ reservations, quadras, allReservas, arenaName }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Agenda do Dia</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {reservations.length > 0 ? reservations.map(r => {
          const quadra = quadras.find(q => q.id === r.quadra_id);
          const clientReservations = allReservas.filter(res => res.clientName === r.clientName && res.status !== 'cancelada').length;
          const typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
          
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
                <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 truncate">
                  {r.clientName}
                </p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate">{quadra?.name || arenaName} ({typeDetails.label})</p>
                
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

const RecentActivityFeed: React.FC<{ activities: any[] }> = ({ activities }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Atividade Recente</h3>
            <ul className="space-y-4">
                {activities.length > 0 ? activities.map(act => (
                    <li key={act.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700/50 ${act.color}`}>
                            <act.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200">{act.text}</p>
                            <div className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{act.details}</div>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-500 mt-1">
                                {formatDistanceToNow(new Date(act.time), { locale: ptBR, addSuffix: true })}
                            </p>
                        </div>
                    </li>
                )) : (
                    <div className="text-center py-8 text-brand-gray-500">
                        <p>Nenhuma atividade recente.</p>
                    </div>
                )}
            </ul>
        </motion.div>
    );
};

interface TopCourtData {
  id: string;
  name: string;
  occupancy: number;
}

const TopCourtsWidget: React.FC<{ topCourts: TopCourtData[] }> = ({ topCourts }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Top Quadras</h3>
        <div className="space-y-4">
            {topCourts.length > 0 ? topCourts.map((q, i) => (
                <div key={q.id} className="flex items-center gap-3">
                    <span className="font-bold text-brand-gray-500 w-4 text-center">{i + 1}</span>
                    <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                            <p className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{q.name}</p>
                            <p className="text-sm font-bold text-brand-gray-700 dark:text-brand-gray-300">{q.occupancy.toFixed(0)}%</p>
                        </div>
                        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${q.occupancy}%` }}></div>
                        </div>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-center text-brand-gray-500 py-4">Dados de ocupação insuficientes.</p>
            )}
        </div>
    </motion.div>
);

const Dashboard: React.FC = () => {
    const { profile } = useAuth();

    if (!profile) {
        return <Layout><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500"/></div></Layout>;
    }

    if (profile.role === 'cliente') {
        return <ClientDashboard />;
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnalyticsDashboard />
            </div>
        </Layout>
    );
};

export default Dashboard;
