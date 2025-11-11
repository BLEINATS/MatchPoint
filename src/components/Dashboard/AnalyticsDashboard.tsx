import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    DollarSign, Users, Plus, Lock, Send, Calendar, Clock, 
    User, Sparkles, Star, TrendingUp, TrendingDown, Phone, MessageSquare, MessageCircle, Bookmark, Loader2, GraduationCap,
    CheckCircle, AlertCircle, CreditCard, ClipboardList, XCircle, Repeat, ShoppingBag, PieChart, Trophy, PartyPopper, Edit, Trash2, BookOpen, Handshake, Percent, BarChart2
} from 'lucide-react';
import { Quadra, Reserva, Aluno, Torneio, Evento, Professor, AtletaAluguel, Notificacao, FinanceTransaction, Turma, ReservationType } from '../../types';
import { expandRecurringReservations, getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import { isSameDay, startOfMonth, endOfMonth, format, isWithinInterval, getDay, parse, addDays, differenceInMinutes, endOfDay, isBefore, startOfDay, isAfter, isPast, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';
import InsightsWidget from './InsightsWidget';
import MensalistasHojeWidget from './MensalistasHojeWidget';
import HorariosLivresWidget from './HorariosLivresWidget';
import TopQuadrasWidget from './TopQuadrasWidget';
import ProximoEventoWidget from './ProximoEventoWidget';
import DetailedPerformanceCard from './DetailedPerformanceCard';
import MonthlyRevenueCard from './MonthlyRevenueCard';
import AcquisitionCard from './AcquisitionCard';
import SimpleStatCard from './SimpleStatCard';
import AtletasPendentesWidget from './AtletasPendentesWidget';
import TodaysAgenda from './TodaysAgenda';

interface AnalyticsDashboardProps {
  onReopenOnboarding: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onReopenOnboarding }) => {
  const { selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!arena) {
        setIsLoading(false);
        return;
    }
    try {
      const [quadrasRes, reservasRes, alunosRes, financeRes, torneiosRes, eventosRes, atletasRes, profsRes, turmasRes] = await Promise.all([
        localApi.select<Quadra>('quadras', arena.id),
        localApi.select<Reserva>('reservas', arena.id),
        localApi.select<Aluno>('alunos', arena.id),
        localApi.select<FinanceTransaction>('finance_transactions', arena.id),
        localApi.select<Torneio>('torneios', arena.id),
        localApi.select<Evento>('eventos', arena.id),
        localApi.select<AtletaAluguel>('atletas_aluguel', arena.id),
        localApi.select<Professor>('professores', arena.id),
        localApi.select<Turma>('turmas', arena.id),
      ]);
      
      setQuadras(quadrasRes.data || []);
      setReservas(reservasRes.data || []);
      setAlunos(alunosRes.data || []);
      setFinanceTransactions(financeRes.data || []);
      setTorneios(torneiosRes.data || []);
      setEventos(eventosRes.data || []);
      setAtletas(atletasRes.data || []);
      setProfessores(profsRes.data || []);
      setTurmas(turmasRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados do dashboard: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);

  const analyticsData = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const todaysConfirmedReservations = reservas.filter(r => 
      isSameDay(parseDateStringAsLocal(r.date), today) && 
      (r.status === 'confirmada' || r.status === 'realizada')
    );

    const receitaDoDia = todaysConfirmedReservations.reduce((sum, r) => sum + (r.total_price || 0), 0);
    
    const monthlyConfirmedReservations = reservas.filter(r =>
      (r.status === 'confirmada' || r.status === 'realizada') &&
      isWithinInterval(parseDateStringAsLocal(r.date), { start: monthStart, end: monthEnd })
    );

    const receitaDoMes = monthlyConfirmedReservations.reduce((sum, r) => sum + (r.total_price || 0), 0);

    const receitaPorCategoria: Record<string, number> = {};
    monthlyConfirmedReservations.forEach(r => {
        const category = r.type === 'avulsa' ? 'Reservas Avulsas' :
                         r.type === 'aula' ? 'Aulas' :
                         r.type === 'torneio' ? 'Torneios' :
                         r.type === 'evento' ? 'Eventos' : 'Outras';
        receitaPorCategoria[category] = (receitaPorCategoria[category] || 0) + (r.total_price || 0);
    });

    const activeQuadras = quadras.filter(q => q.status === 'ativa');
    const dayOfWeek = getDay(today);
    const totalAvailableHoursToday = activeQuadras.reduce((total, quadra) => {
        let horario = quadra.horarios ? (dayOfWeek === 0 ? quadra.horarios.sunday : dayOfWeek === 6 ? quadra.horarios.saturday : quadra.horarios.weekday) : null;
        if (!horario || !horario.start || !horario.end) return total;
        try {
            const start = parse(horario.start, 'HH:mm', new Date());
            let end = parse(horario.end, 'HH:mm', new Date());
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return total;
            if (end <= start) end = addDays(end, 1);
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + (isNaN(diff) || diff < 0 ? 0 : diff);
        } catch { return total; }
    }, 0);

    const todaysBookings = expandRecurringReservations(reservas, startOfDay(today), endOfDay(today), quadras)
      .filter(r => r.status !== 'cancelada' && activeQuadras.some(q => q.id === r.quadra_id));

    const totalBookedHoursToday = todaysBookings.reduce((sum, r) => {
        if (!r.start_time || !r.end_time) return sum;
        try {
            const startTime = parse(r.start_time, 'HH:mm', new Date());
            let endTime = parse(r.end_time, 'HH:mm', new Date());
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return sum;
            if (endTime <= startTime) endTime = addDays(endTime, 1);
            const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            return sum + (isNaN(diffHours) || diffHours < 0 ? 0 : diffHours);
        } catch { return sum; }
    }, 0);
    
    const ocupacaoHoje = totalAvailableHoursToday > 0 ? (totalBookedHoursToday / totalAvailableHoursToday) * 100 : 0;
    
    let avulsasPendentes = 0;
    let mensalidadesPendentes = 0;

    reservas.forEach(r => {
      if (r.status === 'aguardando_pagamento' && !r.isRecurring) {
        avulsasPendentes += r.total_price || 0;
      }
      if (r.isRecurring && r.monthly_payments) {
        Object.entries(r.monthly_payments).forEach(([monthKey, paymentInfo]) => {
          if (paymentInfo.status === 'pendente') {
            const monthDate = parseDateStringAsLocal(`${monthKey}-01`);
            if (isBefore(monthDate, startOfMonth(new Date()))) {
              mensalidadesPendentes += r.total_price || 0;
            }
          }
        });
      }
    });

    const contasAReceber = avulsasPendentes + mensalidadesPendentes;
    const contasAReceberBreakdown = [];
    if (avulsasPendentes > 0) {
      contasAReceberBreakdown.push({ label: 'Reservas Avulsas', value: avulsasPendentes });
    }
    if (mensalidadesPendentes > 0) {
      contasAReceberBreakdown.push({ label: 'Mensalidades em Atraso', value: mensalidadesPendentes });
    }

    const todaysCancellations = reservas.filter(r => 
      r.status === 'cancelada' && 
      r.updated_at && 
      isSameDay(parseDateStringAsLocal(r.updated_at), today)
    );

    const cancelamentosCliente = todaysCancellations.filter(r => 
        !r.notes?.includes('[Cancelado automaticamente por falta de pagamento]')
    ).length;

    const cancelamentosFaltaPagto = todaysCancellations.filter(r => 
        r.notes?.includes('[Cancelado automaticamente por falta de pagamento]')
    ).length;

    const totalCancelamentosHoje = cancelamentosCliente + cancelamentosFaltaPagto;

    const novosClientesMes = alunos.filter(a => isWithinInterval(parseDateStringAsLocal(a.join_date), { start: monthStart, end: monthEnd })).length;
    const novosAlunosMes = alunos.filter(a => a.plan_id && isWithinInterval(parseDateStringAsLocal(a.join_date), { start: monthStart, end: monthEnd })).length;

    return { 
        receitaDoMes, receitaDoDia, contasAReceber, ocupacaoHoje: Math.min(ocupacaoHoje, 100), 
        novosClientesMes, novosAlunosMes, receitaPorCategoria, contasAReceberBreakdown,
        totalCancelamentosHoje, cancelamentosCliente, cancelamentosFaltaPagto
    };
  }, [quadras, reservas, alunos, financeTransactions]);
  
  const todaysReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return expandRecurringReservations(reservas, today, today, quadras)
      .filter(r => r.status === 'confirmada' && r.type !== 'aula')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, quadras]);

  const proximoEvento = useMemo(() => {
    const now = new Date();
    const allEvents = [...torneios, ...eventos]
      .filter(e => isAfter(parseDateStringAsLocal(isTorneio(e) ? e.start_date : e.startDate), now))
      .sort((a, b) => new Date(isTorneio(a) ? a.start_date : a.startDate).getTime() - new Date(isTorneio(b) ? b.start_date : b.startDate).getTime());
    return allEvents[0] || null;
  }, [torneios, eventos]);

  function isTorneio(event: Torneio | Evento): event is Torneio {
    return 'max_participants' in event;
  }

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Nova Reserva': navigate('/reservas', { state: { openModal: true, type: 'avulsa' } }); break;
      case 'Bloquear Horário': navigate('/reservas', { state: { openModal: true, type: 'bloqueio' } }); break;
      case 'Novo Cliente': navigate('/alunos', { state: { openModal: true } }); break;
      case 'Notificação': navigate('/notificacoes'); break;
      default: break;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <DetailedPerformanceCard
            receita={analyticsData.receitaDoDia}
            ocupacao={analyticsData.ocupacaoHoje}
            className="lg:col-span-1"
        />
        <MonthlyRevenueCard
            label="Receita do Mês (Reservas)"
            value={analyticsData.receitaDoMes}
            breakdown={Object.entries(analyticsData.receitaPorCategoria).map(([key, value]) => ({ label: key, value })).filter(item => item.value > 0)}
            className="lg:col-span-1"
        />
        <AcquisitionCard
            clientes={analyticsData.novosClientesMes}
            alunos={analyticsData.novosAlunosMes}
            className="lg:col-span-1"
        />
        <SimpleStatCard
            label="Cancelamentos Hoje"
            value={analyticsData.totalCancelamentosHoje}
            description={`Cliente: ${analyticsData.cancelamentosCliente} | Falta de Pgto: ${analyticsData.cancelamentosFaltaPagto}`}
            icon={XCircle}
            color="text-red-500"
            className="lg:col-span-1"
        />
        <SimpleStatCard
            label="Contas a Receber"
            value={formatCurrency(analyticsData.contasAReceber)}
            description={analyticsData.contasAReceberBreakdown.map(item => `${item.label}: ${formatCurrency(item.value)}`).join(' | ')}
            icon={DollarSign}
            color="text-yellow-500"
            className="lg:col-span-1"
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton icon={Plus} label="Nova Reserva" onClick={() => handleActionClick('Nova Reserva')} />
        <QuickActionButton icon={Lock} label="Bloquear Horário" onClick={() => handleActionClick('Bloquear Horário')} />
        <QuickActionButton icon={User} label="Novo Cliente" onClick={() => handleActionClick('Novo Cliente')} />
        <QuickActionButton icon={Send} label="Notificação" onClick={() => handleActionClick('Notificação')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <TodaysAgenda 
          reservations={todaysReservations} 
          quadras={quadras} 
          arenaName={arena?.name || ''} 
          className="lg:col-span-1"
        />
        <HorariosLivresWidget 
          quadras={quadras} 
          reservas={reservas}
          className="lg:col-span-1"
        />
        <MensalistasHojeWidget 
            reservas={reservas}
            quadras={quadras}
            alunos={alunos}
            professores={professores}
            turmas={turmas}
            arena={arena}
            onCardClick={() => {}}
            className="lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <AtletasPendentesWidget atletas={atletas} reservas={reservas} onCardClick={() => {}} />
        <ProximoEventoWidget evento={proximoEvento} />
        <TopQuadrasWidget reservas={reservas} quadras={quadras} />
        <InsightsWidget reservas={reservas} alunos={alunos} quadras={quadras} />
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: React.ElementType, label: string, onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <Button variant="outline" className="w-full h-full flex-col py-4" onClick={onClick}>
    <Icon className="h-6 w-6 mb-2 text-brand-gray-600 dark:text-brand-gray-400" />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

export default AnalyticsDashboard;
