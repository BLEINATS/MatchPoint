import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import MensalistaDetailModal from '../Reservations/MensalistaDetailModal';
import ConfirmationModal from '../Shared/ConfirmationModal';

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

  const [isMensalistaModalOpen, setIsMensalistaModalOpen] = useState(false);
  const [selectedMensalista, setSelectedMensalista] = useState<Reserva | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'reserva' } | null>(null);

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
      
      const now = new Date();
      let reservationsData = reservasRes.data || [];
      let updated = false;

      reservationsData = reservationsData.map(r => {
          if (r.status === 'aguardando_pagamento' && r.payment_deadline && isBefore(new Date(r.payment_deadline), now)) {
          updated = true;
          return { ...r, status: 'cancelada', notes: (r.notes || '') + ' [Cancelado automaticamente por falta de pagamento]', updated_at: new Date().toISOString() };
          }
          return r;
      });

      if (updated) {
          await localApi.upsert('reservas', reservationsData, arena.id, true);
          addToast({ message: 'Algumas reservas pendentes expiraram e foram canceladas.', type: 'info' });
      }

      setQuadras(quadrasRes.data || []);
      setReservas(reservationsData);
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

    const cancelamentosClienteValor = todaysCancellations
      .filter(r => !r.notes?.includes('[Cancelado automaticamente por falta de pagamento]'))
      .reduce((sum, r) => sum + (r.total_price || 0), 0);

    const cancelamentosFaltaPagtoValor = todaysCancellations
      .filter(r => r.notes?.includes('[Cancelado automaticamente por falta de pagamento]'))
      .reduce((sum, r) => sum + (r.total_price || 0), 0);

    const totalCancelamentosHojeValor = cancelamentosClienteValor + cancelamentosFaltaPagtoValor;

    const novosClientesMes = alunos.filter(a => isWithinInterval(parseDateStringAsLocal(a.join_date), { start: monthStart, end: monthEnd })).length;
    const novosAlunosMes = alunos.filter(a => a.plan_id && isWithinInterval(parseDateStringAsLocal(a.join_date), { start: monthStart, end: monthEnd })).length;

    return { 
        receitaDoMes, receitaDoDia, contasAReceber, ocupacaoHoje: Math.min(ocupacaoHoje, 100), 
        novosClientesMes, novosAlunosMes, receitaPorCategoria, contasAReceberBreakdown,
        totalCancelamentosHojeValor, cancelamentosClienteValor, cancelamentosFaltaPagtoValor
    };
  }, [quadras, reservas, alunos, financeTransactions]);
  
  const todaysReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return expandRecurringReservations(reservas, today, today, quadras)
      .filter(r => r.status === 'confirmada' && r.type !== 'aula')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, quadras]);

  const proximosEventos = useMemo(() => {
    const today = startOfDay(new Date());

    const allEvents = [
        ...eventos.map(e => ({
            ...e,
            effectiveDate: parseDateStringAsLocal(e.startDate),
            isTorneio: false
        })),
        ...torneios.map(t => {
            if (!t.categories || t.categories.length === 0) {
                return { ...t, effectiveDate: null, isTorneio: true };
            }
            const earliestCategoryDate = new Date(Math.min(
                ...t.categories.map(c => parseDateStringAsLocal(c.start_date).getTime()).filter(time => !isNaN(time))
            ));
            return { ...t, effectiveDate: isNaN(earliestCategoryDate.getTime()) ? null : earliestCategoryDate, isTorneio: true };
        })
    ];
    
    return allEvents
      .filter(e => e.effectiveDate && !isBefore(e.effectiveDate, today))
      .sort((a, b) => a.effectiveDate!.getTime() - b.effectiveDate!.getTime());
  }, [torneios, eventos]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Nova Reserva': navigate('/reservas', { state: { openModal: true, type: 'avulsa' } }); break;
      case 'Bloquear Horário': navigate('/reservas', { state: { openModal: true, type: 'bloqueio' } }); break;
      case 'Novo Cliente': navigate('/alunos', { state: { openModal: true } }); break;
      case 'Notificação': navigate('/notificacoes'); break;
      default: break;
    }
  };

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

  const handleDeleteRequest = (reserva: Reserva) => {
    setItemToDelete({ id: reserva.id, name: reserva.clientName, type: 'reserva' });
    setIsDeleteModalOpen(true);
    setIsMensalistaModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !arena) return;
    try {
      await localApi.delete('reservas', [itemToDelete.id], arena.id);
      addToast({ message: 'Reserva recorrente excluída com sucesso.', type: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
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
            value={formatCurrency(analyticsData.totalCancelamentosHojeValor)}
            description={`Cliente: ${formatCurrency(analyticsData.cancelamentosClienteValor)} | Falta Pgto: ${formatCurrency(analyticsData.cancelamentosFaltaPagtoValor)}`}
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
            onCardClick={handleOpenMensalistaModal}
            className="lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <AtletasPendentesWidget atletas={atletas} reservas={reservas} onCardClick={() => {}} />
        <ProximoEventoWidget eventos={proximosEventos} />
        <TopQuadrasWidget reservas={reservas} quadras={quadras} />
        <InsightsWidget reservas={reservas} alunos={alunos} quadras={quadras} />
      </div>

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
            onDelete={() => handleDeleteRequest(selectedMensalista)}
          />
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={<><p>Tem certeza que deseja excluir a reserva recorrente de <strong>{itemToDelete?.name}</strong>?</p><p className="mt-2 text-xs text-red-500 dark:text-red-400">Todas as futuras ocorrências serão removidas.</p></>}
        confirmText="Sim, Excluir"
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

export default AnalyticsDashboard;
