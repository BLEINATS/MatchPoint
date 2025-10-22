{`{/*
  ====================================================================
  || ATENÇÃO: CÓDIGO PROTEGIDO (BLINDADO) POR SOLICITAÇÃO DO USUÁRIO ||
  ====================================================================
  || Este arquivo contém a lógica crítica para o cálculo de preços, ||
  || aplicação de descontos e utilização de créditos.              ||
  ||                                                                ||
  || NÃO FAÇA ALTERAÇÕES NESTA LÓGICA SEM CONFIRMAÇÃO EXPLÍCITA.    ||
  || Antes de qualquer mudança, pergunte ao usuário:                ||
  || "Você confirma que deseja alterar a lógica de crédito/preço?"  ||
  ====================================================================
*/}`}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Clock, User, Phone, Repeat, Tag, DollarSign, Info, AlertTriangle, CreditCard, ShoppingBag, Handshake, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Aluno, Quadra, Reserva, PricingRule, DurationDiscount, ReservationType, RentalItem, Profile, AtletaAluguel, Friendship } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { useToast } from '../../context/ToastContext';
import { format, parse, getDay, addDays, addMinutes, isBefore, startOfDay, endOfDay } from 'date-fns';
import CreatableClientSelect from '../Forms/CreatableClientSelect';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { maskPhone } from '../../utils/masks';
import { hasTimeConflict, expandRecurringReservations } from '../../utils/reservationUtils';
import { localApi } from '../../lib/localApi';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Omit<Reserva, 'id' | 'created_at' | 'arena_id'> | Reserva) => void;
  onCancelReservation: (reservation: Reserva) => void;
  reservation?: Reserva | null;
  newReservationSlot?: { quadraId: string, time: string, type?: ReservationType } | null;
  quadras: Quadra[];
  alunos: Aluno[];
  allReservations: Reserva[];
  arenaId: string;
  selectedDate: Date;
  isClientBooking?: boolean;
  userProfile?: Profile | null;
  clientProfile?: Aluno | null;
  profissionais?: AtletaAluguel[];
  friends?: Profile[];
  isReadOnly?: boolean;
}

const ALL_SPORTS = ['Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Tênis', 'Padel', 'Futebol Society', 'Outro'];

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

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSave, onCancelReservation, reservation, newReservationSlot, quadras, alunos, allReservations, arenaId, selectedDate, isClientBooking = false, userProfile, clientProfile, profissionais = [], friends = [], isReadOnly = false }) => {
  const { addToast } = useToast();
  const [durationDiscounts, setDurationDiscounts] = useState<DurationDiscount[]>([]);
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'Avulso' | 'Mensalista' | null>(null);

  const [reservationPrice, setReservationPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState<{ percentage: number; duration: number } | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<{ description: string; subtotal: number }[]>([]);
  const [activeRule, setActiveRule] = useState<PricingRule | null>(null);
  const [useCredit, setUseCredit] = useState(false);
  const [newlyAppliedCredit, setNewlyAppliedCredit] = useState(0);
  const [originalCreditUsed, setOriginalCreditUsed] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [operatingHoursWarning, setOperatingHoursWarning] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  
  const [showHirePlayer, setShowHirePlayer] = useState(false);
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string | null>(null);

  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    quadra_id: '',
    clientName: '',
    clientPhone: '',
    status: 'confirmada' as Reserva['status'],
    type: 'avulsa' as ReservationType,
    sport_type: 'Beach Tennis',
    total_price: 0,
    credit_used: 0,
    isRecurring: false,
    recurringType: 'weekly' as Reserva['recurringType'],
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

  const selectedClient = useMemo(() => {
    if (isClientBooking) return clientProfile;
    return alunos.find(a => a.name === formData.clientName);
  }, [formData.clientName, alunos, isClientBooking, clientProfile]);

  const selectedClientId = useMemo(() => {
    return selectedClient ? selectedClient.id : null;
  }, [selectedClient]);

  const availableCredit = useMemo(() => {
    return selectedClient?.credit_balance || 0;
  }, [selectedClient]);

  const availableProfessionals = useMemo(() => {
    if (!profissionais) return [];
    return profissionais.filter(p =>
      p.status === 'disponivel' &&
      p.esportes.some(e => e.sport === formData.sport_type)
    );
  }, [profissionais, formData.sport_type]);

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
          localApi.select<DurationDiscount>('duration_discounts', arenaId),
          localApi.select<RentalItem>('rental_items', arenaId),
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

  useEffect(() => {
    const loadAndSetData = async () => {
      if (isOpen) {
        setIsLoading(true);
        let reservationToUse: Reserva | null = null;
        
        if (reservation?.id && arenaId) {
          try {
            const { data: allReservas } = await localApi.select<Reserva>('reservas', arenaId);
            reservationToUse = allReservas.find(r => r.id === reservation.id) || reservation;
          } catch {
            reservationToUse = reservation;
          }
        } else {
          reservationToUse = reservation;
        }

        let baseData: any = {
          date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: '09:00', end_time: '10:00',
          quadra_id: quadras.length > 0 ? quadras[0].id : '',
          clientName: '', clientPhone: '',
          status: 'confirmada', type: 'avulsa', sport_type: 'Beach Tennis',
          total_price: 0, credit_used: 0,
          isRecurring: false, recurringType: 'weekly',
          recurringEndDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          rented_items: [], payment_status: 'pendente', notes: '',
          atleta_aluguel_id: null, participants: [],
        };

        if (reservationToUse) {
          const creditAlreadyUsed = reservationToUse.credit_used || 0;
          baseData = {
            ...baseData,
            ...reservationToUse,
            start_time: reservationToUse.start_time.slice(0, 5),
            end_time: reservationToUse.end_time.slice(0, 5),
            credit_used: creditAlreadyUsed,
          };
          setOriginalCreditUsed(creditAlreadyUsed);
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
            sport_type: selectedQuadra?.sports?.[0] || 'Beach Tennis',
          };
          
          if (newReservationSlot.type === 'bloqueio') {
            baseData.clientName = 'Horário Bloqueado';
          }

          if (isClientBooking && userProfile) {
              baseData.clientName = userProfile.name;
              baseData.clientPhone = userProfile.phone || '';
          }
          setOriginalCreditUsed(0);
          setSelectedItems({});
          setInvitedFriendIds([]);
          setIsGroupBooking(false);
        }
        setFormData(prev => ({...prev, ...baseData}));
        setIsLoading(false);
      }
    };
    loadAndSetData();
  }, [isOpen, reservation, newReservationSlot, arenaId, selectedDate, quadras, isClientBooking, userProfile]);

  const findMatchingRule = useCallback((
    rules: PricingRule[], sport: string, date: string, startTime: string
  ): { rule: PricingRule | null, isMonthly: boolean } => {
    const reservationDay = getDay(parseDateStringAsLocal(date));
    const isMonthlyCustomer = !!(selectedClient && selectedClient.monthly_fee && selectedClient.monthly_fee > 0);
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

    return { rule: targetRule, isMonthly: isMonthlyCustomer };
  }, [selectedClient]);

  useEffect(() => {
    const calculatePrice = () => {
      setActiveRule(null);
      const { quadra_id, sport_type, date, start_time, end_time, type } = formData;
      if (!quadra_id || !date || !start_time || !end_time || type === 'bloqueio') {
        setOperatingHoursWarning(null);
        setPriceBreakdown([]); setReservationPrice(0); setDiscountAmount(0); setDiscountInfo(null);
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
        setPriceBreakdown([]); setReservationPrice(0); setDiscountAmount(0); setDiscountInfo(null);
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
        setPriceBreakdown([]); setReservationPrice(0); setDiscountAmount(0); setDiscountInfo(null);
        return;
      }

      const { rule: applicableRule, isMonthly } = findMatchingRule(rulesForQuadra, sport_type, date, start_time);
      setActiveRule(applicableRule);
      
      let pricePerHour = 0;
      if (applicableRule) {
        pricePerHour = isClientBooking ? applicableRule.price_single : (isMonthly ? applicableRule.price_monthly : applicableRule.price_single);
      }
      const totalCalculatedPrice = pricePerHour * totalDurationHours;

      setReservationPrice(totalCalculatedPrice);
      if (totalCalculatedPrice > 0) {
        setPriceBreakdown([{
          description: `Valor da Reserva`,
          subtotal: totalCalculatedPrice
        }]);
      } else {
        setPriceBreakdown([]);
      }

      const matchingDiscount = durationDiscounts.filter(d => d.is_active && totalDurationHours >= d.duration_hours).sort((a, b) => b.duration_hours - a.duration_hours)[0];
      let finalDiscountAmount = 0;
      if (matchingDiscount) {
        finalDiscountAmount = totalCalculatedPrice * (matchingDiscount.discount_percentage / 100);
        setDiscountInfo({ percentage: matchingDiscount.discount_percentage, duration: matchingDiscount.duration_hours });
      } else {
        setDiscountInfo(null);
      }
      setDiscountAmount(finalDiscountAmount);

      const priceAfterDiscount = totalCalculatedPrice - finalDiscountAmount;
      
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
      setNewlyAppliedCredit(creditToApplyNow);

      const totalCreditOnReservation = originalCreditUsed + creditToApplyNow;
      
      setFormData(prev => {
        const valorAPagar = priceWithItemsAndProf - totalCreditOnReservation;
        const newCalculatedStatus = valorAPagar <= 0 ? 'pago' : 'pendente';
      
        // If the reservation was already paid, don't change status unless price changes.
        if (prev.payment_status === 'pago' && Math.abs(priceWithItemsAndProf - (prev.total_price || 0)) < 0.01) {
          return {
            ...prev,
            total_price: priceWithItemsAndProf,
            credit_used: totalCreditOnReservation,
            rented_items: rentedItemsDetails,
            atleta_aluguel_id: selectedProfissionalId,
            // payment_status is intentionally omitted to keep the existing 'pago' status
          };
        }
      
        // For new reservations, unpaid ones, or when price changes on a paid one.
        return {
          ...prev,
          total_price: priceWithItemsAndProf,
          credit_used: totalCreditOnReservation,
          rented_items: rentedItemsDetails,
          payment_status: newCalculatedStatus,
          atleta_aluguel_id: selectedProfissionalId,
        };
      });
    };
    calculatePrice();
  }, [
    formData.quadra_id, formData.sport_type, formData.date, formData.start_time, formData.end_time, formData.type, formData.isRecurring,
    selectedClient, quadras, durationDiscounts, useCredit, availableCredit, isEditing, 
    originalCreditUsed, selectedItems, rentalItems, addToast, profissionais, selectedProfissionalId, findMatchingRule, isClientBooking
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
  
  useEffect(() => {
    if (formData.quadra_id) {
      const selectedQuadra = quadras.find(q => q.id === formData.quadra_id);
      if (selectedQuadra && selectedQuadra.sports && selectedQuadra.sports.length > 0) {
        const primarySport = selectedQuadra.sports[0];
        if (primarySport !== formData.sport_type) {
          setFormData(prev => ({ ...prev, sport_type: primarySport }));
        }
      }
    }
  }, [formData.quadra_id, quadras]);

  const handleSaveClick = () => {
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

    let dataToSave: Partial<Reserva> = { ...formData, participants, originalCreditUsed: originalCreditUsed };
    
    if (!isEditing) {
      dataToSave.created_by_name = userProfile?.name;
      if (dataToSave.total_price && dataToSave.total_price > 0) {
        dataToSave.status = 'aguardando_pagamento';
        dataToSave.payment_deadline = addMinutes(new Date(), 30).toISOString();
      } else {
        dataToSave.status = 'confirmada';
      }
    }
    
    if (formData.type === 'bloqueio') {
      dataToSave.clientName = formData.notes || 'Horário Bloqueado';
      dataToSave.total_price = 0;
      dataToSave.credit_used = 0;
      dataToSave.status = 'confirmada'; // Bloqueios são sempre confirmados
      delete dataToSave.payment_deadline;
    }

    onSave(isEditing ? { ...reservation, ...dataToSave } as Reserva : dataToSave as Reserva);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'clientPhone') {
      finalValue = maskPhone(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
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

  const handleManualPaymentConfirmation = async () => {
    if (!reservation || !arenaId) return;

    try {
        await localApi.upsert('finance_transactions', [{
            arena_id: arenaId,
            description: `Pagamento Reserva: ${formData.clientName} em ${format(parseDateStringAsLocal(formData.date), 'dd/MM/yy')}`,
            amount: formData.total_price || 0,
            type: 'receita' as 'receita',
            category: 'Reservas',
            date: format(new Date(), 'yyyy-MM-dd'),
        }], arenaId);

        const updatedData = {
            ...formData,
            status: 'confirmada' as 'confirmada',
            payment_status: 'pago' as 'pago',
            payment_deadline: null,
        };
        onSave({ ...reservation, ...updatedData });

        addToast({ message: 'Pagamento confirmado e transação registrada!', type: 'success' });

    } catch (error: any) {
        addToast({ message: `Erro ao confirmar pagamento: ${error.message}`, type: 'error' });
    }
  };

  const rentalCost = useMemo(() => {
    return formData.rented_items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  }, [formData.rented_items]);

  const professionalCost = useMemo(() => {
    if (!selectedProfissionalId) return 0;
    const prof = profissionais.find(p => p.id === selectedProfissionalId);
    return prof ? prof.taxa_hora : 0;
  }, [selectedProfissionalId, profissionais]);
  
  const totalBruto = reservationPrice;
  const valorAPagar = totalBruto - discountAmount + rentalCost + professionalCost - (formData.credit_used || 0);
  
  const numParticipants = isGroupBooking ? 1 + invitedFriendIds.length : 1;
  const valorPorJogador = numParticipants > 0 ? (totalBruto - discountAmount + rentalCost + professionalCost) / numParticipants : 0;

  const isBlockMode = formData.type === 'bloqueio';
  const showConfirmPaymentButton = !isClientBooking && isEditing && formData.payment_status !== 'pago' && formData.status !== 'aguardando_pagamento';

  return (
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
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte</label>
                      <select name="sport_type" value={formData.sport_type} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" disabled={isReadOnly}>
                        {ALL_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Data" name="date" type="date" value={formData.date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                    <Input label="Início" name="start_time" type="time" value={formData.start_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                    <Input label="Fim" name="end_time" type="time" value={formData.end_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} />
                  </div>

                  {!isBlockMode && (
                    <>
                      {!isGroupBooking && !isEditing && (
                        <div className="text-center py-2">
                          <Button variant="outline" onClick={() => setIsGroupBooking(true)} disabled={isReadOnly}>
                            <Users className="h-4 w-4 mr-2" />
                            Convidar amigos e dividir o valor
                          </Button>
                        </div>
                      )}
                      <AnimatePresence>
                        {isGroupBooking && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4"><h4 className="font-semibold text-brand-gray-800 dark:text-white mb-3 flex items-center"><Users className="h-5 w-5 mr-2 text-brand-blue-500" />Convidar Amigos</h4>{friends.length > 0 ? (<div className="space-y-2 max-h-32 overflow-y-auto pr-2">{friends.map(friend => (<label key={friend.id} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700/50 cursor-pointer"><div className="flex items-center gap-3"><img src={friend.avatar_url || `https://avatar.vercel.sh/${friend.id}.svg`} alt={friend.name} className="w-8 h-8 rounded-full object-cover" /><span className="text-sm font-medium">{friend.name}</span></div><input type="checkbox" checked={invitedFriendIds.includes(friend.id)} onChange={() => handleFriendToggle(friend.id)} className="form-checkbox h-5 w-5 rounded text-brand-blue-600" disabled={isReadOnly} /></label>))}</div>) : (<p className="text-sm text-center text-brand-gray-500 py-4">Você ainda não tem amigos para convidar.</p>)}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {isEditing && originalCreditUsed > 0 && (<div className="p-3 rounded-md bg-gray-100 dark:bg-gray-700/50 flex items-center gap-3"><Info className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" /><div><p className="font-semibold text-gray-800 dark:text-gray-200">Crédito Já Aplicado</p><p className="text-sm text-gray-600 dark:text-gray-300">Esta reserva já utilizou <strong className="text-green-600 dark:text-green-400">{formatCurrency(originalCreditUsed)}</strong> de crédito.</p></div></div>)}
                      {availableCredit > 0 && (<div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 flex items-center justify-between"><div className="flex items-center"><CreditCard className="h-5 w-5 mr-3 text-blue-500" /><div><p className="font-semibold text-blue-800 dark:text-blue-200">Saldo de Crédito do Cliente</p><p className="text-sm text-blue-600 dark:text-blue-300 font-bold">{formatCurrency(availableCredit)}</p></div></div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useCredit} onChange={e => setUseCredit(e.target.checked)} className="form-checkbox h-5 w-5 rounded text-brand-blue-600" disabled={isReadOnly} /><span className="text-sm font-medium">Usar Saldo</span></label></div>)}
                      <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="form-checkbox h-4 w-4 rounded text-brand-blue-600" checked={showHirePlayer} onChange={(e) => setShowHirePlayer(e.target.checked)} disabled={isReadOnly} /><span className="text-sm font-medium flex items-center gap-2"><Handshake className="h-4 w-4 text-brand-gray-500" />Deseja contratar um Atleta de Aluguel?</span></label>{showHirePlayer && (<div className="mt-4 p-4 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">{availableProfessionals.length > 0 ? (<div className="space-y-3 max-h-48 overflow-y-auto">{availableProfessionals.map(prof => (<button key={prof.id} onClick={() => !isReadOnly && setSelectedProfissionalId(prev => prev === prof.id ? null : prof.id)} className={`w-full p-3 border-2 rounded-lg text-left flex items-center gap-3 transition-all ${selectedProfissionalId === prof.id ? 'border-brand-blue-500 bg-blue-100 dark:bg-brand-blue-500/20' : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'}`}><img src={prof.avatar_url || `https://avatar.vercel.sh/${prof.id}.svg`} alt={prof.name} className="w-12 h-12 rounded-full object-cover" /><div className="flex-1"><p className="font-bold text-sm text-brand-gray-900 dark:text-white">{prof.name}</p><p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{prof.nivel_tecnico || 'Nível não informado'}</p></div><p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(prof.taxa_hora)}</p></button>))}</div>) : (<p className="text-center text-sm text-brand-gray-500 py-4">Nenhum atleta disponível para este esporte no momento.</p>)}</div>)}</div>
                      {rentalItems.length > 0 && (<div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4"><h4 className="font-semibold text-brand-gray-800 dark:text-white mb-3 flex items-center"><ShoppingBag className="h-5 w-5 mr-2 text-brand-blue-500" />Alugar Itens Adicionais</h4><div className="space-y-3 max-h-40 overflow-y-auto pr-2">{rentalItems.map(item => { const stock = availableStock[item.id] ?? 0; const currentSelection = selectedItems[item.id] || 0; return (<div key={item.id} className="flex items-center justify-between"><div><p className="font-medium text-sm">{item.name} <span className="text-xs text-brand-gray-500">({stock} disponíveis)</span></p><p className="text-xs text-green-600 dark:text-green-400 font-semibold">{formatCurrency(item.price)} / reserva</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => handleItemQuantityChange(item.id, currentSelection - 1)} disabled={isReadOnly}>-</Button><span className="w-8 text-center font-semibold">{currentSelection}</span><Button size="sm" variant="outline" onClick={() => handleItemQuantityChange(item.id, currentSelection + 1)} disabled={isReadOnly || currentSelection >= stock}>+</Button></div></div>)})}</div></div>)}
                      {activeRule && (<div className={`p-3 rounded-md flex items-start ${activeRule.is_default ? 'bg-yellow-50 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'}`}><Tag className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/><p className="text-xs">{activeRule.is_default ? 'Aplicada regra padrão: ' : 'Promoção aplicada: '}<strong>"{activeRule.sport_type}"</strong> das {activeRule.start_time} às {activeRule.end_time}. Preço: <strong>{formatCurrency(customerType === 'Mensalista' ? activeRule.price_monthly : activeRule.price_single)}/h</strong>.</p></div>)}
                      <div className="p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800 space-y-2 border border-brand-gray-200 dark:border-brand-gray-700">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-brand-gray-800 dark:text-white">Resumo Financeiro</h4>
                          {formData.payment_status === 'pago' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Pago
                            </span>
                          )}
                        </div>
                        {priceBreakdown.map((item, index) => (<div key={index} className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">{item.description}</span><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(item.subtotal)}</span></div>))}
                        {discountAmount > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-green-600 dark:text-green-400">Desconto por Duração ({discountInfo?.duration}h - {discountInfo?.percentage}%)</span><span className="font-medium text-green-600 dark:text-green-400">- {formatCurrency(discountAmount)}</span></div>)}
                        {rentalCost > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Itens Alugados</span><span className="font-medium text-brand-gray-800 dark:text-white">+ {formatCurrency(rentalCost)}</span></div>)}
                        {professionalCost > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Taxa do Atleta</span><span className="font-medium text-brand-gray-800 dark:text-white">+ {formatCurrency(professionalCost)}</span></div>)}
                        {isGroupBooking && (<div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Valor por Jogador ({numParticipants}x)</span><div><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(valorPorJogador)}</span></div></div>)}
                        {(formData.credit_used || 0) > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-blue-600 dark:text-blue-400">Crédito Utilizado</span><span className="font-medium text-blue-600 dark:text-blue-400">- {formatCurrency(formData.credit_used)}</span></div>)}
                        <div className="flex justify-between text-lg font-bold border-t-2 border-brand-gray-300 dark:border-brand-gray-600 pt-2 mt-2"><span className="text-brand-gray-800 dark:text-white">Valor a Pagar</span><span className="text-brand-blue-600 dark:text-brand-blue-300">{formatCurrency(valorAPagar)}</span></div>
                      </div>
                    </>
                  )}

                  {conflictWarning && (<div className="p-3 rounded-md bg-red-50 dark:bg-red-900/50 flex items-start text-red-700 dark:text-red-300"><AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/><p className="text-xs">{conflictWarning}</p></div>)}
                  {operatingHoursWarning && (<div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/50 flex items-start text-yellow-700 dark:text-yellow-300"><AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/><p className="text-xs">{operatingHoursWarning}</p></div>)}
                  
                  {!isClientBooking && (
                    <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-4 w-4 rounded text-brand-blue-600" checked={formData.isRecurring} onChange={e => setFormData(p => ({...p, isRecurring: e.target.checked}))} disabled={isReadOnly} />
                        <span className="text-sm font-medium">Reserva Recorrente (Fixo)</span>
                      </label>
                      {formData.isRecurring && (<div className="mt-3 pl-6"><Input label="Repetir até" name="recurringEndDate" type="date" value={formData.recurringEndDate || ''} onChange={handleChange} icon={<Repeat className="h-4 w-4 text-brand-gray-400"/>} disabled={isReadOnly} /></div>)}
                    </div>
                  )}
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
                {showConfirmPaymentButton && (
                  <Button
                    onClick={handleManualPaymentConfirmation}
                    className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    disabled={isReadOnly}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Pagamento
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  {isClientBooking ? 'Fechar' : 'Cancelar'}
                </Button>
                <Button onClick={handleSaveClick} disabled={isLoading || isReadOnly || !!operatingHoursWarning || !!conflictWarning}>
                  <Save className="h-4 w-4 mr-2"/> 
                  {isEditing ? 'Salvar Alterações' : isBlockMode ? 'Salvar Bloqueio' : 'Reservar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReservationModal;
