{`{/*
  ====================================================================
  || ATENÇÃO: CÓDIGO PROTEGIDO (BLINDADO) POR SOLICITAÇÃO DO USUÁRIO ||
  ====================================================================
  || Este arquivo contém a lógica crítica para o cálculo de preços, ||
  || aplicação de descontos e utilização de créditos.              ||
  ||                                                                ||
  || -> NÃO FAÇA ALTERAÇÕES NESTA LÓGICA SEM CONFIRMAÇÃO EXPLÍCITA.    ||
  || -> A lógica de esporte foi ajustada para permitir edição.      ||
  ====================================================================
*/}`}
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Clock, User, Phone, Repeat, Tag, DollarSign, Info, AlertTriangle, CreditCard, ShoppingBag, Handshake, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Aluno, Quadra, Reserva, PricingRule, DurationDiscount, ReservationType, RentalItem, Profile, AtletaAluguel, Friendship, RecurringType, Arena } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { useToast } from '../../context/ToastContext';
import { format, parse, getDay, addDays, addMinutes, isBefore, startOfDay, endOfDay, eachDayOfInterval, endOfMonth, addMonths, startOfMonth, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreatableClientSelect from '../Forms/CreatableClientSelect';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { maskPhone } from '../../utils/masks';
import { hasTimeConflict, expandRecurringReservations } from '../../utils/reservationUtils';
import { supabaseApi } from '../../lib/supabaseApi';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import CreatableSelect from '../Forms/CreatableSelect';
import ArenaPaymentModal from '../Shared/ArenaPaymentModal';
import { checkAsaasConfig, checkAsaasConfigForArena } from '../../utils/arenaPaymentHelper';

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return -1;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return -1;
    return hours * 60 + minutes;
  } catch (e) {
    return -1;
  }
};

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: (Omit<Reserva, 'id' | 'created_at' | 'arena_id'> | Reserva) & { originalCreditUsed?: number; newSportCreated?: string }) => void;
  onCancelReservation: (reservation: Reserva) => void;
  reservation?: Reserva | null;
  newReservationSlot?: { quadraId: string, time: string, type?: ReservationType } | null;
  quadras: Quadra[];
  alunos: Aluno[];
  allReservations: Reserva[];
  arenaId: string;
  allArenas: Arena[];
  selectedDate: Date;
  isClientBooking?: boolean;
  userProfile?: Profile | null;
  clientProfile?: Aluno | null;
  profissionais?: AtletaAluguel[];
  friends?: Profile[];
  isReadOnly?: boolean;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSave, onCancelReservation, reservation, newReservationSlot, quadras, alunos, allReservations, arenaId, allArenas, selectedDate, isClientBooking = false, userProfile, clientProfile, profissionais = [], friends = [], isReadOnly = false }) => {
  const { addToast } = useToast();
  const [durationDiscounts, setDurationDiscounts] = useState<DurationDiscount[]>([]);
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'Avulso' | 'Mensalista' | null>(null);

  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState<{ percentage: number; duration: number } | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<{ description: string; subtotal: number }[]>([]);
  const [activeRule, setActiveRule] = useState<PricingRule | null>(null);
  const [useCredit, setUseCredit] = useState(false);
  const [originalCreditUsed, setOriginalCreditUsed] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [operatingHoursWarning, setOperatingHoursWarning] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  
  const [showHirePlayer, setShowHirePlayer] = useState(false);
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string | null>(null);

  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);
  const [isManuallyPaid, setIsManuallyPaid] = useState(false);
  
  const [firstPayment, setFirstPayment] = useState<number | null>(null);
  const [recurringPayment, setRecurringPayment] = useState<number | null>(null);
  const [proRataOccurrences, setProRataOccurrences] = useState<number | null>(null);
  const [isRecurringIndefinite, setIsRecurringIndefinite] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savedReservation, setSavedReservation] = useState<Reserva | null>(null);
  const [asaasConfigured, setAsaasConfigured] = useState(false);
  
  const [formData, setFormData] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    quadra_id: '',
    clientName: '',
    clientPhone: '',
    status: 'confirmada' as Reserva['status'],
    type: 'avulsa' as ReservationType,
    sport_type: '',
    total_price: 0,
    credit_used: 0,
    isRecurring: false,
    recurringType: 'none' as RecurringType,
    recurringEndDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    rented_items: [] as { itemId: string; name: string; quantity: number; price: number }[],
    payment_status: 'pendente' as Reserva['payment_status'],
    notes: '',
    created_by_name: '',
    created_at: '',
    atleta_aluguel_id: null as string | null,
    participants: [] as { profile_id: string; name: string; avatar_url: string | null; status: 'pending' | 'accepted' | 'declined', payment_status: 'pendente' | 'pago' }[],
  });

  const isEditing = !!reservation;
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
      checkAsaasConfig().then(setAsaasConfigured).catch(() => setAsaasConfigured(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      const loadAndSetData = async () => {
        setIsLoading(true);
        let reservationToUse: Reserva | null = null;
        
        if (reservation?.id && arenaId) {
          try {
            const { data: allReservas } = await supabaseApi.select<Reserva>('reservas', arenaId);
            reservationToUse = allReservas.find(r => r.id === reservation.id) || reservation;
          } catch {
            reservationToUse = reservation;
          }
        } else {
          reservationToUse = reservation;
        }
    
        let baseData: any = {
          date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: '09:00',
          end_time: '10:00',
          quadra_id: quadras.length > 0 ? quadras[0].id : '',
          clientName: '',
          clientPhone: '',
          status: 'confirmada' as Reserva['status'],
          type: 'avulsa' as ReservationType,
          sport_type: '',
          total_price: 0,
          credit_used: 0,
          isRecurring: false,
          recurringType: 'none' as RecurringType,
          recurringEndDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          rented_items: [] as { itemId: string; name: string; quantity: number; price: number }[],
          payment_status: 'pendente' as Reserva['payment_status'],
          notes: '',
          atleta_aluguel_id: null as string | null,
          participants: [] as { profile_id: string; name: string; avatar_url: string | null; status: 'pending' | 'accepted' | 'declined', payment_status: 'pendente' | 'pago' }[],
        };
    
        if (reservationToUse) {
          const creditAlreadyUsed = reservationToUse.credit_used || 0;
          baseData = {
            ...baseData,
            ...reservationToUse,
            start_time: reservationToUse.start_time.slice(0, 5),
            end_time: reservationToUse.end_time.slice(0, 5),
            credit_used: creditAlreadyUsed,
            recurringType: reservationToUse.recurringType || 'none',
          };
          setOriginalCreditUsed(creditAlreadyUsed);
          setIsManuallyPaid(reservationToUse.payment_status === 'pago');
          setIsRecurringIndefinite(!reservationToUse.recurringEndDate);
          const initialSelectedItems: Record<string, number> = {};
          if (reservationToUse.rented_items) {
            for (const item of reservationToUse.rented_items) {
              initialSelectedItems[item.itemId] = item.quantity;
            }
          }
          setSelectedItems(initialSelectedItems);
          const initialInvitedIds = reservationToUse.participants?.filter(p => p.profile_id !== userProfile?.id).map(p => p.profile_id) || [];
          setInvitedFriendIds(initialInvitedIds);
          setIsGroupBooking(!!reservationToUse.participants && reservationToUse.participants.length > 1);
        } else if (newReservationSlot) {
          const startTime = newReservationSlot.time || '09:00';
          const quadraId = newReservationSlot.quadraId || (quadras.length > 0 ? quadras[0].id : '');
          const selectedQuadra = quadras.find(q => q.id === quadraId);
          const duration = selectedQuadra?.booking_duration_minutes || 60;
          const startTimeDate = parse(startTime, 'HH:mm', new Date());
          const endTimeDate = addMinutes(startTimeDate, duration);
          const endTime = format(endTimeDate, 'HH:mm');
          
          baseData = {
            ...baseData,
            quadra_id: quadraId,
            start_time: startTime,
            end_time: endTime,
            type: newReservationSlot.type || 'avulsa',
            sport_type: selectedQuadra?.sports?.[0] || '',
          };
          
          if (newReservationSlot.type === 'bloqueio') {
            baseData.clientName = 'Horário Bloqueado';
          }
    
          if (isClientBooking && userProfile) {
              baseData.clientName = userProfile.name;
              baseData.clientPhone = userProfile.phone || '';
          }
          setOriginalCreditUsed(0);
          setIsManuallyPaid(false);
          setSelectedItems({});
          setInvitedFriendIds([]);
          setIsGroupBooking(false);
          setIsRecurringIndefinite(false);
        }
        
        setFormData(baseData);
        isInitialized.current = true;
        setIsLoading(false);
      };
      loadAndSetData();
    } else if (!isOpen) {
      isInitialized.current = false;
    }
  }, [isOpen, reservation, newReservationSlot, quadras, selectedDate, isClientBooking, userProfile, arenaId]);

  const selectedClient = useMemo(() => {
    if (isClientBooking) return clientProfile;
    return alunos.find(a => a.name === formData.clientName);
  }, [formData.clientName, alunos, isClientBooking, clientProfile]);

  const availableCredit = useMemo(() => {
    return selectedClient?.credit_balance || 0;
  }, [selectedClient]);

  const selectedClientId = useMemo(() => {
    return selectedClient ? selectedClient.id : null;
  }, [selectedClient]);

  const allSportsOptions = useMemo(() => {
    const arena = allArenas ? allArenas.find(a => a.id === arenaId) : undefined;
    const defaultSports = [
        'Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Futebol Society', 
        'Tênis', 'Padel', 'Funcional', 'Basquete', 'Handebol', 'Pickleball', 'Futsal'
    ];
    const arenaSports = arena?.available_sports || [];
    const quadraSports = quadras ? quadras.flatMap(q => q.sports || []).filter(Boolean) : [];
    return [...new Set([...defaultSports, ...arenaSports, ...quadraSports])].sort((a, b) => a.localeCompare(b));
  }, [allArenas, quadras, arenaId]);

  const availableProfessionals = useMemo(() => {
    if (!profissionais || !formData.date || !formData.start_time) return [];

    try {
        const reservaDate = parseDateStringAsLocal(formData.date);
        const reservaDayOfWeek = getDay(reservaDate);
        const reservaStartTime = parse(formData.start_time, 'HH:mm', new Date());

        return profissionais.filter(p => {
            const isCompatibleSport = p.esportes.some(e => e.sport === formData.sport_type);
            if (!isCompatibleSport) return false;

            if (!p.weekly_availability || p.weekly_availability.length === 0) {
                return true; // Assume available if not configured
            }

            const dayAvailability = p.weekly_availability.find(d => d.dayOfWeek === reservaDayOfWeek);
            if (!dayAvailability || dayAvailability.slots.length === 0) {
                return false;
            }

            return dayAvailability.slots.some(slot => {
                const slotStart = parse(slot.start, 'HH:mm', new Date());
                const slotEnd = parse(slot.end, 'HH:mm', new Date());
                return reservaStartTime >= slotStart && reservaStartTime < slotEnd;
            });
        });
    } catch (e) {
        console.error("Error filtering professionals in ReservationModal", e);
        return profissionais; // Return all on error to avoid breaking the UI
    }
  }, [profissionais, formData.date, formData.start_time, formData.sport_type]);

  const availableStock = useMemo(() => {
    const stock: Record<string, number> = {};
    rentalItems.forEach(item => { stock[item.id] = item.stock; });

    if (!formData.date || !formData.start_time || !formData.end_time) {
      return stock;
    }

    try {
      const reservationBaseDate = parseDateStringAsLocal(formData.date);
      
      const reservationsOnDate = expandRecurringReservations(
          allReservations, 
          startOfDay(reservationBaseDate), 
          endOfDay(reservationBaseDate), 
          quadras
      );

      const currentReservationStart = parse(formData.start_time, 'HH:mm', reservationBaseDate);
      let currentReservationEnd = parse(formData.end_time, 'HH:mm', reservationBaseDate);

      if (formData.end_time === '00:00') {
        currentReservationEnd = addDays(startOfDay(currentReservationStart), 1);
      } else if (currentReservationEnd <= currentReservationStart) {
        currentReservationEnd = addDays(currentReservationEnd, 1);
      }
      
      if (isNaN(currentReservationStart.getTime()) || isNaN(currentReservationEnd.getTime())) {
          return stock;
      }

      rentalItems.forEach(item => {
        const bookedQuantity = reservationsOnDate
          .filter(r => {
            if (isEditing && (r.id === reservation?.id || (reservation?.id && r.master_id === reservation.id))) return false;
            if (r.status !== 'confirmada') return false;

            const existingStart = parse(r.start_time, 'HH:mm', reservationBaseDate);
            let existingEnd = parse(r.end_time, 'HH:mm', reservationBaseDate);

            if (r.end_time === '00:00') {
                existingEnd = addDays(startOfDay(existingStart), 1);
            } else if (existingEnd <= existingStart) {
                existingEnd = addDays(existingEnd, 1);
            }
            
            if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) return false;

            const overlaps = currentReservationStart < existingEnd && currentReservationEnd > existingStart;
            return overlaps;
          })
          .flatMap(r => r.rented_items || [])
          .filter(rented => rented.itemId === item.id)
          .reduce((sum, rented) => sum + rented.quantity, 0);
        
        stock[item.id] = item.stock - bookedQuantity;
      });

      return stock;
    } catch(e) {
      console.error("Error calculating available stock:", e);
      return stock;
    }
  }, [rentalItems, allReservations, quadras, reservation, isEditing, formData.date, formData.start_time, formData.end_time]);


  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !arenaId) return;
      setIsLoading(true);
      try {
        const [discountsRes, itemsRes] = await Promise.all([
          supabaseApi.select<DurationDiscount>('duration_discounts', arenaId),
          supabaseApi.select<RentalItem>('rental_items', arenaId),
        ]);
        
        setDurationDiscounts(discountsRes.data || []);
        setRentalItems(itemsRes.data || []);

      } catch (error: any) {
        addToast({ message: 'Erro ao carregar dados da reserva.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, arenaId, addToast]);

  const findMatchingRule = useCallback((
    rules: PricingRule[], sport: string, date: string, startTime: string
  ): { rule: PricingRule | null } => {
    const reservationDay = getDay(parseDateStringAsLocal(date));
    const reservationStartTimeMinutes = timeToMinutes(startTime);

    const applicableRules = rules.filter(rule => {
      const ruleStartMinutes = timeToMinutes(rule.start_time);
      let ruleEndMinutes = timeToMinutes(rule.end_time);

      if (ruleEndMinutes === 0 && rule.end_time === '00:00') {
        ruleEndMinutes = 24 * 60;
      }

      let match = false;
      if (ruleStartMinutes < ruleEndMinutes) {
        match = reservationStartTimeMinutes >= ruleStartMinutes && reservationStartTimeMinutes < ruleEndMinutes;
      } else { // Overnight rule
        match = reservationStartTimeMinutes >= ruleStartMinutes || reservationStartTimeMinutes < ruleEndMinutes;
      }
      
      return rule.is_active &&
        rule.days_of_week.includes(reservationDay) &&
        (rule.sport_type === sport || rule.sport_type === 'Qualquer Esporte') &&
        match;
    });

    const specificSportRule = applicableRules.find(r => r.sport_type === sport && !r.is_default);
    const anySportRule = applicableRules.find(r => r.sport_type === 'Qualquer Esporte' && !r.is_default);
    const defaultSpecificSportRule = applicableRules.find(r => r.sport_type === sport && r.is_default);
    const defaultAnySportRule = applicableRules.find(r => r.sport_type === 'Qualquer Esporte' && r.is_default);

    const targetRule = specificSportRule || anySportRule || defaultSpecificSportRule || defaultAnySportRule || null;

    return { rule: targetRule };
  }, []);

  const countOccurrences = (start: Date, end: Date, dayOfWeek: number): number => {
    let count = 0;
    let current = start;
    while (current <= end) {
      if (getDay(current) === dayOfWeek) {
        count++;
      }
      current = addDays(current, 1);
    }
    return count;
  };

  useEffect(() => {
    const calculatePrice = () => {
      setFirstPayment(null);
      setRecurringPayment(null);
      setProRataOccurrences(null);
      setActiveRule(null);
      const { quadra_id, sport_type, date, start_time, end_time, type, recurringType } = formData;
      if (!quadra_id || !date || !start_time || !end_time || type === 'bloqueio') {
        setOperatingHoursWarning(null);
        setPriceBreakdown([]);
        setDiscountAmount(0);
        setDiscountInfo(null);
        setFormData(prev => ({ ...prev, total_price: 0, credit_used: 0, rented_items: [], payment_status: 'pago' }));
        return;
      }
      
      const selectedQuadra = quadras.find(q => q.id === quadra_id);
      if (!selectedQuadra) return;

      const rulesForQuadra = selectedQuadra.pricing_rules || [];

      if (!selectedQuadra.horarios) {
        setOperatingHoursWarning('Horário de funcionamento da quadra não definido.');
        return;
      }
      const dayOfWeek = getDay(parseDateStringAsLocal(date));
      const operatingHours = dayOfWeek === 0 ? selectedQuadra.horarios.sunday : dayOfWeek === 6 ? selectedQuadra.horarios.saturday : selectedQuadra.horarios.weekday;

      if (!operatingHours || !operatingHours.start || !operatingHours.end) {
        setOperatingHoursWarning('Horário de funcionamento não definido para este dia.');
        return;
      }

      const reservationStartTimeMinutes = timeToMinutes(start_time);
      let reservationEndMinutes = timeToMinutes(end_time);
      const openingMinutes = timeToMinutes(operatingHours.start);
      let closingMinutes = timeToMinutes(operatingHours.end);

      if (closingMinutes === 0 && operatingHours.end === '00:00') {
        closingMinutes = 24 * 60;
      }
      if (reservationEndMinutes === 0 && end_time === '00:00') {
        reservationEndMinutes = 24 * 60;
      }

      const effectiveClosingMinutes = closingMinutes < openingMinutes ? closingMinutes + 24 * 60 : closingMinutes;
      const effectiveReservationEndMinutes = reservationEndMinutes <= reservationStartTimeMinutes ? reservationEndMinutes + 24 * 60 : reservationEndMinutes;

      if (reservationStartTimeMinutes < openingMinutes || effectiveReservationEndMinutes > effectiveClosingMinutes) {
        setOperatingHoursWarning(`Atenção: O horário selecionado (${start_time} - ${end_time}) está fora do funcionamento da quadra (${operatingHours.start} - ${operatingHours.end}).`);
        setPriceBreakdown([]); setDiscountAmount(0); setDiscountInfo(null);
        return;
      }
      setOperatingHoursWarning(null);
      
      const reservationBaseDate = parseDateStringAsLocal(date);
      const start = parse(start_time, 'HH:mm', reservationBaseDate);
      let end = parse(end_time, 'HH:mm', reservationBaseDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      if (end <= start) end = addDays(end, 1);

      const totalDurationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (totalDurationHours <= 0) {
        setPriceBreakdown([]); setDiscountAmount(0); setDiscountInfo(null);
        return;
      }

      const { rule: applicableRule } = findMatchingRule(rulesForQuadra, sport_type, date, start_time);
      setActiveRule(applicableRule);
      
      let pricePerHour = 0;
      if (applicableRule) {
        pricePerHour = applicableRule.price_single;
      }
      const totalCalculatedPrice = pricePerHour * totalDurationHours;

      let priceForThisTransaction = totalCalculatedPrice;

      if (recurringType !== 'none' && !isEditing) {
        const startDate = parseDateStringAsLocal(date);
        const firstCycleEndDate = endOfMonth(startDate);
        const firstCycleOccurrences = countOccurrences(startDate, firstCycleEndDate, getDay(startDate));
        setProRataOccurrences(firstCycleOccurrences);
        
        const firstPaymentAmount = firstCycleOccurrences * pricePerHour;
        setFirstPayment(firstPaymentAmount);
        priceForThisTransaction = firstPaymentAmount;

        let monthsInCycle = 1;
        if (recurringType === 'quarterly') monthsInCycle = 3;
        if (recurringType === 'semiannual') monthsInCycle = 6;
        if (recurringType === 'annual') monthsInCycle = 12;
        
        const nextCycleStartDate = startOfMonth(addMonths(startDate, 1));
        const nextCycleEndDate = endOfMonth(addMonths(nextCycleStartDate, monthsInCycle - 1));
        const fullCycleOccurrences = countOccurrences(nextCycleStartDate, nextCycleEndDate, getDay(startDate));
        const recurringPaymentAmount = fullCycleOccurrences * pricePerHour;
        setRecurringPayment(recurringPaymentAmount);
        
        setPriceBreakdown([{ description: `Primeira Cobrança (proporcional)`, subtotal: firstPaymentAmount }]);
      } else {
        setProRataOccurrences(null);
        setFirstPayment(null);
        setRecurringPayment(null);
        if (totalCalculatedPrice > 0) {
          setPriceBreakdown([{ description: `Valor da Reserva`, subtotal: totalCalculatedPrice }]);
        } else {
          setPriceBreakdown([]);
        }
      }

      const matchingDiscount = durationDiscounts.filter(d => d.is_active && totalDurationHours >= d.duration_hours).sort((a, b) => b.duration_hours - a.duration_hours)[0];
      let finalDiscountAmount = 0;
      if (matchingDiscount) {
        finalDiscountAmount = priceForThisTransaction * (matchingDiscount.discount_percentage / 100);
        setDiscountInfo({ percentage: matchingDiscount.discount_percentage, duration: matchingDiscount.duration_hours });
      } else {
        setDiscountInfo(null);
      }
      setDiscountAmount(finalDiscountAmount);

      const priceAfterDiscount = priceForThisTransaction - finalDiscountAmount;
      
      let rentalCost = 0;
      const rentedItemsDetails: { itemId: string; name: string; quantity: number; price: number }[] = [];
      for (const itemId in selectedItems) {
        const quantity = selectedItems[itemId];
        if (quantity > 0) {
          const item = rentalItems.find(i => i.id === itemId);
          if (item) {
            rentalCost += item.price * quantity;
            rentedItemsDetails.push({ itemId: item.id, name: item.name, quantity: quantity, price: item.price });
          }
        }
      }

      let professionalCost = 0;
      if (selectedProfissionalId) {
        const prof = profissionais.find(p => p.id === selectedProfissionalId);
        if (prof) {
            professionalCost = prof.taxa_hora;
        }
      }

      const priceWithItemsAndProf = priceAfterDiscount + rentalCost + professionalCost;

      let creditToApplyNow = 0;
      if (useCredit && availableCredit > 0) {
        const remainingCost = priceWithItemsAndProf - originalCreditUsed;
        if (remainingCost > 0) {
          creditToApplyNow = Math.min(remainingCost, availableCredit);
        }
      }

      const totalCreditOnReservation = originalCreditUsed + creditToApplyNow;
      
      setFormData(prev => {
        const valorAPagar = priceWithItemsAndProf - totalCreditOnReservation;
        
        let newPaymentStatus = prev.payment_status;

        if (isManuallyPaid) {
          newPaymentStatus = 'pago';
        } else if (isEditing && reservation?.payment_status === 'pago') {
          if (valorAPagar > 0) {
            newPaymentStatus = 'pendente';
          }
        } else {
          if (priceBreakdown.length > 0 || rentalCost > 0 || professionalCost > 0 || totalCreditOnReservation > 0) {
            newPaymentStatus = valorAPagar <= 0 ? 'pago' : 'pendente';
          }
        }

        if (prev.type === 'bloqueio') {
          newPaymentStatus = 'pago';
        }

        return {
          ...prev,
          total_price: totalCalculatedPrice,
          credit_used: totalCreditOnReservation,
          rented_items: rentedItemsDetails,
          payment_status: newPaymentStatus,
          atleta_aluguel_id: selectedProfissionalId,
        };
      });
    };
    calculatePrice();
  }, [
    formData.quadra_id, formData.sport_type, formData.date, formData.start_time, formData.end_time, formData.type, formData.recurringType,
    selectedClient, quadras, durationDiscounts, useCredit, availableCredit, isEditing, 
    originalCreditUsed, selectedItems, rentalItems, addToast, profissionais, selectedProfissionalId, findMatchingRule, isClientBooking, reservation, isManuallyPaid, priceBreakdown.length
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const { quadra_id, date, start_time, end_time, isRecurring, recurringEndDate } = formData;
    if (!quadra_id || !date || !start_time || !end_time) {
      setConflictWarning(null);
      return;
    }

    const startMinutes = timeToMinutes(start_time);
    let endMinutes = timeToMinutes(end_time);

    if (endMinutes === 0 && end_time === '00:00') {
      endMinutes = 24 * 60;
    }

    if (startMinutes === -1 || endMinutes === -1 || startMinutes >= endMinutes) {
        setConflictWarning(null);
        return;
    }

    const tempReserva: Reserva = {
      id: isEditing ? reservation!.id : `temp_${uuidv4()}`,
      arena_id: arenaId,
      quadra_id,
      date,
      start_time,
      end_time,
      isRecurring,
      recurringEndDate,
      status: 'confirmada',
      type: formData.type,
      clientName: formData.clientName,
      created_at: new Date().toISOString(),
    };

    const conflict = hasTimeConflict(tempReserva, allReservations, quadras);

    if (conflict) {
      setConflictWarning("Conflito de horário detectado. A quadra já está reservada neste período.");
    } else {
      setConflictWarning(null);
    }

  }, [formData.quadra_id, formData.date, formData.start_time, formData.end_time, formData.isRecurring, formData.recurringEndDate, allReservations, quadras, isEditing, reservation, isOpen, formData.type, formData.clientName, arenaId]);
  
  const handleSaveClick = async () => {
    if (!isEditing && formData.type !== 'bloqueio') {
      const reservationDateTime = parse(formData.start_time, 'HH:mm', parseDateStringAsLocal(formData.date));
      if (isBefore(reservationDateTime, new Date())) {
        addToast({ message: "Não é possível criar reservas para horários que já passaram.", type: 'error' });
        return;
      }
    }
    if (conflictWarning) {
      addToast({ message: conflictWarning, type: 'error' });
      return;
    }
    if (operatingHoursWarning) {
      addToast({ message: operatingHoursWarning, type: 'error' });
      return;
    }
    
    let finalAlunoId = selectedClientId;
    if (!finalAlunoId && formData.clientName && !isClientBooking) {
      try {
        const { data: allAlunos } = await supabaseApi.select<Aluno>('alunos', arenaId);
        const existingAluno = allAlunos.find(a => a.name.toLowerCase() === formData.clientName.toLowerCase());
        
        if (existingAluno) {
            finalAlunoId = existingAluno.id;
        } else if (!isEditing) { // Only create new alunos for new reservations
            const { data: newAlunos } = await supabaseApi.upsert('alunos', [{
              arena_id: arenaId,
              name: formData.clientName,
              phone: formData.clientPhone || null,
              status: 'ativo',
              plan_name: 'Avulso',
              join_date: format(new Date(), 'yyyy-MM-dd')
            }], arenaId);
            if (newAlunos && newAlunos[0]) {
              finalAlunoId = newAlunos[0].id;
              addToast({ message: `Novo cliente "${formData.clientName}" criado.`, type: 'info' });
            }
        }
      } catch (e) {
        addToast({ message: 'Erro ao criar ou encontrar cliente.', type: 'error' });
        return;
      }
    }

    const participants: any[] = [];
    if (isGroupBooking && userProfile) {
        participants.push({
            profile_id: userProfile.id,
            name: userProfile.name,
            avatar_url: userProfile.avatar_url,
            status: 'accepted',
            payment_status: 'pendente'
        });
        invitedFriendIds.forEach(friendId => {
            const friendProfile = friends.find(f => f.id === friendId);
            if (friendProfile) {
                participants.push({
                    profile_id: friendProfile.id,
                    name: friendProfile.name,
                    avatar_url: friendProfile.avatar_url,
                    status: 'pending',
                    payment_status: 'pendente'
                });
            }
        });
    }

    let dataToSave: Partial<Reserva> & { originalCreditUsed?: number; newSportCreated?: string } = { ...formData, participants, originalCreditUsed: originalCreditUsed, aluno_id: finalAlunoId };
    
    if (!isEditing) {
      dataToSave.created_by_name = userProfile?.name;
    }

    if (isManuallyPaid) {
        dataToSave.status = 'confirmada';
        dataToSave.payment_status = 'pago';
        dataToSave.payment_deadline = null;
    } else if (dataToSave.payment_status === 'pago') {
        dataToSave.status = 'confirmada';
        dataToSave.payment_deadline = null;
    } else if (!isEditing && dataToSave.payment_status === 'pendente' && (dataToSave.total_price || 0) > 0) {
        dataToSave.status = 'aguardando_pagamento';
        const { data: arenas } = await supabaseApi.select<Arena>('arenas', 'all');
        const currentArena = arenas.find(a => a.id === arenaId);
        const paymentWindow = currentArena?.single_booking_payment_window_minutes || 30;
        dataToSave.payment_deadline = addMinutes(new Date(), paymentWindow).toISOString();
    }
    
    if (formData.type === 'bloqueio') {
      dataToSave.clientName = formData.notes || 'Horário Bloqueado';
      dataToSave.total_price = 0;
      dataToSave.credit_used = 0;
      dataToSave.status = 'confirmada';
      dataToSave.payment_status = 'pago';
      delete dataToSave.payment_deadline;
    }
    
    dataToSave.isRecurring = formData.recurringType !== 'none';
    if(isRecurringIndefinite) {
      dataToSave.recurringEndDate = null;
    }

    const isNewSport = !allSportsOptions.includes(formData.sport_type);
    if (isNewSport && formData.sport_type) {
        dataToSave.newSportCreated = formData.sport_type;
    }

    const currentArena = allArenas.find(a => a.id === arenaId);
    const arenaHasAsaas = currentArena ? checkAsaasConfigForArena(currentArena) : false;
    const requiresPayment = !isEditing && valorAPagar > 0 && !isManuallyPaid && formData.type !== 'bloqueio';
    
    if (arenaHasAsaas && asaasConfigured && requiresPayment && currentArena) {
      const reservationToSave = isEditing ? { ...reservation, ...dataToSave } as Reserva : {
        ...dataToSave,
        id: dataToSave.id || uuidv4(),
        arena_id: arenaId,
        created_at: new Date().toISOString(),
      } as Reserva;
      
      setSavedReservation(reservationToSave);
      setShowPaymentModal(true);
    } else {
      onSave(isEditing ? { ...reservation, ...dataToSave } as Reserva : dataToSave as Reserva);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    if (name === 'clientPhone') {
      finalValue = maskPhone(value);
    }
    if (name === 'quadra_id') {
        setFormData(prev => ({ ...prev, quadra_id: value }));
    } else {
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleIndefiniteToggle = (checked: boolean) => {
    setIsRecurringIndefinite(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, recurringEndDate: null }));
    } else {
      setFormData(prev => ({ ...prev, recurringEndDate: format(addYears(new Date(), 1), 'yyyy-MM-dd') }));
    }
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    const item = rentalItems.find(i => i.id === itemId);
    const stock = availableStock[itemId] ?? 0;
    if (!item) return;

    const newQuantity = Math.max(0, quantity);

    if (newQuantity > stock) {
        addToast({ message: `Estoque insuficiente para ${item.name}. Apenas ${stock} disponíveis.`, type: 'error' });
        return;
    }

    setSelectedItems(prev => ({
      ...prev,
      [itemId]: newQuantity,
    }));
  };

  const handleFriendToggle = (friendId: string) => {
    setInvitedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const rentalCost = useMemo(() => {
    return formData.rented_items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  }, [formData.rented_items]);

  const professionalCost = useMemo(() => {
    if (!selectedProfissionalId) return 0;
    const prof = profissionais.find(p => p.id === selectedProfissionalId);
    return prof ? prof.taxa_hora : 0;
  }, [selectedProfissionalId, profissionais]);
  
  const totalBruto = useMemo(() => {
    if (firstPayment !== null) return firstPayment;
    return priceBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
  }, [firstPayment, priceBreakdown]);

  const valorAPagar = totalBruto - discountAmount + rentalCost + professionalCost - (formData.credit_used || 0);
  
  const numParticipants = isGroupBooking ? 1 + invitedFriendIds.length : 1;
  const valorPorJogador = numParticipants > 0 ? (totalBruto - discountAmount + rentalCost + professionalCost) / numParticipants : 0;

  const isBlockMode = formData.type === 'bloqueio';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isEditing ? 'Editar Reserva' : isBlockMode ? 'Bloquear Horário' : 'Nova Reserva'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin"/></div>
              ) : (
                <>
                  {isBlockMode ? (
                    <Input label="Motivo do Bloqueio" name="notes" value={formData.notes} onChange={handleChange} icon={<Info className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Manutenção, Uso Interno" disabled={isReadOnly} />
                  ) : isClientBooking ? (
                    <div className="p-4 rounded-lg bg-brand-gray-100 dark:bg-brand-gray-800"><div className="flex items-center"><User className="h-5 w-5 mr-3 text-brand-gray-500" /><div><p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Reserva em nome de:</p><p className="font-semibold text-brand-gray-900 dark:text-white">{formData.clientName}</p></div></div></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CreatableClientSelect alunos={alunos} value={{ id: selectedClientId, name: formData.clientName }} onChange={(selection) => { setFormData(prev => ({ ...prev, clientName: selection.name, clientPhone: selection.phone || '' })); const selectedAluno = alunos.find(a => a.id === selection.id); setCustomerType(selectedAluno?.monthly_fee && selectedAluno.monthly_fee > 0 ? 'Mensalista' : 'Avulso'); }} placeholder="Digite ou selecione o cliente" disabled={isReadOnly} />
                      <Input label="Telefone do Cliente" name="clientPhone" value={formData.clientPhone} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                    </div>
                  )}

                  {!isBlockMode && customerType && !isClientBooking && <span className={`text-xs -mt-4 block font-semibold ${customerType === 'Mensalista' ? 'text-green-600' : 'text-blue-600'}`}>{customerType}</span>}
                  
                  {isEditing && formData.created_by_name && (
                    <div className="mt-4 p-3 rounded-md bg-brand-gray-50 dark:bg-brand-gray-800/50 border dark:border-brand-gray-700"><p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Reserva criada por <strong className="text-brand-gray-700 dark:text-brand-gray-300">{formData.created_by_name}</strong> em {formData.created_at ? format(new Date(formData.created_at), "dd/MM/yyyy 'às' HH:mm") : 'data indisponível'}</p></div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                      <select name="quadra_id" value={formData.quadra_id} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" disabled={isReadOnly}><option value="">Selecione a quadra</option>{quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}</select>
                    </div>
                    {!isBlockMode && (
                     <div>
                       <CreatableSelect
                         label="Esporte"
                         options={allSportsOptions}
                         value={formData.sport_type}
                         onChange={(value) => setFormData(prev => ({ ...prev, sport_type: value }))}
                         disabled={isReadOnly}
                       />
                     </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Data" name="date" type="date" value={formData.date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                    <Input label="Início" name="start_time" type="time" value={formData.start_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                    <Input label="Fim" name="end_time" type="time" value={formData.end_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                  </div>

                  {!isClientBooking && (
                    <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1 flex items-center gap-2"><Repeat className="h-4 w-4" /> Tipo de Recorrência</label>
                        <select name="recurringType" value={formData.recurringType} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" disabled={isReadOnly}>
                          <option value="none">Não Recorrente</option>
                          <option value="weekly">Semanal (Horário Fixo)</option>
                          <option value="monthly">Mensal</option>
                          <option value="quarterly">Trimestral</option>
                          <option value="semiannual">Semestral</option>
                          <option value="annual">Anual</option>
                        </select>
                      </div>
                      {formData.recurringType !== 'none' && (
                        <div className="mt-4 space-y-4">
                          {formData.date && (
                            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                              A reserva se repetirá toda <strong className="capitalize">{format(parseDateStringAsLocal(formData.date), 'EEEE', { locale: ptBR })}</strong>.
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <Input label="Repetir até" name="recurringEndDate" type="date" value={formData.recurringEndDate || ''} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly || isRecurringIndefinite} />
                            <div className="flex items-center pb-2">
                              <input id="recurring-indefinite" type="checkbox" checked={isRecurringIndefinite} onChange={(e) => handleIndefiniteToggle(e.target.checked)} className="h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500" disabled={isReadOnly} />
                              <label htmlFor="recurring-indefinite" className="ml-2 block text-sm text-brand-gray-900 dark:text-brand-gray-300">Sem data para acabar</label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isBlockMode && (
                    <>
                      {/* Financial Summary */}
                      <div className="p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800 space-y-2 border border-brand-gray-200 dark:border-brand-gray-700">
                        <div className="flex justify-between items-center"><h4 className="font-semibold text-brand-gray-800 dark:text-white">Resumo Financeiro</h4>{formData.payment_status === 'pago' && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><CheckCircle className="h-4 w-4 mr-1.5" />Pago</span>)}</div>
                        
                        {firstPayment !== null && recurringPayment !== null ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <div>
                                <span>Primeira Cobrança (proporcional)</span>
                                {proRataOccurrences !== null && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400 block">
                                    (referente a {proRataOccurrences} reserva(s) neste mês)
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(firstPayment)}</span>
                            </div>
                            <div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Valor da Recorrência</span><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(recurringPayment)}</span></div>
                          </>
                        ) : (
                          priceBreakdown.map((item, index) => (<div key={index} className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">{item.description}</span><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(item.subtotal)}</span></div>))
                        )}

                        {discountAmount > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-green-600 dark:text-green-400">Desconto por Duração ({discountInfo?.duration}h - {discountInfo?.percentage}%)</span><span className="font-medium text-green-600 dark:text-green-400">- {formatCurrency(discountAmount)}</span></div>)}
                        {rentalCost > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Itens Alugados</span><span className="font-medium text-brand-gray-800 dark:text-white">+ {formatCurrency(rentalCost)}</span></div>)}
                        {professionalCost > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Taxa do Atleta</span><span className="font-medium text-brand-gray-800 dark:text-white">+ {formatCurrency(professionalCost)}</span></div>)}
                        {(formData.credit_used || 0) > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-blue-600 dark:text-blue-400">Crédito Utilizado</span><span className="font-medium text-blue-600 dark:text-blue-400">- {formatCurrency(formData.credit_used)}</span></div>)}
                        <div className="flex justify-between text-lg font-bold border-t-2 border-brand-gray-300 dark:border-brand-gray-600 pt-2 mt-2"><span className="text-brand-gray-800 dark:text-white">Valor a Pagar</span><span className="text-brand-blue-600 dark:text-brand-blue-300">{formatCurrency(valorAPagar)}</span></div>
                        
                        {availableCredit > 0 && !isBlockMode && (
                          <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
                            <label htmlFor="use-credit" className="flex items-center justify-between cursor-pointer">
                              <span className="font-semibold text-green-700 dark:text-green-300 flex items-center">
                                <CreditCard className="h-5 w-5 mr-2" />
                                Usar saldo de crédito ({formatCurrency(availableCredit)})
                              </span>
                              <input
                                id="use-credit"
                                type="checkbox"
                                checked={useCredit}
                                onChange={(e) => !isReadOnly && setUseCredit(e.target.checked)}
                                className="form-checkbox h-5 w-5 rounded text-brand-blue-600 focus:ring-brand-blue-500"
                                disabled={isReadOnly || valorAPagar <= 0}
                              />
                            </label>
                          </div>
                        )}

                        {!isClientBooking && !isBlockMode && !isReadOnly && (
                          <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
                            <label htmlFor="manual-payment" className="flex items-center justify-between cursor-pointer">
                                <span className="font-semibold text-green-700 dark:text-green-300 flex items-center"><DollarSign className="h-5 w-5 mr-2" />Marcar como pago</span>
                                <input id="manual-payment" type="checkbox" checked={isManuallyPaid} onChange={(e) => setIsManuallyPaid(e.target.checked)} className="form-checkbox h-5 w-5 rounded text-brand-blue-600 focus:ring-brand-blue-500" disabled={isEditing && reservation?.payment_status === 'pago'} />
                            </label>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {conflictWarning && (<div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 flex items-start text-red-700 dark:text-red-300"><AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/><p className="text-xs">{conflictWarning}</p></div>)}
                  {operatingHoursWarning && (<div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/50 flex items-start text-yellow-700 dark:text-yellow-300"><AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/><p className="text-xs">{operatingHoursWarning}</p></div>)}
                </>
              )}
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div className="flex gap-3">
                {isEditing && reservation && !isClientBooking && (
                  <Button variant="outline" className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onCancelReservation(reservation)} disabled={isReadOnly}>
                    Cancelar Reserva
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  {isClientBooking ? 'Fechar' : 'Cancelar'}
                </Button>
                <Button onClick={handleSaveClick} disabled={isLoading || isReadOnly || !!operatingHoursWarning || !!conflictWarning}>
                  <Save className="h-4 w-4 mr-2"/> 
                  {isClientBooking ? 'Reservar' : (isEditing ? 'Salvar Alterações' : 'Salvar')}
                </Button>
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {showPaymentModal && savedReservation && (
        <ArenaPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSavedReservation(null);
            onClose();
          }}
          onSuccess={(paymentInfo) => {
            if (!savedReservation) return;
            
            const updatedReservation = { ...savedReservation };
            updatedReservation.asaas_payment_id = paymentInfo.paymentId;
            
            if (paymentInfo.isRealPayment) {
              if (paymentInfo.billingType === 'CREDIT_CARD' && paymentInfo.status === 'CONFIRMED') {
                updatedReservation.status = 'confirmada';
                updatedReservation.payment_status = 'pago';
                updatedReservation.payment_deadline = null;
                addToast({ message: 'Pagamento confirmado! Reserva criada com sucesso.', type: 'success' });
              } else {
                updatedReservation.status = 'aguardando_pagamento';
                updatedReservation.payment_status = 'pendente';
                const currentArena = allArenas.find(a => a.id === arenaId);
                const paymentWindow = currentArena?.single_booking_payment_window_minutes || 30;
                updatedReservation.payment_deadline = addMinutes(new Date(), paymentWindow).toISOString();
                addToast({ 
                  message: paymentInfo.billingType === 'BOLETO' 
                    ? 'Boleto gerado! Aguardando pagamento para confirmar reserva.' 
                    : 'PIX gerado! Aguardando pagamento para confirmar reserva.', 
                  type: 'info' 
                });
              }
            } else {
              updatedReservation.status = 'confirmada';
              updatedReservation.payment_status = 'pago';
              updatedReservation.payment_deadline = null;
              addToast({ message: 'Reserva criada (modo simulação).', type: 'success' });
            }
            
            onSave(updatedReservation);
            setShowPaymentModal(false);
            setSavedReservation(null);
            onClose();
          }}
          arena={allArenas.find(a => a.id === arenaId)!}
          customer={
            clientProfile || userProfile || {
              id: 'temp',
              name: formData.clientName || 'Cliente',
              email: '',
              phone: formData.clientPhone || '',
            } as any
          }
          amount={valorAPagar}
          description={`Reserva - ${quadras.find(q => q.id === formData.quadra_id)?.name} - ${formData.date} ${formData.start_time}`}
          dueDate={formData.date}
          externalReference={savedReservation.id}
        />
      )}
    </>
  );
};

export default ReservationModal;
