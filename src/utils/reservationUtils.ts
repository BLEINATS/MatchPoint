import { ReservationType, Reserva, Quadra } from '../types';
import { User, GraduationCap, PartyPopper, Ban, Repeat, Trophy, Clock } from 'lucide-react';
import { format, parse, isAfter, isBefore, isSameDay, getDay, addDays, startOfDay, addYears, endOfDay, isWithinInterval } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

export const getReservationTypeDetails = (type: ReservationType, isRecurring?: boolean) => {
  const baseDetails = {
    'avulsa': { label: 'Reserva de Cliente', icon: User, bgColor: 'bg-blue-500', borderColor: 'border-blue-600', publicBgColor: 'bg-blue-100 dark:bg-blue-900/50', publicTextColor: 'text-blue-700 dark:text-blue-400' },
    'aula': { label: 'Aula', icon: GraduationCap, bgColor: 'bg-purple-500', borderColor: 'border-purple-600', publicBgColor: 'bg-purple-100 dark:bg-purple-900/50', publicTextColor: 'text-purple-700 dark:text-purple-400' },
    'torneio': { label: 'Torneio', icon: Trophy, bgColor: 'bg-orange-500', borderColor: 'border-orange-600', publicBgColor: 'bg-orange-100 dark:bg-orange-900/50', publicTextColor: 'text-orange-700 dark:text-orange-400' },
    'evento': { label: 'Evento Privado', icon: PartyPopper, bgColor: 'bg-pink-500', borderColor: 'border-pink-600', publicBgColor: 'bg-pink-100 dark:bg-pink-900/50', publicTextColor: 'text-pink-700 dark:text-pink-400' },
    'bloqueio': { label: 'Bloqueio', icon: Ban, bgColor: 'bg-red-500', borderColor: 'border-red-600', publicBgColor: 'bg-red-100 dark:bg-red-900/50', publicTextColor: 'text-red-700 dark:text-red-400' },
    'aguardando_pagamento': { label: 'Aguardando Pagamento', icon: Clock, bgColor: 'bg-yellow-400', borderColor: 'border-yellow-500', publicBgColor: 'bg-yellow-100 dark:bg-yellow-900/50', publicTextColor: 'text-yellow-700 dark:text-yellow-400' },
  };

  const details = baseDetails[type as keyof typeof baseDetails] || baseDetails['avulsa'];

  if (isRecurring) {
    return {
      ...details,
      label: `${details.label} (Fixo)`,
      icon: Repeat,
      bgColor: 'bg-slate-500',
      borderColor: 'border-slate-600',
      publicBgColor: 'bg-slate-100 dark:bg-slate-900/50',
      publicTextColor: 'text-slate-700 dark:text-slate-400',
    };
  }

  return details;
};

export const getStatusDetails = (status: Reserva['status']) => {
    switch (status) {
        case 'confirmada': return { label: 'Confirmada', color: 'text-green-500' };
        case 'pendente': return { label: 'Pendente', color: 'text-yellow-500' };
        case 'aguardando_pagamento': return { label: 'Aguardando Pagamento', color: 'text-yellow-500' };
        case 'cancelada': return { label: 'Cancelada', color: 'text-red-500' };
        case 'realizada': return { label: 'Realizada', color: 'text-purple-500' };
        case 'aguardando_aceite_profissional': return { label: 'Aguardando Profissional', color: 'text-orange-500' };
        default: return { label: 'Desconhecido', color: 'text-gray-500' };
    }
}

export const expandRecurringReservations = (
  baseReservations: Reserva[],
  viewStartDate: Date,
  viewEndDate: Date,
  quadras: Quadra[]
): Reserva[] => {
  const displayReservations: Reserva[] = [];

  baseReservations.forEach(reserva => {
    if (!reserva.isRecurring) {
      const rDate = parseDateStringAsLocal(reserva.date);
      if (isWithinInterval(rDate, { start: viewStartDate, end: viewEndDate })) {
        displayReservations.push(reserva);
      }
      return;
    }

    if (reserva.status === 'cancelada') return;

    const masterDate = startOfDay(parseDateStringAsLocal(reserva.date));
    const quadra = quadras.find(q => q.id === reserva.quadra_id);
    if (!quadra) return;

    let runningDate = startOfDay(viewStartDate);
    if (isBefore(runningDate, masterDate)) {
      runningDate = masterDate;
    }

    const recurrenceFinalEndDate = reserva.recurringEndDate && reserva.recurringEndDate.trim() !== ''
        ? endOfDay(parseDateStringAsLocal(reserva.recurringEndDate))
        : null;

    let loopEndDate = viewEndDate;
    if (recurrenceFinalEndDate && isBefore(recurrenceFinalEndDate, loopEndDate)) {
        loopEndDate = recurrenceFinalEndDate;
    }

    while (isBefore(runningDate, loopEndDate) || isSameDay(runningDate, loopEndDate)) {
      if (recurrenceFinalEndDate && isAfter(runningDate, recurrenceFinalEndDate)) {
        break; 
      }
      
      const dayOfWeek = getDay(runningDate);
      
      let shouldCreateInstance = false;
      if (reserva.recurringType === 'daily') {
        let horario;
        if (dayOfWeek === 0) horario = quadra.horarios.sunday;
        else if (dayOfWeek === 6) horario = quadra.horarios.saturday;
        else horario = quadra.horarios.weekday;
        
        if (horario && horario.start && horario.end) {
          shouldCreateInstance = true;
        }
      } else { // weekly or undefined (defaults to weekly)
        if (dayOfWeek === getDay(masterDate)) {
          shouldCreateInstance = true;
        }
      }

      if (shouldCreateInstance) {
        const dateString = format(runningDate, 'yyyy-MM-dd');
        if (reserva.attendance && reserva.attendance[dateString] === 'cancelada') {
          // Skip this instance as it's individually cancelled
        } else {
          const isOriginal = isSameDay(runningDate, masterDate);
          displayReservations.push({
            ...reserva,
            id: isOriginal ? reserva.id : `${reserva.id}_${format(runningDate, 'yyyy-MM-dd')}`,
            date: dateString,
            masterId: isOriginal ? undefined : reserva.id,
          });
        }
      }

      runningDate = addDays(runningDate, 1);
    }
  });

  return displayReservations;
};


/**
 * Checks if a single reservation instance conflicts with a list of other reservation instances.
 * This is a pure utility function.
 */
const checkSingleConflict = (reservaToCheck: Reserva, otherExpandedReservations: Reserva[]): boolean => {
  const reservaDate = parseDateStringAsLocal(reservaToCheck.date);
  let startTime = parse(reservaToCheck.start_time, 'HH:mm', reservaDate);
  let endTime = parse(reservaToCheck.end_time, 'HH:mm', reservaDate);
  if (endTime <= startTime) endTime = addDays(endTime, 1);

  for (const existing of otherExpandedReservations) {
    if (existing.quadra_id !== reservaToCheck.quadra_id) continue;
    if (!isSameDay(parseDateStringAsLocal(existing.date), reservaDate)) continue;
    if (existing.status === 'cancelada') continue;

    let existingStartTime = parse(existing.start_time, 'HH:mm', parseDateStringAsLocal(existing.date));
    let existingEndTime = parse(existing.end_time, 'HH:mm', parseDateStringAsLocal(existing.date));
    if (existingEndTime <= existingStartTime) existingEndTime = addDays(existingEndTime, 1);

    // Check for overlap: (StartA < EndB) and (EndA > StartB)
    if (startTime < existingEndTime && endTime > existingStartTime) {
      return true; // Conflict found
    }
  }
  return false;
};

/**
 * Main function to check for time conflicts. It handles single and recurring reservations.
 */
export const hasTimeConflict = (newReserva: Reserva, existingMasterReservas: Reserva[], quadras: Quadra[]): boolean => {
  if (!newReserva.date || !newReserva.start_time || !newReserva.end_time || !newReserva.quadra_id) {
    return false;
  }
  
  // Create a list of master reservations *excluding* the one being edited, if it has an ID.
  const otherMasterReservas = newReserva.id 
    ? existingMasterReservas.filter(r => r.id !== newReserva.id)
    : existingMasterReservas;

  // Case 1: The new reservation is a single, non-recurring event.
  if (!newReserva.isRecurring) {
    const newReservaDate = parseDateStringAsLocal(newReserva.date);
    // We only need to check for conflicts on that specific day.
    const otherExpandedForDay = expandRecurringReservations(otherMasterReservas, startOfDay(newReservaDate), endOfDay(newReservaDate), quadras);
    return checkSingleConflict(newReserva, otherExpandedForDay);
  }

  // Case 2: The new reservation is recurring.
  const newMasterDate = parseDateStringAsLocal(newReserva.date);
  const endDate = newReserva.recurringEndDate ? parseDateStringAsLocal(newReserva.recurringEndDate) : addYears(newMasterDate, 1);
  
  // Expand all *other* reservations for the entire period of the new recurring one.
  const otherExpandedForPeriod = expandRecurringReservations(otherMasterReservas, newMasterDate, endDate, quadras);
  
  // Expand the new reservation itself to get all its future occurrences.
  const newExpanded = expandRecurringReservations([newReserva], newMasterDate, endDate, quadras);

  // Check each new occurrence against all existing ones.
  for (const newOccurrence of newExpanded) {
    if (checkSingleConflict(newOccurrence, otherExpandedForPeriod)) {
      return true; // Conflict found in one of the future occurrences.
    }
  }

  return false;
};

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return -1;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return -1;
    return hours * 60 + minutes;
  } catch (e) {
    return -1;
  }
};
