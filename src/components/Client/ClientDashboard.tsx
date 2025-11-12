import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Quadra, Reserva, Aluno, Turma, Professor, CreditTransaction, Profile, Arena, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement, AtletaAluguel, PlanoAula, Friendship, GamificationPointTransaction, FinanceTransaction, Torneio, Participant } from '../../types';
import { Calendar, Compass, Search, CreditCard, LayoutDashboard, Loader2, CheckCircle, AlertCircle, ShoppingBag, Clock, Heart, DollarSign, Gift, Handshake, GraduationCap, Star, User, Users, Banknote, FileText, MessageSquare, Briefcase, Repeat, XCircle, LifeBuoy, Lock, Unlock, Bell, Trash2, Edit, Hourglass } from 'lucide-react';
import { isAfter, startOfDay, isSameDay, format, parse, getDay, addDays, isBefore, endOfDay, addMinutes, subDays, isWithinInterval, formatDistanceToNow, isPast, differenceInHours, differenceInWeeks, endOfWeek, startOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import UpcomingReservationCard from './UpcomingReservationCard';
import Button from '../Forms/Button';
import ArenaSelector from './ArenaSelector';
import NextClassCard from './Student/NextClassCard';
import ProfessorNextClassCard from './Professor/NextClassCard';
import ReservationModal from '../Reservations/ReservationModal';
import { useToast } from '../../context/ToastContext';
import { expandRecurringReservations } from '../../utils/reservationUtils';
import DatePickerCalendar from './DatePickerCalendar';
import ClientCancellationModal from './ClientCancellationModal';
import ArenaInfoCard from './ArenaInfoCard';
import ReservationDetailModal from './ReservationDetailModal';
import { localApi } from '../../lib/localApi';
import { formatCurrency } from '../../utils/formatters';
import { processCancellation, awardPointsForCompletedReservation } from '../../utils/gamificationUtils';
import HirePlayerModal from './HirePlayerModal';
import AssignToReservationModal from './AssignToReservationModal';
import AulasTab from './Student/AulasTab';
import ClientProfileView from './ClientProfileView';
import Alert from '../Shared/Alert';
import FriendsView from './FriendsView';
import { useNavigate, useLocation } from 'react-router-dom';
import Timer from '../Shared/Timer';
import PaymentModal from '../Shared/PaymentModal';
import ProfileDetailModal from './ProfileDetailModal';
import AttendanceReportModal from './Student/AttendanceReportModal';
import LojaView from './LojaView';
import DocumentsTab from '../Client/DocumentsTab';
import AtletaProfilePage from '../../pages/AtletaProfilePage';
import ProfessorProfilePage from '../../pages/ProfessorProfilePage';
import SideNavBar from './SideNavBar';
import BottomNavBar from './BottomNavBar';
import SecurityTab from '../Settings/SecurityTab';
import NotificationSettingsTab from '../../pages/Settings/NotificationSettingsTab';
import SupportTab from '../Settings/SupportTab';
import AvaliarAtletaModal from './AvaliarAtletaModal';
import SendMessageModal from './SendMessageModal';
import ConfirmationModal from '../Shared/ConfirmationModal';
import PayAtletaModal from './PayAtletaModal';
import AtletaPublicProfileModal from './AtletaPublicProfileModal';
import AvaliarProfessorModal from './Student/AvaliarProfessorModal';
import ClassAttendanceModal from '../Alunos/ClassAttendanceModal';
import TournamentBanner from './TournamentBanner';
import TournamentInvitesWidget from './TournamentInvitesWidget';
import MyTournamentsWidget from './MyTournamentsWidget';
import InvitePartnerModal from './InvitePartnerModal';

type View = 'inicio' | 'aulas' | 'reservas' | 'loja' | 'amigos' | 'perfil' | 'atleta_painel' | 'professor_painel' | 'documentos' | 'seguranca' | 'notificacoes' | 'suporte';

const ReservationsTab: React.FC<{upcoming: Reserva[], past: Reserva[], quadras: Quadra[], atletas: AtletaAluguel[], arenaName?: string, onCancel: (reserva: Reserva) => void, onDetail: (reserva: Reserva) => void, onHirePlayer?: (reserva: Reserva) => void, profileId: string, onAvaliarAtleta: (reserva: Reserva) => void, arenaSettings: Partial<Arena> | null}> = ({upcoming, past, quadras, atletas, arenaName, onCancel, onDetail, onHirePlayer, profileId, onAvaliarAtleta, arenaSettings}) => {
    const [showAllPast, setShowAllPast] = useState(false);
    const shouldPaginatePast = past.length > 5;
    const displayedPastReservations = shouldPaginatePast && !showAllPast ? past.slice(0, 5) : past;
  
    return (
      <div className="space-y-8">
        <ReservationList title="Próximas Reservas" reservations={upcoming} quadras={quadras} atletas={atletas} arenaName={arenaName} onCancel={onCancel} onDetail={onDetail} onHirePlayer={onHirePlayer} profileId={profileId} onAvaliarAtleta={onAvaliarAtleta} arenaSettings={arenaSettings} />
        <ReservationList title="Histórico de Reservas" reservations={displayedPastReservations} quadras={quadras} atletas={atletas} arenaName={arenaName} isPast onDetail={onDetail} profileId={profileId} onAvaliarAtleta={onAvaliarAtleta} arenaSettings={arenaSettings} />
        {shouldPaginatePast && !showAllPast && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowAllPast(true)}>
              Ver todo o histórico ({past.length})
            </Button>
          </div>
        )}
      </div>
    );
};
  
const ReservationList: React.FC<{title: string, reservations: Reserva[], quadras: Quadra[], atletas: AtletaAluguel[], arenaName?: string, isPast?: boolean, onCancel?: (reserva: Reserva) => void, onDetail: (reserva: Reserva) => void, onHirePlayer?: (reserva: Reserva) => void, profileId: string, onAvaliarAtleta: (reserva: Reserva) => void, arenaSettings: Partial<Arena> | null}> = ({title, reservations, quadras, atletas, arenaName, isPast, onCancel, onDetail, onHirePlayer, profileId, onAvaliarAtleta, arenaSettings}) => {
    return (
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold p-6">{title}</h3>
        {reservations.length === 0 ? (
          <p className="px-6 pb-6 text-brand-gray-500">Nenhuma reserva encontrada.</p>
        ) : (
          <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {reservations.map(res => {
              const isOrganizer = res.profile_id === profileId;
              const isInvited = res.participants?.some(p => p.profile_id === profileId) && !isOrganizer;
              const isClickable = true;
              const atleta = res.atleta_aluguel_id ? atletas.find(a => a.id === res.atleta_aluguel_id) : null;
              const podeAvaliar = isPast && atleta && res.atleta_aceite_status === 'aceito' && !atleta.ratings?.some(r => r.reservationId === res.id && r.clientId === profileId);
              
              const canHire = !isPast && onHirePlayer && isOrganizer && (!res.atleta_aluguel_id || res.atleta_aceite_status === 'recusado' || res.atleta_aceite_status === 'cancelado_pelo_cliente') && res.type === 'avulsa';
              let hireDisabled = false;
              let hireDisabledMessage = '';
  
              if (canHire && arenaSettings?.athlete_booking_deadline_hours) {
                try {
                  const reservationStart = parseDateStringAsLocal(`${res.date}T${res.start_time}`);
                  const hoursUntilGame = differenceInHours(reservationStart, new Date());
                  if (hoursUntilGame < arenaSettings.athlete_booking_deadline_hours) {
                    hireDisabled = true;
                    hireDisabledMessage = `O prazo para contratar um atleta (${arenaSettings.athlete_booking_deadline_hours}h antes do jogo) já expirou.`;
                  }
                } catch (e) {
                  console.error("Error calculating hiring deadline", e);
                }
              }
  
              return (
                <li key={res.id} onClick={() => isClickable && onDetail(res)} className={`p-4 sm:p-6 transition-colors ${isClickable ? 'hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer' : 'cursor-default opacity-70'}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {isInvited && <Handshake className="h-4 w-4 text-purple-500" title="Você foi convidado" />}
                        {isOrganizer && res.participants && res.participants.length > 1 && <Users className="h-4 w-4 text-blue-500" title="Você é o organizador" />}
                        <p className="font-bold text-brand-gray-900 dark:text-white">{quadras.find(q => q.id === res.quadra_id)?.name} <span className="font-normal text-brand-gray-500">• {arenaName}</span></p>
                      </div>
                      <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                        {format(parseDateStringAsLocal(res.date), "dd/MM/yyyy")} • {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)}
                      </p>
                      {atleta && res.atleta_aceite_status !== 'recusado' && res.atleta_aceite_status !== 'cancelado_pelo_cliente' ? (
                        <div className="flex items-center flex-wrap gap-2 mt-2 text-xs">
                          <span className="text-indigo-500 font-medium">com {atleta.name}</span>
                          {res.atleta_aceite_status === 'aceito' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aceito
                            </span>
                          ) : res.atleta_aceite_status === 'pendente' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                              <Hourglass className="h-3 w-3 mr-1" />
                              Aguardando
                            </span>
                          ) : null}
                        </div>
                      ) : res.atleta_aceite_status === 'recusado' ? (
                        <p className="text-xs text-red-500 font-medium mt-1">Atleta Recusou</p>
                      ) : res.status === 'aguardando_aceite_profissional' ? (
                        <p className="text-xs text-orange-500 font-medium mt-1">Aguardando aceite do profissional</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <p className="font-semibold text-brand-gray-800 dark:text-white">{formatCurrency(res.total_price)}</p>
                        <div className="flex items-center justify-end gap-2 text-xs text-brand-gray-500">
                          {res.payment_status === 'pago' && <><CheckCircle className="h-3 w-3 text-green-500"/> Pago</>}
                          {res.payment_status === 'pendente' && <><AlertCircle className="h-3 w-3 text-yellow-500"/> Pendente</>}
                          {res.credit_used && res.credit_used > 0 && <CreditCard className="h-3 w-3 text-blue-500" title={`Pago com ${formatCurrency(res.credit_used)} de crédito`} />}
                          {res.rented_items && res.rented_items.length > 0 && <ShoppingBag className="h-3 w-3 text-purple-500" title="Itens alugados" />}
                        </div>
                      </div>
                      {podeAvaliar && (
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onAvaliarAtleta(res); }}>
                              <Star className="h-4 w-4 mr-1"/> Avaliar Atleta
                          </Button>
                      )}
                      {canHire && (
                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onHirePlayer(res); }} disabled={hireDisabled} title={hireDisabledMessage}>
                          <Handshake className="h-4 w-4 mr-2"/> Contratar Atleta
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    );
};

const InicioView: React.FC<{ alunoProfile: Aluno | null, planos: PlanoAula[], levels: GamificationLevel[], rewards: GamificationReward[], onOpenProfileModal: (tab: 'credits' | 'gamification' | 'payments') => void, nextReservation?: Reserva, pendingReservations: Reserva[], onDetail: (reserva: Reserva) => void, onDataChange: () => void, nextClass?: any, quadras: Quadra[], reservas: Reserva[], onSlotClick: (time: string, quadraId: string) => void, selectedDate: Date, setSelectedDate: (date: Date) => void, profile: Profile | null, arenaName?: string, selectedArena: Arena | null, onOpenAttendanceModal: () => void, creditHistory: CreditTransaction[], nextProfessorClass: any, onOpenClassAttendanceModal: (classData: any) => void, tournaments: Torneio[], onUpdateTournamentInvite: (torneioId: string, participantId: string, status: 'accepted' | 'declined') => void, onInvitePartner: (torneio: Torneio, participant: Participant) => void }> = ({ alunoProfile, planos, levels, rewards, onOpenProfileModal, nextReservation, pendingReservations, onDetail, onDataChange, nextClass, quadras, reservas, onSlotClick, selectedDate, setSelectedDate, profile, arenaName, selectedArena, onOpenAttendanceModal, creditHistory, nextProfessorClass, onOpenClassAttendanceModal, tournaments, onUpdateTournamentInvite, onInvitePartner }) => { 
    const [favoriteQuadras, setFavoriteQuadras] = useState<string[]>([]);
    const [timeUntilNext, setTimeUntilNext] = useState<string | null>(null);
  
    const expiringCredits = useMemo(() => {
        if (!alunoProfile || !selectedArena?.credit_expiration_days || !creditHistory) {
            return [];
        }
    
        // 1. Separate deposits and calculate total withdrawals
        const deposits = creditHistory
            .filter(tx => tx.amount > 0)
            .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()); // Oldest first
    
        const totalWithdrawals = creditHistory
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
        // 2. Apply FIFO logic to find unspent deposits
        let remainingWithdrawals = totalWithdrawals;
        const unspentDeposits: CreditTransaction[] = [];
    
        for (const deposit of deposits) {
            if (remainingWithdrawals <= 0) {
                unspentDeposits.push(deposit);
                continue;
            }
    
            if (remainingWithdrawals >= deposit.amount) {
                // This entire deposit has been spent
                remainingWithdrawals -= deposit.amount;
            } else {
                // Part of this deposit has been spent
                const remainingAmount = deposit.amount - remainingWithdrawals;
                unspentDeposits.push({ ...deposit, amount: remainingAmount });
                remainingWithdrawals = 0;
            }
        }
    
        // 3. Now, check which of the unspent deposits are expiring soon
        const now = new Date();
        const expirationDays = selectedArena.credit_expiration_days;
    
        return unspentDeposits
            .map(tx => {
                const creationDate = new Date(tx.created_at!);
                const expirationDate = addDays(creationDate, expirationDays);
                const daysUntilExpiry = differenceInHours(expirationDate, now) / 24;
                return { ...tx, expirationDate, daysUntilExpiry };
            })
            .filter(tx => isAfter(tx.expirationDate, now) && tx.daysUntilExpiry <= 7)
            .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    
    }, [alunoProfile, selectedArena, creditHistory]);
  
    const currentLevel = useMemo(() => {
      if (!alunoProfile || !levels || levels.length === 0) return null;
      const sortedLevels = [...levels].sort((a, b) => b.points_required - a.points_required);
      return sortedLevels.find(l => (alunoProfile.gamification_points || 0) >= l.points_required) || null;
    }, [alunoProfile, levels]);
  
    const nextLevel = useMemo(() => {
        if (!currentLevel || !levels) return null;
        const sortedLevels = [...levels].sort((a, b) => a.points_required - b.points_required);
        const currentLevelIndex = sortedLevels.findIndex(l => l.id === currentLevel.id);
        if (currentLevelIndex > -1 && currentLevelIndex < sortedLevels.length - 1) {
            return sortedLevels[currentLevelIndex + 1];
        }
        return null;
    }, [currentLevel, levels]);
  
    const progressPercentage = useMemo(() => {
        if (!currentLevel || !alunoProfile) return 0;
        const currentPoints = alunoProfile.gamification_points || 0;
        const currentLevelPoints = currentLevel.points_required;
  
        if (!nextLevel) return 100;
  
        const nextLevelPoints = nextLevel.points_required;
        const pointsForLevel = nextLevelPoints - currentLevelPoints;
        const pointsInLevel = currentPoints - currentLevelPoints;
  
        if (pointsForLevel <= 0) return 100;
  
        return Math.min((pointsInLevel / pointsForLevel) * 100, 100);
    }, [alunoProfile, currentLevel, nextLevel]);
  
    const availableReward = useMemo(() => {
      if (!alunoProfile || !rewards) return null;
      const userPoints = alunoProfile.gamification_points || 0;
      return rewards
          .filter(r => r.is_active && r.points_cost <= userPoints && (r.quantity === null || r.quantity > 0))
          .sort((a, b) => b.points_cost - a.points_cost)[0];
    }, [alunoProfile, rewards]);
  
    const nextReward = useMemo(() => {
        if (!alunoProfile || !rewards) return null;
        const userPoints = alunoProfile.gamification_points || 0;
        return rewards
            .filter(r => r.is_active && r.points_cost > userPoints)
            .sort((a, b) => a.points_cost - b.points_cost)[0];
    }, [alunoProfile, rewards]);
  
    const attendanceSummary = useMemo(() => {
      if (!alunoProfile?.aulas_agendadas) {
        return { total: 0, presencas: 0, faltas: 0 };
      }
      const pastScheduledClasses = alunoProfile.aulas_agendadas.filter(aula => 
        isPast(endOfDay(parseDateStringAsLocal(aula.date)))
      );
      const presencas = pastScheduledClasses.length;
      const faltas = 0;
      const total = presencas + faltas;
      return { total, presencas, faltas };
    }, [alunoProfile]);
  
    useEffect(() => {
      if (nextReservation) {
        const reservationDate = parseDateStringAsLocal(nextReservation.date);
        const [hours, minutes] = nextReservation.start_time.split(':').map(Number);
        reservationDate.setHours(hours, minutes);
        const reservationDateTime = reservationDate;
        
        const updateDistance = () => {
          if (isAfter(reservationDateTime, new Date())) {
            const distance = formatDistanceToNow(reservationDateTime, { addSuffix: true, locale: ptBR });
            setTimeUntilNext(distance);
          } else {
            setTimeUntilNext(null);
          }
        };
  
        updateDistance();
        const interval = setInterval(updateDistance, 60000);
  
        return () => clearInterval(interval);
      } else {
        setTimeUntilNext(null);
      }
    }, [nextReservation]);
  
    const reservationDetailsString = useMemo(() => {
      if (!nextReservation) return '';
      const reservationDate = parseDateStringAsLocal(nextReservation.date);
      const [hours, minutes] = nextReservation.start_time.split(':').map(Number);
      reservationDate.setHours(hours, minutes);
      return format(reservationDate, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
    }, [nextReservation]);
  
    useEffect(() => { if (profile?.id) { const savedFavorites = localStorage.getItem(`favorite_quadras_${profile.id}`); if (savedFavorites) setFavoriteQuadras(JSON.parse(savedFavorites)); } }, [profile?.id]); 
    const toggleFavorite = (quadraId: string) => { if (!profile) return; const newFavorites = favoriteQuadras.includes(quadraId) ? favoriteQuadras.filter(id => id !== quadraId) : [...favoriteQuadras, quadraId]; setFavoriteQuadras(newFavorites); localStorage.setItem(`favorite_quadras_${profile.id}`, JSON.stringify(newFavorites)); }; 
    const sortedQuadras = useMemo(() => { return [...quadras].sort((a, b) => { const aIsFav = favoriteQuadras.includes(a.id); const bIsFav = favoriteQuadras.includes(b.id); if (aIsFav && !bIsFav) return -1; if (!aIsFav && bIsFav) return 1; return a.name.localeCompare(b.name); }); }, [quadras, favoriteQuadras]); 
    const quadraName = nextReservation ? quadras.find(q => q.id === nextReservation.quadra_id)?.name : '';
    
    const upcomingTournaments = useMemo(() => {
        if (!tournaments) return [];
        const today = startOfDay(new Date());
        return tournaments.filter(t => {
            if (t.status !== 'inscricoes_abertas') return false;
            // Check if ANY category has a start date in the future or today
            return t.categories.some(cat => {
                try {
                    const startDate = parseDateStringAsLocal(cat.start_date);
                    return !isBefore(startDate, today);
                } catch (e) {
                    return false;
                }
            });
        }).sort((a, b) => {
            const aDate = Math.min(...a.categories.map(c => parseDateStringAsLocal(c.start_date).getTime()));
            const bDate = Math.min(...b.categories.map(c => parseDateStringAsLocal(c.start_date).getTime()));
            return aDate - bDate;
        });
    }, [tournaments]);

    const renderFirstCard = () => {
      if (nextProfessorClass) {
        return <ProfessorNextClassCard nextClass={nextProfessorClass} onClick={() => onOpenClassAttendanceModal(nextProfessorClass)} />;
      }
      if (nextClass) {
        return <NextClassCard date={nextClass.date} turmaName={nextClass.turma.name} quadraName={nextClass.quadra?.name} professorName={nextClass.professor?.name} startTime={nextClass.time} arenaName={arenaName} />;
      }
      if (nextReservation) {
        return <UpcomingReservationCard reservation={nextReservation} quadra={quadras.find(q => q.id === nextReservation.quadra_id)} index={0} arenaName={arenaName} />;
      }
      if (selectedArena) {
        return <ArenaInfoCard arena={selectedArena} />;
      }
      return <EmptyState message="Você não tem nenhuma atividade agendada." />;
    };
  
    const renderSecondCard = () => {
      if (nextProfessorClass && nextClass) {
        return <NextClassCard date={nextClass.date} turmaName={nextClass.turma.name} quadraName={nextClass.quadra?.name} professorName={nextClass.professor?.name} startTime={nextClass.time} arenaName={arenaName} />;
      }
      if ((nextProfessorClass || nextClass) && nextReservation) {
        return <UpcomingReservationCard reservation={nextReservation} quadra={quadras.find(q => q.id === nextReservation.quadra_id)} index={0} arenaName={arenaName} />;
      }
      return null;
    };

    return ( 
      <div className="space-y-8"> 
        {pendingReservations.map(res => (
          <Alert
            key={res.id}
            type="warning"
            title="Pagamento Pendente"
            message={
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p>Sua reserva para {format(parseDateStringAsLocal(res.date), 'dd/MM')} às {res.start_time.slice(0,5)} expira em <Timer deadline={res.payment_deadline!} onExpire={onDataChange} />.</p>
                <Button size="sm" onClick={() => onDetail(res)} className="mt-2 sm:mt-0">Ver Detalhes e Pagar</Button>
              </div>
            }
          />
        ))}
        {timeUntilNext && nextReservation && nextReservation.status !== 'cancelada' && !nextProfessorClass && !nextClass && (
          <Alert
            type="info"
            title="Lembrete de Reserva"
            message={
              <span>
                Sua próxima reserva {quadraName ? `na quadra ${quadraName}` : ''} é {timeUntilNext}{' '}
                <span className="font-semibold block sm:inline sm:ml-1 capitalize">({reservationDetailsString})</span>.
              </span>
            }
          />
        )}
        
        {expiringCredits.length > 0 && (
          <Alert
              type="warning"
              title="Créditos a Expirar"
              message={
                  <div>
                      <p>Você tem créditos que expirarão em breve. Use-os antes que seja tarde!</p>
                      <ul className="list-disc list-inside mt-2 text-sm">
                          {expiringCredits.map(tx => (
                              <li key={tx.id}>
                                  <strong>{formatCurrency(tx.amount)}</strong> expira em {Math.ceil(tx.daysUntilExpiry)} dia(s) ({format(tx.expirationDate, 'dd/MM/yyyy')}).
                              </li>
                          ))}
                      </ul>
                  </div>
              }
          />
        )}
        
        {upcomingTournaments.length > 0 && <TournamentBanner torneio={upcomingTournaments[0]} />}
        <TournamentInvitesWidget tournaments={tournaments} profile={profile!} onUpdateInvite={onUpdateTournamentInvite} />
        <MyTournamentsWidget tournaments={tournaments} profile={profile!} onInvitePartner={onInvitePartner} />
    
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {renderFirstCard()}
          </div>
          <div className="lg:col-span-1">
            {renderSecondCard()}
          </div>
          <button onClick={() => onOpenProfileModal('gamification')} className="w-full text-left bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700 hover:shadow-lg hover:border-brand-blue-500 transition-all">
            <h4 className="font-semibold text-brand-gray-800 dark:text-white mb-3 flex items-center"><Star className="h-5 w-5 mr-2 text-yellow-400" /> Meu Nível</h4>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-bold text-lg text-brand-blue-500">{currentLevel?.name || 'Iniciante'}</span>
              <span className="font-bold text-sm text-brand-gray-700 dark:text-brand-gray-300">{alunoProfile?.gamification_points || 0} Pontos</span>
            </div>
            <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
              <div className="bg-brand-blue-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            {nextLevel && (
              <p className="text-xs text-right mt-1 text-brand-gray-500">Faltam {nextLevel.points_required - (alunoProfile?.gamification_points || 0)} pts para {nextLevel.name}</p>
            )}
            <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
              {availableReward ? (
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400">Recompensa disponível!</p>
                    <p className="text-xs text-brand-gray-500">{availableReward.title}</p>
                  </div>
                </div>
              ) : nextReward ? (
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="h-5 w-5 text-brand-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-gray-700 dark:text-brand-gray-300">Próxima recompensa</p>
                    <p className="text-xs text-brand-gray-500">{nextReward.title} (Faltam {nextReward.points_cost - (alunoProfile?.gamification_points || 0)} pts)</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-brand-gray-500">Continue jogando para desbloquear recompensas!</p>
              )}
            </div>
          </button>
          <button onClick={() => onOpenProfileModal('credits')} className="w-full text-left bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700 hover:shadow-lg hover:border-brand-blue-500 transition-all">
              <h4 className="font-semibold text-brand-gray-800 dark:text-white mb-3 flex items-center"><CreditCard className="h-5 w-5 mr-2 text-green-500" /> Meus Créditos</h4>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{formatCurrency(alunoProfile?.credit_balance)}</p>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">Seu saldo para usar em reservas.</p>
          </button>
          {alunoProfile?.plan_id && (
            <button onClick={onOpenAttendanceModal} className="w-full text-left bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700 hover:shadow-lg hover:border-brand-blue-500 transition-all">
              <h4 className="font-semibold text-brand-gray-800 dark:text-white mb-3 flex items-center"><Calendar className="h-5 w-5 mr-2 text-purple-500" /> Meu Progresso de Aulas</h4>
              <div className="flex justify-around text-center">
                <div><p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{attendanceSummary.total}</p><p className="text-xs text-brand-gray-500">Aulas Dadas</p></div>
                <div><p className="text-2xl font-bold text-green-500">{attendanceSummary.presencas}</p><p className="text-xs text-brand-gray-500">Presenças</p></div>
                <div><p className="text-2xl font-bold text-red-500">{attendanceSummary.faltas}</p><p className="text-xs text-brand-gray-500">Faltas</p></div>
              </div>
              <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5 mt-4">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${attendanceSummary.total > 0 ? (attendanceSummary.presencas / attendanceSummary.total) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-right mt-1 text-brand-gray-500">Frequência de {attendanceSummary.total > 0 ? ((attendanceSummary.presencas / attendanceSummary.total) * 100).toFixed(0) : 0}%</p>
            </button>
          )}
        </div>
  
        <QuickBookingWidget quadras={sortedQuadras} reservas={reservas} onSlotClick={onSlotClick} selectedDate={selectedDate} setSelectedDate={setSelectedDate} favoriteQuadras={favoriteQuadras} toggleFavorite={toggleFavorite} profile={profile} /> 
      </div> 
    ); 
};
const QuickBookingWidget: React.FC<{ quadras: Quadra[], reservas: Reserva[], onSlotClick: (time: string, quadraId: string) => void, selectedDate: Date, setSelectedDate: (date: Date) => void, favoriteQuadras: string[], toggleFavorite: (quadraId: string) => void, profile: Profile | null, }> = ({quadras, reservas, onSlotClick, selectedDate, setSelectedDate, favoriteQuadras, toggleFavorite, profile}) => { const displayedReservations = useMemo(() => { const viewStartDate = startOfDay(new Date()); const viewEndDate = endOfDay(addDays(new Date(), 365)); return expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras); }, [reservas, quadras]); const generateTimeSlots = (quadra: Quadra) => { const slots = []; const dayOfWeek = getDay(selectedDate); let horario; if (dayOfWeek === 0) horario = quadra.horarios?.sunday; else if (dayOfWeek === 6) horario = quadra.horarios?.saturday; else horario = quadra.horarios?.weekday; if (!horario || !horario.start || !horario.end) return []; let currentTime = parse(horario.start.slice(0, 5), 'HH:mm', selectedDate); let endTime = parse(horario.end.slice(0, 5), 'HH:mm', selectedDate); if (endTime <= currentTime) endTime = addDays(endTime, 1); const interval = 60; while (currentTime < endTime) { slots.push(format(currentTime, 'HH:mm')); currentTime = addMinutes(currentTime, interval); } return slots; }; const getSlotStatus = (time: string, quadraId: string) => { const slotDateTime = parse(time, 'HH:mm', selectedDate); if (isPast(slotDateTime) && !isSameDay(selectedDate, startOfDay(new Date()))) { return { status: 'past', data: null }; } else if (isPast(slotDateTime) && isSameDay(selectedDate, startOfDay(new Date()))) { return { status: 'past', data: null }; } const reserva = displayedReservations.find(r => r.quadra_id === quadraId && isSameDay(parseDateStringAsLocal(r.date), selectedDate) && r.start_time.slice(0, 5) === time && r.status !== 'cancelada'); if (reserva) return { status: 'booked', data: reserva }; return { status: 'available', data: null }; }; const getPriceRange = (quadra: Quadra) => { if (!quadra.pricing_rules || quadra.pricing_rules.length === 0) return "A definir"; const activePrices = quadra.pricing_rules.filter(r => r.is_active).map(r => r.price_single); if (activePrices.length === 0) return "A definir"; const minPrice = Math.min(...activePrices); const maxPrice = Math.max(...activePrices); if (minPrice === maxPrice) return formatCurrency(minPrice); return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`; }; const renderSlotButton = (quadra: Quadra, time: string) => { const { status } = getSlotStatus(time, quadra.id); let styles = 'bg-brand-gray-100 text-brand-gray-500 dark:bg-brand-gray-700 dark:text-brand-gray-400'; let icon = <Clock className="h-3 w-3 mr-1" />; if (status === 'available') { styles = 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20'; } else if (status === 'past') { styles = 'bg-brand-gray-100 text-brand-gray-400 dark:bg-brand-gray-700/50 dark:text-brand-gray-500 cursor-not-allowed'; } else if (status === 'booked') { styles = 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 cursor-not-allowed'; } return ( <motion.button key={time} whileHover={{ scale: status === 'available' ? 1.05 : 1 }} whileTap={{ scale: status === 'available' ? 0.95 : 1 }} onClick={() => onSlotClick(time, quadra.id)} disabled={status !== 'available'} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-center ${styles}`}> <div className="flex items-center justify-center"> {icon} {time.slice(0,5)} </div> </motion.button> ); }; return ( <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6"> <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4 flex items-center"><Calendar className="h-5 w-5 mr-2 text-brand-blue-500" /> Reserva Rápida</h3> <div className="mb-6"> <DatePickerCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} /> </div> <div className="space-y-6"> {quadras.map(quadra => ( <div key={quadra.id}> <div className="flex justify-between items-center mb-3"> <div> <h4 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{quadra.name}</h4> <p className="text-sm text-brand-gray-500">{quadra.sports.join(', ')} - <span className="font-medium text-green-600">{getPriceRange(quadra)}</span></p> </div> {profile && ( <button onClick={() => toggleFavorite(quadra.id)} className="p-2 rounded-full hover:bg-red-100/50 dark:hover:bg-red-500/10 transition-colors"> <Heart className={`h-5 w-5 transition-all ${favoriteQuadras.includes(quadra.id) ? 'fill-current text-red-500' : 'text-brand-gray-400'}`} /> </button> )} </div> <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"> {generateTimeSlots(quadra).map(time => renderSlotButton(quadra, time))} </div> </div> ))} </div> </div> ); };
const EmptyState: React.FC<{message: string}> = ({ message }) => ( <div className="text-center h-full flex flex-col justify-center items-center py-10 px-6 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700"> <p className="text-brand-gray-600 dark:text-brand-gray-400">{message}</p> </div> );

const ClientDashboard: React.FC = () => {
    const { profile, selectedArenaContext, switchArenaContext, memberships, allArenas, alunoProfileForSelectedArena, refreshAlunoProfile, updateProfile, currentAtletaId, currentProfessorId } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeView, setActiveView] = useState<View>('inicio');
    const [quadras, setQuadras] = useState<Quadra[]>([]);
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [completedReservationsCount, setCompletedReservationsCount] = useState(0);
    const [allArenaReservations, setAllArenaReservations] = useState<Reserva[]>([]);
    const [allArenaAlunos, setAllArenaAlunos] = useState<Aluno[]>([]);
    const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
    const [gamificationHistory, setGamificationHistory] = useState<GamificationPointTransaction[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<{ id: string; date: string; description: string; amount: number }[]>([]);
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [professores, setProfessores] = useState<Professor[]>([]);
    const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
    const [planos, setPlanos] = useState<PlanoAula[]>([]);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tournaments, setTournaments] = useState<Torneio[]>([]);
    
    const [levels, setLevels] = useState<GamificationLevel[]>([]);
    const [rewards, setRewards] = useState<GamificationReward[]>([]);
    const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<AlunoAchievement[]>([]);
    const [gamificationEnabled, setGamificationEnabled] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSlot, setModalSlot] = useState<{ quadraId: string; time: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState<Reserva | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [reservationToDetail, setReservationToDetail] = useState<Reserva | null>(null);
    
    const [isHirePlayerModalOpen, setIsHirePlayerModalOpen] = useState(false);
    const [reservationToHireFor, setReservationToHireFor] = useState<Reserva | null>(null);
    
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [atletaToAssign, setAtletaToAssign] = useState<AtletaAluguel | null>(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState<{ reservation: Reserva; amount: number; isPartial: boolean } | null>(null);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileModalInitialTab, setProfileModalInitialTab] = useState<'credits' | 'gamification' | 'payments'>('credits');

    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    
    const [isAvaliarAtletaModalOpen, setIsAvaliarAtletaModalOpen] = useState(false);
    const [reservaToEvaluate, setReservaToEvaluate] = useState<Reserva | null>(null);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [atletaToContact, setAtletaToContact] = useState<AtletaAluguel | null>(null);

    const [isCancelAtletaConfirmOpen, setIsCancelAtletaConfirmOpen] = useState(false);
    const [isPayAtletaModalOpen, setIsPayAtletaModalOpen] = useState(false);
    const [atletaToPay, setAtletaToPay] = useState<AtletaAluguel | null>(null);
    const [reservaForAtletaPayment, setReservaForAtletaPayment] = useState<Reserva | null>(null);

    const [viewingAtletaProfile, setViewingAtletaProfile] = useState<{ atleta: AtletaAluguel; completedGames: number } | null>(null);

    const [isAvaliarProfessorModalOpen, setIsAvaliarProfessorModalOpen] = useState(false);
    const [classToEvaluate, setClassToEvaluate] = useState<any | null>(null);

    const [isInvitePartnerModalOpen, setIsInvitePartnerModalOpen] = useState(false);
    const [tournamentToInvite, setTournamentToInvite] = useState<Torneio | null>(null);
    const [participantToUpdate, setParticipantToUpdate] = useState<Participant | null>(null);
    const [isInviting, setIsInviting] = useState(false);

    const isStudent = useMemo(() => !!alunoProfileForSelectedArena?.plan_id, [alunoProfileForSelectedArena]);

    const myArenas = useMemo(() => {
        return allArenas.filter(arena => memberships.some(m => m.arena_id === arena.id));
    }, [allArenas, memberships]);
    
    const loadData = useCallback(async () => {
        if (!profile) {
        setIsLoading(false);
        return;
        }
        
        if (!selectedArenaContext) {
        setIsLoading(false);
        setQuadras([]); setAllArenaReservations([]); setTurmas([]); setProfessores([]);
        setAtletas([]); setPlanos([]); setAllArenaAlunos([]);
        setReservas([]); setCreditHistory([]); setGamificationHistory([]); setPaymentHistory([]);
        setTournaments([]);
        return;
        }

        setIsLoading(true);
        try {
        const [quadrasRes, allReservasRes, turmasRes, profsRes, atletasRes, creditRes, gamificationHistoryRes, gamificationSettingsRes, levelsRes, rewardsRes, achievementsRes, unlockedAchievementsRes, planosRes, allAlunosRes, friendshipsRes, profilesRes, financeTransactionsRes, tournamentsRes] = await Promise.all([
            localApi.select<Quadra>('quadras', selectedArenaContext.id),
            localApi.select<Reserva>('reservas', selectedArenaContext.id),
            localApi.select<Turma>('turmas', selectedArenaContext.id),
            localApi.select<Professor>('professores', selectedArenaContext.id),
            localApi.select<AtletaAluguel>('atletas_aluguel', selectedArenaContext.id),
            alunoProfileForSelectedArena ? localApi.select<CreditTransaction>('credit_transactions', selectedArenaContext.id) : Promise.resolve({ data: [] }),
            alunoProfileForSelectedArena ? localApi.select<GamificationPointTransaction>('gamification_point_transactions', selectedArenaContext.id) : Promise.resolve({ data: [] }),
            localApi.select<GamificationSettings>('gamification_settings', selectedArenaContext.id),
            localApi.select<GamificationLevel>('gamification_levels', selectedArenaContext.id),
            localApi.select<GamificationReward>('gamification_rewards', selectedArenaContext.id),
            localApi.select<GamificationAchievement>('gamification_achievements', selectedArenaContext.id),
            alunoProfileForSelectedArena ? localApi.select<AlunoAchievement>('aluno_achievements', selectedArenaContext.id) : Promise.resolve({ data: [] }),
            localApi.select<PlanoAula>('planos_aulas', selectedArenaContext.id),
            localApi.select<Aluno>('alunos', selectedArenaContext.id),
            localApi.select<Friendship>('friendships', 'all'),
            localApi.select<Profile>('profiles', 'all'),
            localApi.select<FinanceTransaction>('finance_transactions', selectedArenaContext.id),
            localApi.select<Torneio>('torneios', selectedArenaContext.id),
        ]);
        
        const now = new Date();
        let reservationsData = allReservasRes.data || [];
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

        const allReservations = reservationsData;
        setAllArenaReservations(allReservations);
        
        const myReservations = allReservations.filter(r => 
            r.profile_id === profile.id || r.participants?.some(p => p.profile_id === profile.id)
        );
        setReservas(myReservations);

        const myBookedReservations = allReservations.filter(r => r.profile_id === profile.id);
        const completedCount = myBookedReservations.filter(r => (r.status === 'confirmada' || r.status === 'realizada') && isBefore(parseDateStringAsLocal(`${r.date}T${r.end_time}`), new Date())).length;
        setCompletedReservationsCount(completedCount);

        setQuadras(quadrasRes.data || []);
        setTurmas(turmasRes.data || []);
        setProfessores(profsRes.data || []);
        setAtletas(atletasRes.data || []);
        setPlanos(planosRes.data || []);
        setAllArenaAlunos(allAlunosRes.data || []);
        setTournaments(tournamentsRes.data || []);

        const userFriendships = (friendshipsRes.data || []).filter(f => f.status === 'accepted' && (f.user1_id === profile.id || f.user2_id === profile.id));
        const friendIds = userFriendships.map(f => f.user1_id === profile.id ? f.user2_id : f.user1_id);
        const friendProfiles = (profilesRes.data || []).filter(p => friendIds.includes(p.id));
        setFriends(friendProfiles);
        
        const settings = gamificationSettingsRes.data?.[0];
        setGamificationEnabled(settings?.is_enabled || false);

        if (alunoProfileForSelectedArena) {
            setGamificationHistory((gamificationHistoryRes.data || []).filter(t => t.aluno_id === alunoProfileForSelectedArena.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setCreditHistory((creditRes.data || []).filter(c => c.aluno_id === alunoProfileForSelectedArena.id).sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()));
            
            const reservationPayments = allReservations
            .filter(r => r.profile_id === profile.id && r.payment_status === 'pago' && (r.total_price || 0) > 0)
            .map(r => ({
                id: `res-payment-${r.id}`,
                date: r.updated_at || r.created_at,
                description: `Pagamento Reserva: ${r.clientName} em ${format(parseDateStringAsLocal(r.date), 'dd/MM/yy')}`,
                amount: r.total_price!,
            }));

            const planPayments = (financeTransactionsRes.data || [])
            .filter(t => t.description.includes(alunoProfileForSelectedArena.name) && t.category === 'Mensalidade')
            .map(t => ({
                id: `plan-payment-${t.id}`,
                date: t.created_at,
                description: t.description,
                amount: t.amount,
            }));

            const combinedPayments = [...reservationPayments, ...planPayments]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setPaymentHistory(combinedPayments);

            if (settings?.is_enabled) {
                setLevels((levelsRes.data || []).sort((a, b) => a.points_required - b.points_required));
                setRewards((rewardsRes.data || []).filter(r => r.is_active));
                setAchievements(achievementsRes.data || []);
                setUnlockedAchievements((unlockedAchievementsRes.data || []).filter(ua => ua.aluno_id === alunoProfileForSelectedArena.id));
            }
        } else {
            setCreditHistory([]); setGamificationHistory([]); setPaymentHistory([]);
        }

        } catch (error: any) {
        console.error("Erro ao carregar dados do cliente:", error);
        addToast({ message: 'Erro ao carregar os dados do painel.', type: 'error' });
        } finally {
        setIsLoading(false);
        }
    }, [selectedArenaContext, profile, addToast, alunoProfileForSelectedArena]);

    const handleDataChange = useCallback(async () => {
        await refreshAlunoProfile();
        await loadData();
    }, [loadData, refreshAlunoProfile]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    useEffect(() => {
        const checkAndAwardPoints = async () => {
        if (!profile || !selectedArenaContext || !alunoProfileForSelectedArena || reservas.length === 0 || !gamificationEnabled) {
            return;
        }
    
        const now = new Date();
        const myCompletedReservations = reservas.filter(r => {
            const isMine = r.profile_id === profile.id;
            const isConfirmed = r.status === 'confirmada' || r.status === 'realizada';
            if (!isMine || !isConfirmed) return false;
            
            try {
            const endDateTime = new Date(`${r.date}T${r.end_time}`);
            return isBefore(endDateTime, now);
            } catch {
            return false;
            }
        });
    
        if (myCompletedReservations.length === 0) return;
    
        const { data: transactions } = await localApi.select<GamificationPointTransaction>('gamification_point_transactions', selectedArenaContext.id);
        const processedReservationIds = new Set(transactions
            .filter(t => t.type === 'reservation_completed')
            .map(t => t.related_reservation_id)
        );
    
        const reservationsToProcess = myCompletedReservations.filter(r => !r.id || !processedReservationIds.has(r.id));
    
        if (reservationsToProcess.length > 0) {
            let pointsAwarded = false;
            for (const reserva of reservationsToProcess) {
            await awardPointsForCompletedReservation(reserva, selectedArenaContext.id);
            pointsAwarded = true;
            }
            if (pointsAwarded) {
            addToast({ message: 'Pontos de jogos concluídos foram adicionados!', type: 'success' });
            await handleDataChange();
            }
        }
        };
    
        checkAndAwardPoints();
    }, [reservas, profile, selectedArenaContext, alunoProfileForSelectedArena, gamificationEnabled, handleDataChange, addToast]);

    const handleSlotClick = (time: string, quadraId: string) => { setModalSlot({ quadraId, time }); setIsModalOpen(true); };
    
    const handleSaveClientReservation = async (reservationData: Omit<Reserva, 'id' | 'created_at' | 'arena_id'> | Reserva) => {
        if (!selectedArenaContext || !profile) { addToast({ message: 'Erro: Contexto do usuário ou da arena não encontrado.', type: 'error' }); return; }
        try {
            const payload = { ...reservationData, arena_id: selectedArenaContext.id, profile_id: profile.id, clientName: profile.name, clientPhone: profile.phone || '' };
            
            let savedReserva: Reserva;
            const isEditing = 'id' in payload;

            if (isEditing) {
                const { data } = await localApi.upsert('reservas', [payload], selectedArenaContext.id);
                savedReserva = data[0];
            } else {
                const { data: arenas } = await localApi.select<Arena>('arenas', 'all');
                const currentArena = arenas.find(a => a.id === selectedArenaContext.id);
                const paymentWindow = currentArena?.single_booking_payment_window_minutes || 30;
                const newReservaPayload: Omit<Reserva, 'id' | 'created_at'> = {
                    ...payload,
                    status: (payload.total_price || 0) > 0 ? 'aguardando_pagamento' : 'confirmada',
                    payment_deadline: (payload.total_price || 0) > 0 ? addMinutes(new Date(), paymentWindow).toISOString() : null,
                };
                const { data } = await localApi.upsert('reservas', [newReservaPayload], selectedArenaContext.id);
                savedReserva = data[0];
            }

            if (savedReserva && savedReserva.credit_used && savedReserva.credit_used > 0) {
                const newlyAppliedCredit = savedReserva.credit_used - ((reservationData as any).originalCreditUsed || 0);
                if (newlyAppliedCredit > 0 && alunoProfileForSelectedArena?.id) {
                    const { data: allAlunos } = await localApi.select<Aluno>('alunos', selectedArenaContext.id);
                    const targetAluno = allAlunos.find(a => a.id === alunoProfileForSelectedArena!.id);
                    if (targetAluno) {
                        targetAluno.credit_balance = (targetAluno.credit_balance || 0) - newlyAppliedCredit;
                        await localApi.upsert('alunos', [targetAluno], selectedArenaContext.id);
                        const quadraName = quadras.find(q => q.id === savedReserva.quadra_id)?.name || 'Quadra';
                        const reservaDetails = `${quadraName} em ${format(parseDateStringAsLocal(savedReserva.date), 'dd/MM/yy')} às ${savedReserva.start_time.slice(0,5)}`;
                        const newDescription = `Pagamento da reserva: ${reservaDetails}`;
                        await localApi.upsert('credit_transactions', [{ 
                            aluno_id: targetAluno.id, 
                            arena_id: selectedArenaContext.id, 
                            amount: -newlyAppliedCredit, 
                            type: 'reservation_payment', 
                            description: newDescription,
                            related_reservation_id: savedReserva.id 
                        }], selectedArenaContext.id);
                    }
                }
            }

            let toastMessage = 'Reserva criada com sucesso!';
            if (savedReserva.participants && savedReserva.participants.length > 1) {
                const { data: allProfiles } = await localApi.select<Profile>('profiles', 'all');
                const profilesMap = new Map((allProfiles || []).map(p => [p.id, p]));

                const notifications = savedReserva.participants
                    .filter(p => p.profile_id !== profile.id)
                    .map(p => {
                        const recipientProfile = profilesMap.get(p.profile_id);
                        const wantsGameInvites = recipientProfile?.notification_preferences?.game_invites ?? true;
                        if (wantsGameInvites) {
                            return {
                                profile_id: p.profile_id,
                                arena_id: selectedArenaContext.id,
                                message: `convidou você para um jogo em ${format(parseDateStringAsLocal(savedReserva.date), 'dd/MM')} às ${savedReserva.start_time.slice(0,5)}.`,
                                type: 'game_invite',
                                link_to: '/perfil',
                                sender_id: profile.id,
                                sender_name: profile.name,
                                sender_avatar_url: profile.avatar_url,
                            };
                        }
                        return null;
                    })
                    .filter((n): n is NonNullable<typeof n> => n !== null);
            
                if (notifications.length > 0) {
                    await localApi.upsert('notificacoes', notifications, selectedArenaContext.id);
                    toastMessage = `Reserva criada e ${notifications.length} convite(s) enviado(s)!`;
                }
            }
        
            setIsModalOpen(false);
            setModalSlot(null);
            await handleDataChange();

            if (savedReserva.status === 'aguardando_pagamento') {
                const amountToPay = (savedReserva.total_price || 0) - (savedReserva.credit_used || 0);
                handleOpenPaymentModal(savedReserva, amountToPay, false);
            } else {
                addToast({ message: toastMessage, type: 'success' });
            }

        } catch (error: any) { addToast({ message: `Erro no processo de reserva: ${error.message}`, type: 'error' }); }
    };

    const handleUpdateReservation = async (updatedReserva: Reserva) => {
        if (!selectedArenaContext) return;
        try {
        const { data: savedData } = await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);
        const newlySavedReserva = savedData[0];
        
        if (newlySavedReserva) {
            addToast({ message: 'Reserva atualizada!', type: 'success' });
            await handleDataChange();
            
            if (isDetailModalOpen) {
            setReservationToDetail(newlySavedReserva);
            }
        } else {
            throw new Error("Falha ao salvar os dados da reserva.");
        }
        } catch (error: any) {
        addToast({ message: `Erro ao atualizar reserva: ${error.message}`, type: 'error' });
        loadData();
        }
    };

    const handleUpdateParticipantStatus = async (reservaId: string, profileId: string, status: 'accepted' | 'declined') => {
        if (!selectedArenaContext || !profile) return;
        const reserva = allArenaReservations.find(r => r.id === reservaId);
        if (!reserva) { addToast({ message: 'Reserva não encontrada.', type: 'error' }); return; }

        const updatedParticipants = reserva.participants?.map(p => p.profile_id === profileId ? { ...p, status } : p );
        const updatedReserva = { ...reserva, participants: updatedParticipants };

        await handleUpdateReservation(updatedReserva);

        const ownerProfileId = reserva.profile_id;
        if (ownerProfileId && ownerProfileId !== profile.id) {
            const { data: allProfiles } = await localApi.select<Profile>('profiles', 'all');
            const ownerProfile = allProfiles.find(p => p.id === ownerProfileId);
            const wantsGameInvites = ownerProfile?.notification_preferences?.game_invites ?? true;

            if (wantsGameInvites) {
                await localApi.upsert('notificacoes', [{
                    profile_id: ownerProfileId,
                    arena_id: selectedArenaContext.id,
                    message: `aceitou sua solicitação de amizade.`,
                    type: 'friend_requests',
                    link_to: '/perfil',
                    sender_id: profile.id,
                    sender_name: profile.name,
                    sender_avatar_url: profile.avatar_url,
                }], selectedArenaContext.id);
            }
        }
        addToast({ message: `Convite ${status === 'accepted' ? 'aceito' : 'recusado'}!`, type: 'success' });
    };

    const handleHireProfessional = async (reservaId: string, atletaId: string) => {
        if (!selectedArenaContext || !profile) return;
        const reserva = allArenaReservations.find(r => r.id === reservaId);
        const atleta = atletas.find(p => p.id === atletaId);
        if (!reserva || !atleta) { addToast({ message: 'Reserva ou atleta não encontrado.', type: 'error' }); return; }
    
        const isTroca = !!reserva.atleta_aluguel_id;
        const oldAtletaId = reserva.atleta_aluguel_id;
    
        const updatedReserva: Reserva = {
          ...reserva,
          atleta_aluguel_id: atletaId,
          atleta_cost: atleta.taxa_hora,
          atleta_aceite_status: 'pendente',
          atleta_payment_status: 'pendente_cliente',
          status: 'aguardando_aceite_profissional',
        };
    
        try {
          await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);
          
          if (atleta.profile_id) {
            await localApi.upsert('notificacoes', [{
              profile_id: atleta.profile_id,
              arena_id: selectedArenaContext.id,
              message: `${profile.name} convidou você para jogar em ${format(parseDateStringAsLocal(reserva.date), 'dd/MM')} às ${reserva.start_time.slice(0,5)}.`,
              type: 'game_invite',
              link_to: '/atleta-perfil',
              sender_id: profile?.id,
              sender_name: profile?.name,
              sender_avatar_url: profile?.avatar_url,
            }], selectedArenaContext.id);
          }
          
          if (isTroca && oldAtletaId) {
            const oldAtleta = atletas.find(a => a.id === oldAtletaId);
            if (oldAtleta && oldAtleta.profile_id) {
                await localApi.upsert('notificacoes', [{
                    profile_id: oldAtleta.profile_id,
                    arena_id: selectedArenaContext.id,
                    message: `Você foi substituído no jogo de ${reserva.clientName}.`,
                    type: 'cancellation',
                    sender_id: profile?.id,
                    sender_name: profile?.name,
                    sender_avatar_url: profile?.avatar_url,
                }], selectedArenaContext.id);
            }
          }
          
          addToast({ message: `Solicitação enviada para ${atleta.name}! Aguardando aceite.`, type: 'success' });
          await handleDataChange();
        } catch (error: any) {
          addToast({ message: `Erro ao contratar atleta: ${error.message}`, type: 'error' });
        } finally {
          setIsHirePlayerModalOpen(false);
          setReservationToHireFor(null);
          setIsAssignModalOpen(false);
          setAtletaToAssign(null);
          setIsDetailModalOpen(false);
        }
    };
    
    const handleOpenCancelModal = (reserva: Reserva) => {
        if (reserva.profile_id !== profile?.id) {
            addToast({ message: "Apenas o organizador pode cancelar a reserva.", type: 'error' });
            return;
        }
        if ((reserva.total_price || 0) === 0) { addToast({ message: 'Reservas gratuitas não podem ser canceladas por aqui.', type: 'info' }); return; }
        setReservationToCancel(reserva); setIsCancelModalOpen(true);
    };

    const handleOpenDetailModal = (reserva: Reserva) => { setReservationToDetail(reserva); setIsDetailModalOpen(true); };
    
    const handleConfirmCancellation = async (reservaId: string) => {
        if (!profile || !selectedArenaContext) return;
        try {
        const reserva = reservas.find(r => r.id === reservaId);
        if (!reserva) throw new Error("Reserva não encontrada");
    
        const { creditRefunded } = await processCancellation(reserva, selectedArenaContext.id, quadras);
    
        await localApi.upsert('reservas', [{ ...reserva, status: 'cancelada' }], selectedArenaContext.id);
        
        let toastMessage = 'Reserva cancelada com sucesso!';
        if (creditRefunded > 0) {
            toastMessage += ` ${formatCurrency(creditRefunded)} de crédito foi adicionado à sua conta.`;
        }

        if (selectedArenaContext.owner_id) {
            const quadraName = quadras.find(q => q.id === reserva.quadra_id)?.name || 'Quadra';
            const reservaDetails = `${quadraName} em ${format(parseDateStringAsLocal(reserva.date), 'dd/MM/yy')} às ${reserva.start_time.slice(0,5)}`;
            const notificationMessage = `cancelou a reserva para ${reservaDetails}.`;

            await localApi.upsert('notificacoes', [{
                arena_id: selectedArenaContext.id,
                profile_id: selectedArenaContext.owner_id,
                message: notificationMessage,
                type: 'cancellation',
                read: false,
                sender_id: profile.id,
                sender_name: profile.name,
                sender_avatar_url: profile.avatar_url,
            }], selectedArenaContext.id);
            toastMessage += ' O administrador foi notificado.';
        }

        addToast({ message: toastMessage, type: 'success' });
    
        await handleDataChange();
        } catch (error: any) {
        addToast({ message: `Erro ao cancelar reserva: ${error.message}`, type: 'error' });
        } finally {
        setIsCancelModalOpen(false);
        setReservationToCancel(null);
        }
    };

    const handleOpenPaymentModal = (reserva: Reserva, amount: number, isPartial: boolean) => {
        setIsDetailModalOpen(false);
        setPaymentInfo({ reservation: reserva, amount, isPartial });
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!paymentInfo || !selectedArenaContext || !profile) return;
        setIsPaymentProcessing(true);
        try {
        let updatedReserva: Reserva;
        const { reservation, isPartial } = paymentInfo;

        if (isPartial) {
            const updatedParticipants = reservation.participants?.map(p =>
            p.profile_id === profile.id ? { ...p, payment_status: 'pago' as 'pago' } : p
            ) || [];
            
            const allAcceptedPaid = updatedParticipants.filter(p => p.status === 'accepted').every(p => p.payment_status === 'pago');
            
            updatedReserva = { 
            ...reservation, 
            participants: updatedParticipants,
            payment_status: allAcceptedPaid ? 'pago' : 'parcialmente_pago',
            status: allAcceptedPaid ? 'confirmada' : reservation.status,
            payment_deadline: allAcceptedPaid ? null : reservation.payment_deadline,
            };
        } else {
            updatedReserva = {
            ...reservation,
            status: 'confirmada',
            payment_status: 'pago',
            payment_deadline: null,
            };
        }
        
        await localApi.upsert('reservas', [updatedReserva], selectedArenaContext.id);
        
        addToast({ message: 'Pagamento confirmado e reserva garantida!', type: 'success' });
        await handleDataChange();

        } catch (error: any) {
        addToast({ message: `Erro ao confirmar pagamento: ${error.message}`, type: 'error' });
        } finally {
        setIsPaymentProcessing(false);
        setIsPaymentModalOpen(false);
        setPaymentInfo(null);
        }
    };
    
    const handleOpenProfileModal = (tab: 'credits' | 'gamification' | 'payments') => {
        setProfileModalInitialTab(tab);
        setIsProfileModalOpen(true);
    };

    const handleProfileUpdate = async (updatedProfileData: Partial<Profile>) => {
        await updateProfile(updatedProfileData);
        await refreshAlunoProfile();
    };

    const handleAvaliarAtleta = (reserva: Reserva) => {
        setReservaToEvaluate(reserva);
        setIsAvaliarAtletaModalOpen(true);
        setIsDetailModalOpen(false);
    };

    const handleConfirmAvaliacao = async (rating: number, comment: string, tags: string[]) => {
        if (!reservaToEvaluate || !reservaToEvaluate.atleta_aluguel_id || !profile || !selectedArenaContext) return;
        
        const atleta = atletas.find(a => a.id === reservaToEvaluate!.atleta_aluguel_id);
        if (!atleta) return;

        const newRating = {
            clientId: profile.id,
            reservationId: reservaToEvaluate.id,
            clientName: profile.name,
            rating,
            comment,
            tags,
            date: new Date().toISOString(),
        };

        const updatedRatings = [...(atleta.ratings || []), newRating];
        const newAvgRating = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length;

        const updatedAtleta = { ...atleta, ratings: updatedRatings, avg_rating: newAvgRating };

        try {
            await localApi.upsert('atletas_aluguel', [updatedAtleta], selectedArenaContext.id);
            addToast({ message: 'Avaliação enviada com sucesso!', type: 'success' });
            await loadData();
        } catch (error: any) {
            addToast({ message: `Erro ao enviar avaliação: ${error.message}`, type: 'error' });
        } finally {
            setIsAvaliarAtletaModalOpen(false);
            setReservaToEvaluate(null);
        }
    };

    const handleAvaliarProfessor = (classData: any) => {
        setClassToEvaluate(classData);
        setIsAvaliarProfessorModalOpen(true);
    };

    const handleConfirmAvaliacaoProfessor = async (rating: number, comment: string) => {
        if (!classToEvaluate || !classToEvaluate.professor || !alunoProfileForSelectedArena || !selectedArenaContext) return;
        
        const professorToUpdate = professores.find(p => p.id === classToEvaluate.professor.id);
        if (!professorToUpdate) return;

        const newRating = {
            aluno_id: alunoProfileForSelectedArena.id,
            rating,
            comment,
            date: new Date().toISOString(),
        };

        const updatedRatings = [...(professorToUpdate.ratings || []), newRating];
        const newAvgRating = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length;

        const updatedProfessor = { ...professorToUpdate, ratings: updatedRatings, avg_rating: newAvgRating };

        try {
            await localApi.upsert('professores', [updatedProfessor], selectedArenaContext.id);
            addToast({ message: 'Avaliação enviada com sucesso!', type: 'success' });
            await loadData();
        } catch (error: any) {
            addToast({ message: `Erro ao enviar avaliação: ${error.message}`, type: 'error' });
        } finally {
            setIsAvaliarProfessorModalOpen(false);
            setClassToEvaluate(null);
        }
    };

    const handleContactAtleta = (atleta: AtletaAluguel) => {
        setAtletaToContact(atleta);
        setIsMessageModalOpen(true);
    };

    const handleSendMessage = async (message: string) => {
        if (!atletaToContact || !atletaToContact.profile_id || !profile || !selectedArenaContext) {
            addToast({ message: 'Não foi possível enviar a mensagem.', type: 'error' });
            return;
        }
        try {
            await localApi.upsert('notificacoes', [{
                profile_id: atletaToContact.profile_id,
                arena_id: selectedArenaContext.id,
                message,
                type: 'direct_message',
                sender_id: profile.id,
                sender_name: profile.name,
                sender_avatar_url: profile.avatar_url,
            }], selectedArenaContext.id);
            addToast({ message: 'Mensagem enviada!', type: 'success' });
        } catch (error: any) {
            addToast({ message: `Erro: ${error.message}`, type: 'error' });
        } finally {
            setIsMessageModalOpen(false);
            setAtletaToContact(null);
        }
    };
    
    const handleTrocarAtleta = (reserva: Reserva) => {
        setReservationToHireFor(reserva);
        setIsHirePlayerModalOpen(true);
    };
    
    const handleCancelarAtleta = () => {
        setIsCancelAtletaConfirmOpen(true);
    };

    const handleConfirmCancelAtleta = async () => {
        if (!reservationToDetail || !reservationToDetail.atleta_aluguel_id || !selectedArenaContext) return;
        
        const atleta = atletas.find(a => a.id === reservationToDetail.atleta_aluguel_id);
    
        const updatedReserva = { 
            ...reservationToDetail, 
            atleta_aceite_status: 'cancelado_pelo_cliente' as 'cancelado_pelo_cliente',
            atleta_cost: 0,
            atleta_payment_status: null,
            athlete_payment_deadline: null,
            status: 'confirmada',
        };
    
        try {
            await handleUpdateReservation(updatedReserva);
    
            if (atleta && atleta.profile_id) {
                await localApi.upsert('notificacoes', [{
                    profile_id: atleta.profile_id,
                    arena_id: selectedArenaContext.id,
                    message: `Sua participação no jogo de ${reservationToDetail.clientName} foi cancelada.`,
                    type: 'cancellation',
                    sender_id: profile?.id,
                    sender_name: profile?.name,
                    sender_avatar_url: profile?.avatar_url,
                }], selectedArenaContext.id);
            }
    
            addToast({ message: 'Contratação do atleta cancelada.', type: 'success' });
        } catch(e) {
            addToast({ message: 'Erro ao cancelar contratação.', type: 'error' });
        } finally {
            setIsCancelAtletaConfirmOpen(false);
        }
    };

    const handlePayAtleta = (reserva: Reserva, atleta: AtletaAluguel) => {
        setReservaForAtletaPayment(reserva);
        setAtletaToPay(atleta);
        setIsPayAtletaModalOpen(true);
    };

    const handleConfirmPayAtleta = async () => {
        if (!reservaForAtletaPayment || !atletaToPay || !selectedArenaContext) return;

        const updatedReserva = { ...reservaForAtletaPayment, atleta_payment_status: 'pendente_repasse' as 'pendente_repasse' };
        
        try {
            await handleUpdateReservation(updatedReserva);
            addToast({ message: 'Pagamento registrado. O administrador da arena fará o repasse ao atleta.', type: 'success' });
        } catch(e) {
            addToast({ message: 'Erro ao registrar pagamento.', type: 'error' });
        } finally {
            setIsPayAtletaModalOpen(false);
        }
    };

    const handleAthletePaymentExpire = async (reserva: Reserva) => {
        if (!selectedArenaContext) return;
        const atleta = atletas.find(a => a.id === reserva.atleta_aluguel_id);
        const updatedReserva = {
          ...reserva,
          atleta_aluguel_id: null,
          atleta_cost: 0,
          atleta_aceite_status: null,
          atleta_payment_status: null,
          athlete_payment_deadline: null,
          notes: (reserva.notes || '') + ` [Contratação de ${atleta?.name || 'atleta'} cancelada por falta de pagamento]`
        };
        await handleUpdateReservation(updatedReserva);
        if (atleta && atleta.profile_id && profile) {
          await localApi.upsert('notificacoes', [{
            arena_id: selectedArenaContext.id,
            profile_id: atleta.profile_id,
            message: `O prazo para pagamento do jogo com ${reserva.clientName} expirou e a contratação foi cancelada.`,
            type: 'cancellation',
            read: false,
            sender_id: profile.id,
            sender_name: profile.name,
            sender_avatar_url: profile.avatar_url,
          }], selectedArenaContext.id);
        }
        addToast({ message: 'Prazo de pagamento do atleta expirou. A contratação foi cancelada.', type: 'warning' });
        setIsDetailModalOpen(false);
    };

    const handleUpdateTournamentInvite = async (torneioId: string, participantId: string, status: 'accepted' | 'declined') => {
        if (!selectedArenaContext || !profile) return;
    
        const torneioToUpdate = tournaments.find(t => t.id === torneioId);
        if (!torneioToUpdate) return;
    
        const updatedParticipants = torneioToUpdate.participants.map(p => {
          if (p.id === participantId) {
            const updatedPlayers = p.players.map(player => {
              if (player.profile_id === profile.id) {
                return { ...player, status };
              }
              return player;
            });
            return { ...p, players: updatedPlayers };
          }
          return p;
        });
    
        const updatedTorneio = { ...torneioToUpdate, participants: updatedParticipants };
    
        try {
          await localApi.upsert('torneios', [updatedTorneio], selectedArenaContext.id);
          addToast({ message: `Convite ${status === 'accepted' ? 'aceito' : 'recusado'}!`, type: 'success' });
          loadData();
        } catch (error: any) {
          addToast({ message: `Erro ao responder convite: ${error.message}`, type: 'error' });
        }
    };

    const handleOpenInvitePartnerModal = (torneio: Torneio, participant: Participant) => {
        setTournamentToInvite(torneio);
        setParticipantToUpdate(participant);
        setIsInvitePartnerModalOpen(true);
    };

    const handleConfirmInvite = async (partnerId: string) => {
        if (!tournamentToInvite || !participantToUpdate || !selectedArenaContext || !profile) return;
        setIsInviting(true);
        try {
            const partnerProfile = friends.find(f => f.id === partnerId);
            if (!partnerProfile) throw new Error("Amigo não encontrado.");

            const newPlayerEntry = {
                profile_id: partnerProfile.id,
                aluno_id: null,
                name: partnerProfile.name,
                phone: partnerProfile.phone || null,
                status: 'pending' as 'pending',
                payment_status: 'pendente' as 'pendente',
                checked_in: false,
            };

            const updatedParticipant = {
                ...participantToUpdate,
                players: [...participantToUpdate.players, newPlayerEntry]
            };

            const updatedParticipants = tournamentToInvite.participants.map(p => 
                p.id === updatedParticipant.id ? updatedParticipant : p
            );

            const updatedTorneio = { ...tournamentToInvite, participants: updatedParticipants };
            
            await localApi.upsert('torneios', [updatedTorneio], selectedArenaContext.id);

            await localApi.upsert('notificacoes', [{
                profile_id: partnerId,
                arena_id: selectedArenaContext.id,
                message: `${profile.name} convidou você para formar uma dupla no torneio "${tournamentToInvite.name}".`,
                type: 'tournament_invite',
                link_to: '/perfil',
                sender_id: profile.id,
                sender_name: profile.name,
                sender_avatar_url: profile.avatar_url,
            }], selectedArenaContext.id);

            addToast({ message: `Convite enviado para ${partnerProfile.name}!`, type: 'success' });
            loadData();
        } catch (error: any) {
            addToast({ message: `Erro ao convidar parceiro: ${error.message}`, type: 'error' });
        } finally {
            setIsInviting(false);
            setIsInvitePartnerModalOpen(false);
        }
    };

    const upcomingReservations = useMemo(() => {
        const now = new Date();
        return reservas
        .filter(r => {
            if (r.status === 'cancelada') return false;
            try {
            const endDateTime = new Date(`${r.date}T${r.end_time}`);
            return isAfter(endDateTime, now);
            } catch {
            return false;
            }
        })
        .sort((a, b) => {
            try {
            const aDateTime = new Date(`${a.date}T${a.start_time}`);
            const bDateTime = new Date(`${b.date}T${b.start_time}`);
            return aDateTime.getTime() - bDateTime.getTime();
            } catch {
            return 0;
            }
        });
    }, [reservas]);
    
    const pendingPaymentReservations = useMemo(() => {
        return reservas.filter(r => r.status === 'aguardando_pagamento' && r.payment_deadline && isAfter(new Date(r.payment_deadline), new Date()));
    }, [reservas]);

    const pastReservations = useMemo(() => {
        const now = new Date();
        return reservas
        .filter(r => {
            try {
            const endDateTime = new Date(`${r.date}T${r.end_time}`);
            return isBefore(endDateTime, now) || r.status === 'cancelada';
            } catch {
            return false;
            }
        })
        .sort((a, b) => {
            try {
            const aDateTime = new Date(`${a.date}T${a.start_time}`);
            const bDateTime = new Date(`${b.date}T${b.start_time}`);
            return bDateTime.getTime() - aDateTime.getTime();
            } catch {
            return 0;
            }
        });
    }, [reservas]);

    const studentTurmas = useMemo(() => {
        if (!isStudent || !alunoProfileForSelectedArena) return [];
        return turmas;
    }, [isStudent, alunoProfileForSelectedArena, turmas]);
    
    const nextClass = useMemo(() => {
        if (!isStudent || !alunoProfileForSelectedArena?.aulas_agendadas) return null;
        const now = new Date();
        
        const upcomingClasses = alunoProfileForSelectedArena.aulas_agendadas
        .map(aula => {
            const turma = turmas.find(t => t.id === aula.turma_id);
            if (!turma) return null;

            const datePart = parseDateStringAsLocal(aula.date);
            const [startHour, startMinute] = aula.time.split(':').map(Number);
            const classStartDateTime = new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), startHour, startMinute);
            const classEndDateTime = addMinutes(classStartDateTime, 60);

            if (!isAfter(classEndDateTime, now)) return null;
            
            return {
            turma,
            date: datePart,
            dateTime: classStartDateTime,
            time: aula.time,
            quadra: quadras.find(q => q.id === turma.quadra_id),
            professor: professores.find(p => p.id === turma.professor_id),
            };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
        
        if (upcomingClasses.length === 0) return null;
        upcomingClasses.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        return upcomingClasses[0];
    }, [isStudent, alunoProfileForSelectedArena, turmas, quadras, professores]);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const tab = query.get('tab');
        if (tab && ['inicio', 'aulas', 'reservas', 'loja', 'amigos', 'perfil'].includes(tab)) {
        setActiveView(tab as View);
        }
    }, [location.search]);

    if (!profile) return null;

    const navItems = [
        { id: 'inicio', label: 'Início', icon: LayoutDashboard, visible: true },
        { id: 'reservas', label: 'Reservas', icon: Calendar, visible: true },
        { id: 'aulas', label: 'Aulas', icon: GraduationCap, visible: isStudent },
        { id: 'atleta_painel', label: 'Atleta', icon: Handshake, visible: !!currentAtletaId },
        { id: 'professor_painel', label: 'Professor', icon: Briefcase, visible: !!currentProfessorId },
        { id: 'loja', label: 'Loja', icon: ShoppingBag, visible: true },
        { id: 'amigos', label: 'Amigos', icon: Users, visible: true },
        { id: 'perfil', label: 'Meu Perfil', icon: User, visible: true },
    ];

    const handleNavClick = (view: View) => {
        if (view === 'atleta_painel') {
            setActiveView('atleta_painel');
        } else if (view === 'professor_painel') {
            setActiveView('professor_painel');
        } else {
            setActiveView(view);
        }
    };

    if (myArenas.length === 0 && !isLoading) {
        return (
        <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Compass className="h-16 w-16 text-brand-blue-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Bem-vindo, {profile.name}!</h1>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-4 max-w-md mx-auto">Parece que você ainda não segue nenhuma arena. Explore e encontre seu próximo local de jogo!</p>
            <Button size="lg" className="mt-8" onClick={() => navigate('/arenas')}>
                <Search className="h-5 w-5 mr-2" />Encontrar Arenas
            </Button>
            </motion.div>
        </div>
        );
    }

    const completedGamesByAtleta = useMemo(() => {
        const counts = new Map<string, number>();
        allArenaReservations.forEach(r => {
          if (
            r.atleta_aluguel_id &&
            r.atleta_aceite_status === 'aceito' &&
            isPast(parseDateStringAsLocal(`${r.date}T${r.end_time}`))
          ) {
            counts.set(r.atleta_aluguel_id, (counts.get(r.atleta_aluguel_id) || 0) + 1);
          }
        });
        return counts;
    }, [allArenaReservations]);

    const handleOpenAtletaProfile = (atleta: AtletaAluguel) => {
        const completedGames = completedGamesByAtleta.get(atleta.id) || 0;
        setViewingAtletaProfile({ atleta, completedGames });
    };

    const handleHireFromProfile = (atleta: AtletaAluguel) => {
        setViewingAtletaProfile(null);
        setAtletaToAssign(atleta);
        setIsAssignModalOpen(true);
    };

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
        switch (activeView) {
        case 'inicio': return <InicioView alunoProfile={alunoProfileForSelectedArena} planos={planos} levels={levels} rewards={rewards} onOpenProfileModal={handleOpenProfileModal} nextReservation={upcomingReservations[0]} pendingReservations={pendingPaymentReservations} onDetail={handleOpenDetailModal} onDataChange={handleDataChange} nextClass={nextClass} quadras={quadras} reservas={allArenaReservations} onSlotClick={handleSlotClick} selectedDate={selectedDate} setSelectedDate={setSelectedDate} profile={profile} arenaName={selectedArenaContext?.name} selectedArena={selectedArenaContext} onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)} creditHistory={creditHistory} tournaments={tournaments} onUpdateTournamentInvite={handleUpdateTournamentInvite} onInvitePartner={handleOpenInvitePartnerModal} />;
        case 'reservas': return <ReservationsTab upcoming={upcomingReservations} past={pastReservations} quadras={quadras} atletas={atletas} arenaName={selectedArenaContext?.name} onCancel={handleOpenCancelModal} onDetail={handleOpenDetailModal} onHirePlayer={(res) => { setReservationToHireFor(res); setIsHirePlayerModalOpen(true); }} profileId={profile.id} onAvaliarAtleta={handleAvaliarAtleta} arenaSettings={selectedArenaContext} />;
        case 'aulas': return <AulasTab aluno={alunoProfileForSelectedArena!} allAlunos={allArenaAlunos} turmas={studentTurmas} professores={professores} quadras={quadras} planos={planos} onDataChange={handleDataChange} onAvaliarProfessor={handleAvaliarProfessor} />;
        case 'loja': return <LojaView />;
        case 'amigos': return <FriendsView />;
        case 'perfil': return <ClientProfileView aluno={alunoProfileForSelectedArena} profile={profile} onProfileUpdate={handleProfileUpdate} creditHistory={creditHistory} gamificationHistory={gamificationHistory} levels={levels} rewards={rewards} achievements={achievements} unlockedAchievements={unlockedAchievements} gamificationEnabled={gamificationEnabled} atletas={atletas} onViewProfile={handleOpenAtletaProfile} completedReservationsCount={completedReservationsCount} />;
        case 'atleta_painel': return <AtletaProfilePage />;
        case 'professor_painel': return <ProfessorProfilePage />;
        default: return null;
        }
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            <SideNavBar items={navItems} activeView={activeView} setActiveView={handleNavClick} />
            <div className="flex-1 overflow-y-auto pt-8 md:pt-0">
                <main className="p-4 sm:p-6 lg:p-8 pb-24">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 dark:text-white">Meu Painel</h1>
                        <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-1 md:mt-2">Gerencie suas reservas, aulas e perfil.</p>
                        </div>
                        <div className="w-full md:w-auto">
                        <ArenaSelector arenas={myArenas} selectedArena={selectedArenaContext} onSelect={switchArenaContext} />
                        </div>
                    </motion.div>
                    {!selectedArenaContext ? (
                        <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                            <Compass className="h-12 w-12 text-brand-blue-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-200">Selecione uma arena</h2>
                            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Escolha uma das suas arenas para ver seus dados.</p>
                        </motion.div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                        <motion.div key={activeView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {renderContent()}
                        </motion.div>
                        </AnimatePresence>
                    )}
                </main>
            </div>
            <BottomNavBar items={navItems} activeView={activeView} setActiveView={handleNavClick} />
            
            <AnimatePresence>{isModalOpen && modalSlot && selectedArenaContext && (<ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveClientReservation} onCancelReservation={() => {}} newReservationSlot={{ quadraId: modalSlot.quadraId, time: modalSlot.time, type: 'avulsa' }} quadras={quadras} alunos={alunoProfileForSelectedArena ? [alunoProfileForSelectedArena] : []} allReservations={allArenaReservations} arenaId={selectedArenaContext.id} selectedDate={selectedDate} isClientBooking={true} userProfile={profile} clientProfile={alunoProfileForSelectedArena} profissionais={atletas} friends={friends} />)}</AnimatePresence>
            <AnimatePresence>{isCancelModalOpen && reservationToCancel && selectedArenaContext && (<ClientCancellationModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancellation} reserva={reservationToCancel} policyText={selectedArenaContext.cancellation_policy} creditExpirationDays={selectedArenaContext.credit_expiration_days} />)}</AnimatePresence>
            <AnimatePresence>{isDetailModalOpen && reservationToDetail && selectedArenaContext && (<ReservationDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} reserva={reservationToDetail} quadra={quadras.find(q => q.id === reservationToDetail.quadra_id) || null} atleta={atletas.find(a => a.id === reservationToDetail.atleta_aluguel_id) || null} arenaName={selectedArenaContext.name} onCancel={handleOpenCancelModal} onUpdateParticipantStatus={handleUpdateParticipantStatus} onUpdateReservation={handleUpdateReservation} friends={friends} onPay={handleOpenPaymentModal} onAvaliarAtleta={handleAvaliarAtleta} onContactAtleta={handleContactAtleta} onTrocarAtleta={handleTrocarAtleta} onCancelarAtleta={handleCancelarAtleta} onPayAtleta={handlePayAtleta} onAthletePaymentExpire={handleAthletePaymentExpire} />)}</AnimatePresence>
            <AnimatePresence>{isHirePlayerModalOpen && reservationToHireFor && (<HirePlayerModal isOpen={isHirePlayerModalOpen} onClose={() => setIsHirePlayerModalOpen(false)} onConfirm={(profId) => handleHireProfessional(reservationToHireFor.id, profId)} reserva={reservationToHireFor} profissionais={atletas} onViewProfile={handleOpenAtletaProfile} />)}</AnimatePresence>
            <AnimatePresence>{isAssignModalOpen && atletaToAssign && (<AssignToReservationModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onConfirm={(reservaId) => handleHireProfessional(reservaId, atletaToAssign.id)} profissional={atletaToAssign} minhasReservas={upcomingReservations} quadras={quadras} />)}</AnimatePresence>
            <AnimatePresence>{isPaymentModalOpen && (<PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleConfirmPayment} reservation={paymentInfo?.reservation || null} amountToPay={paymentInfo?.amount || 0} isProcessing={isPaymentProcessing} />)}</AnimatePresence>
            <AnimatePresence>{isProfileModalOpen && (<ProfileDetailModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} initialTab={profileModalInitialTab} aluno={alunoProfileForSelectedArena} creditHistory={creditHistory} gamificationHistory={gamificationHistory} paymentHistory={paymentHistory} levels={levels} rewards={rewards} achievements={achievements} unlockedAchievements={unlockedAchievements} gamificationEnabled={gamificationEnabled} />)}</AnimatePresence>
            <AnimatePresence>{isAttendanceModalOpen && alunoProfileForSelectedArena && (<AttendanceReportModal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} aluno={alunoProfileForSelectedArena} turmas={turmas} />)}</AnimatePresence>
            <AnimatePresence>{isAvaliarAtletaModalOpen && reservaToEvaluate && (<AvaliarAtletaModal isOpen={isAvaliarAtletaModalOpen} onClose={() => setIsAvaliarAtletaModalOpen(false)} onConfirm={handleConfirmAvaliacao} atletaName={atletas.find(a => a.id === reservaToEvaluate.atleta_aluguel_id)?.name || 'Atleta'} />)}</AnimatePresence>
            <AnimatePresence>{isAvaliarProfessorModalOpen && classToEvaluate && (<AvaliarProfessorModal isOpen={isAvaliarProfessorModalOpen} onClose={() => setIsAvaliarProfessorModalOpen(false)} onConfirm={handleConfirmAvaliacaoProfessor} professorName={classToEvaluate?.professor?.name || 'Professor'} />)}</AnimatePresence>
            <AnimatePresence>{isMessageModalOpen && atletaToContact && (<SendMessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} onConfirm={handleSendMessage} friend={atletaToContact} />)}</AnimatePresence>
            <AnimatePresence>{isCancelAtletaConfirmOpen && (<ConfirmationModal isOpen={isCancelAtletaConfirmOpen} onClose={() => setIsCancelAtletaConfirmOpen(false)} onConfirm={handleConfirmCancelAtleta} title="Cancelar Contratação?" message="Tem certeza que deseja cancelar a contratação deste atleta? Ele será notificado." confirmText="Sim, Cancelar" />)}</AnimatePresence>
            <AnimatePresence>{isPayAtletaModalOpen && atletaToPay && reservaForAtletaPayment && (<PayAtletaModal isOpen={isPayAtletaModalOpen} onClose={() => setIsPayAtletaModalOpen(false)} onConfirm={handleConfirmPayAtleta} atleta={atletaToPay} isProcessing={isPaymentProcessing} />)}</AnimatePresence>
            <AtletaPublicProfileModal isOpen={!!viewingAtletaProfile} onClose={() => setViewingAtletaProfile(null)} atleta={viewingAtletaProfile?.atleta || null} completedGames={viewingAtletaProfile?.completedGames} onHire={handleHireFromProfile} />
            <InvitePartnerModal isOpen={isInvitePartnerModalOpen} onClose={() => setIsInvitePartnerModalOpen(false)} onConfirm={handleConfirmInvite} friends={friends} isLoading={isInviting} />
        </div>
    );
};

export default ClientDashboard;
