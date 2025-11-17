import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, User, X, Heart, Repeat, Check, Loader2, ShoppingBag } from 'lucide-react';
import { format, addDays, startOfDay, addMinutes, isSameDay, isPast, parse, getDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Arena, Quadra, Reserva, Aluno, Profile } from '../types';
import { getReservationTypeDetails, expandRecurringReservations, timeToMinutes } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import ReservationModal from '../Reservations/ReservationModal';
import { supabaseApi } from '../../lib/supabaseApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

const ArenaPublic: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile, memberships, followArena, switchArenaContext, allArenas, alunoProfileForSelectedArena, refreshAlunoProfile } = useAuth();
  const { addToast } = useToast();
  
  const [arena, setArena] = useState<Arena | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [favoriteQuadras, setFavoriteQuadras] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<{ quadraId: string; time: string } | null>(null);

  const isMember = useMemo(() => {
    return arena ? memberships.some(m => m.arena_id === arena.id) : false;
  }, [memberships, arena]);

  const loadArenaData = useCallback(async (currentArena: Arena) => {
    setIsLoading(true);
    try {
      const { data: quadrasData } = await supabaseApi.select<Quadra>('quadras', currentArena.id);
      setQuadras(quadrasData || []);
      const { data: reservasData } = await supabaseApi.select<Reserva>('reservas', currentArena.id);
      setReservas(reservasData || []);
      const { data: alunosData } = await supabaseApi.select<Aluno>('alunos', currentArena.id);
      setAlunos(alunosData || []);
    } catch (error: any) {
      addToast({ message: 'Não foi possível carregar os dados da arena.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const currentArena = allArenas.find(a => a.slug === slug);
    if (currentArena) {
      setArena(currentArena);
      loadArenaData(currentArena);
    } else if (allArenas.length > 0) {
      setIsLoading(false);
    }
    
    if (profile?.id) {
      const savedFavorites = localStorage.getItem(`favorite_quadras_${profile.id}`);
      if (savedFavorites) setFavoriteQuadras(JSON.parse(savedFavorites));
    }
  }, [slug, profile?.id, allArenas, loadArenaData]);

  const displayedReservations = useMemo(() => {
    const viewStartDate = startOfDay(new Date());
    const viewEndDate = endOfDay(addDays(new Date(), 7));
    return expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);
  }, [reservas, quadras]);

  const handleFollowAndBook = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (arena) {
      if (!isMember) {
        await followArena(arena.id);
      }
      switchArenaContext(arena);
      addToast({ message: `Agora você está seguindo ${arena.name}! Escolha um horário para reservar.`, type: 'info' });
    }
  };

  const handleSlotClick = async (time: string, quadraId: string) => {
    if (profile?.role === 'admin_arena') {
      addToast({ message: 'Administradores devem gerenciar reservas pelo Hub de Reservas.', type: 'info' });
      return;
    }
    if (!user) {
      navigate('/auth');
      return;
    }
    if (arena && !isMember) {
      await followArena(arena.id);
    }
    if (arena) {
      switchArenaContext(arena);
    }
    setModalSlot({ quadraId, time });
    setIsModalOpen(true);
  };
  
  const handleSaveClientReservation = async (reservationData: Omit<Reserva, 'id' | 'created_at' | 'arena_id'> | Reserva) => {
    if (!arena || !profile) {
      addToast({ message: 'Erro: Contexto do usuário ou da arena não encontrado.', type: 'error' });
      return;
    }
    try {
        await supabaseApi.upsert('reservas', [{...reservationData, arena_id: arena.id}], arena.id);
        addToast({ message: 'Reserva criada com sucesso!', type: 'success' });
    } catch (error: any) {
        addToast({ message: `Erro no processo de reserva: ${error.message}`, type: 'error' });
    } finally {
        setIsModalOpen(false);
        setModalSlot(null);
        refreshAlunoProfile();
        if (arena) {
          await loadArenaData(arena);
        }
    }
  };

  const toggleFavorite = (quadraId: string) => {
    if (!profile) return;
    const newFavorites = favoriteQuadras.includes(quadraId) ? favoriteQuadras.filter(id => id !== quadraId) : [...favoriteQuadras, quadraId];
    setFavoriteQuadras(newFavorites);
    localStorage.setItem(`favorite_quadras_${profile.id}`, JSON.stringify(newFavorites));
  };

  const generateTimeSlots = (quadra: Quadra) => {
    const slots = [];
    const dayOfWeek = getDay(selectedDate);
    let horario = dayOfWeek === 0 ? quadra.horarios?.sunday : dayOfWeek === 6 ? quadra.horarios?.saturday : quadra.horarios?.weekday;
    if (!horario || !horario.start || !horario.end) return [];
    let currentTime = parse(horario.start.trim(), 'HH:mm', selectedDate);
    let endTime = parse(horario.end.trim(), 'HH:mm', selectedDate);
    if (endTime <= currentTime) endTime = addDays(endTime, 1);
    const interval = quadra.booking_duration_minutes || 60;
    while (currentTime < endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, interval);
    }
    return slots;
  };

  const getSlotStatus = (time: string, quadraId: string) => {
    const slotDateTime = parse(time, 'HH:mm', selectedDate);
    if (isPast(slotDateTime) && !isSameDay(selectedDate, startOfDay(new Date()))) return { status: 'past', data: null };
    if (isPast(slotDateTime) && isSameDay(selectedDate, startOfDay(new Date()))) return { status: 'past', data: null };
    const reserva = displayedReservations.find(r => r.quadra_id === quadraId && isSameDay(parseDateStringAsLocal(r.date), selectedDate) && r.start_time.slice(0, 5) === time && r.status !== 'cancelada');
    if (reserva) return { status: 'booked', data: reserva };
    return { status: 'available', data: null };
  };

  const getPriceRange = (quadra: Quadra) => {
    if (!quadra.pricing_rules || quadra.pricing_rules.length === 0) return "A definir";
    const activePrices = quadra.pricing_rules.filter(r => r.is_active).map(r => r.price_single);
    if (activePrices.length === 0) return "A definir";
    const minPrice = Math.min(...activePrices);
    const maxPrice = Math.max(...activePrices);
    if (minPrice === maxPrice) return formatCurrency(minPrice);
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  };

  if (isLoading) return <Layout><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500"/></div></Layout>;
  if (!arena) return <Layout><div className="text-center p-8">Arena não encontrada</div></Layout>;

  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const renderSlotButton = (quadra: Quadra, time: string) => {
    const { status, data } = getSlotStatus(time, quadra.id);
    let styles = '', icon;
    if (status === 'available') { styles = 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20'; icon = <Clock className="h-3 w-3 mr-1" />; }
    else if (status === 'past') { styles = 'bg-brand-gray-100 text-brand-gray-400 dark:bg-brand-gray-700/50 dark:text-brand-gray-500 cursor-not-allowed'; icon = <Clock className="h-3 w-3 mr-1" />; }
    else if (status === 'booked' && data) { const typeDetails = getReservationTypeDetails(data.type); styles = `${typeDetails.publicBgColor} ${typeDetails.publicTextColor} cursor-not-allowed`; icon = <typeDetails.icon className="h-3 w-3 mr-1" />; }
    return (<motion.button key={time} whileHover={{ scale: status === 'available' ? 1.05 : 1 }} whileTap={{ scale: status === 'available' ? 0.95 : 1 }} onClick={() => handleSlotClick(time, quadra.id)} disabled={status !== 'available'} className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${styles}`}><div className="flex items-center justify-center">{icon}{data?.isRecurring && <Repeat className="h-3 w-3 mr-1" />}{time}</div></motion.button>);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{arena.name}</h1><div className="flex items-center mt-2 text-brand-gray-600 dark:text-brand-gray-400"><MapPin className="h-4 w-4 mr-1" /><span>{arena.city}, {arena.state}</span></div></motion.div>
        {user && profile?.role === 'cliente' && (<div className="mb-8"><Button onClick={handleFollowAndBook} size="lg" className="w-full md:w-auto">{isMember ? <><Check className="h-5 w-5 mr-2" /> Você segue esta arena</> : 'Seguir Arena e Reservar'}</Button></div>)}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 p-4 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md"><h2 className="text-xl font-semibold text-brand-gray-900 dark:text-white mb-4">Escolha a data</h2><div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">{nextDays.map((date, index) => (<button key={index} onClick={() => setSelectedDate(startOfDay(date))} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all min-w-[80px] ${isSameDay(date, selectedDate) ? 'border-brand-blue-500 bg-blue-50 dark:bg-brand-blue-500/10 text-brand-blue-700 dark:text-brand-blue-300' : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400 dark:hover:border-brand-blue-500'}`}><span className="text-xs font-medium uppercase">{format(date, 'EEE', { locale: ptBR })}</span><span className="text-lg font-bold">{format(date, 'dd')}</span><span className="text-xs">{format(date, 'MMM', { locale: ptBR })}</span></button>))}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">{quadras.map((quadra) => (<div key={quadra.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg overflow-hidden"><div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4 text-white flex justify-between items-center"><div><h3 className="text-xl font-semibold">{quadra.name}</h3><div className="flex items-center justify-between mt-2 text-sm"><span className="text-blue-100">{quadra.sports.join(', ')}</span><div className="flex items-center ml-4"><DollarSign className="h-4 w-4 mr-1" /><span className="font-semibold">{getPriceRange(quadra)}</span></div></div></div>{profile?.role === 'cliente' && (<button onClick={() => toggleFavorite(quadra.id)} className="p-2 rounded-full hover:bg-white/20 transition-colors"><Heart className={`h-6 w-6 text-white transition-all ${favoriteQuadras.includes(quadra.id) ? 'fill-current text-red-400' : ''}`} /></button>)}</div><div className="p-6"><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">{generateTimeSlots(quadra).map(time => renderSlotButton(quadra, time))}</div></div></div>))}</motion.div>
      </div>
      <AnimatePresence>{isModalOpen && modalSlot && arena && (<ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveClientReservation} onCancelReservation={() => {}} newReservationSlot={{ quadraId: modalSlot.quadraId, time: modalSlot.time, type: 'avulsa' }} quadras={quadras} alunos={alunoProfileForSelectedArena ? [alunoProfileForSelectedArena] : []} allReservations={reservas} arenaId={arena.id} selectedDate={selectedDate} isClientBooking={true} userProfile={profile} clientProfile={alunoProfileForSelectedArena} />)}</AnimatePresence>
    </Layout>
  );
};

export default ArenaPublic;
