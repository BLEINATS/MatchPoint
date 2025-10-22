import { Quadra, Reserva } from '../types';
import { format, getDay, parse, addDays, isSameDay, startOfDay, addMinutes, isPast } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

export type CourtAvailabilitySlots = {
  courtId: string;
  courtName: string;
  slots: { start: string; end: string }[];
};

export const getAvailableSlotsForDay = (
  quadras: Quadra[],
  reservas: Reserva[],
  date: Date
): CourtAvailabilitySlots[] => {
  const activeQuadras = quadras.filter(q => q.status === 'ativa');
  if (activeQuadras.length === 0) return [];

  const dayOfWeek = getDay(date);
  const isToday = isSameDay(date, startOfDay(new Date()));

  const dailyReservas = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), date) && r.status !== 'cancelada');

  const availabilityByCourt: CourtAvailabilitySlots[] = activeQuadras.map(quadra => {
    const availableSlots: { start: string; end: string }[] = [];
    const bookingDuration = 60; // Forçar duração de 1 hora
    const slotIncrement = 60; // Verificar a cada 60 minutos

    let horario;
    if (dayOfWeek === 0) horario = quadra.horarios?.sunday;
    else if (dayOfWeek === 6) horario = quadra.horarios?.saturday;
    else horario = quadra.horarios?.weekday;

    if (horario && horario.start && horario.end) {
      let currentTime = parse(horario.start, 'HH:mm', date);
      let operatingEndTime = parse(horario.end, 'HH:mm', date);
      if (operatingEndTime <= currentTime && horario.end !== '00:00') {
          operatingEndTime = addDays(operatingEndTime, 1);
      } else if (horario.end === '00:00') {
          operatingEndTime = addDays(startOfDay(date), 1);
      }


      while (currentTime < operatingEndTime) {
        const slotStart = currentTime;
        const slotEnd = addMinutes(slotStart, bookingDuration);

        if (slotEnd > operatingEndTime) {
          break; // Slot exceeds operating hours
        }

        if (isToday && isPast(slotStart)) {
          currentTime = addMinutes(currentTime, slotIncrement);
          continue;
        }

        const hasConflict = dailyReservas.some(r => {
          if (r.quadra_id !== quadra.id) return false;
          
          const resStartTime = parse(r.start_time, 'HH:mm', date);
          let resEndTime = parse(r.end_time, 'HH:mm', date);
          if (resEndTime <= resStartTime) resEndTime = addDays(resEndTime, 1);
          
          return slotStart < resEndTime && slotEnd > resStartTime;
        });

        if (!hasConflict) {
          availableSlots.push({
            start: format(slotStart, 'HH:mm'),
            end: format(slotEnd, 'HH:mm'),
          });
        }

        currentTime = addMinutes(currentTime, slotIncrement);
      }
    }

    return {
      courtId: quadra.id,
      courtName: quadra.name,
      slots: availableSlots,
    };
  }).filter(court => court.slots.length > 0);

  return availabilityByCourt;
};

const calculateTotalSlotsForDay = (quadra: Quadra, date: Date): number => {
  if (quadra.status !== 'ativa' || !quadra.horarios) return 0;

  const dayOfWeek = getDay(date);
  
  let horario;
  if (dayOfWeek === 0) horario = quadra.horarios.sunday;
  else if (dayOfWeek === 6) horario = quadra.horarios.saturday;
  else horario = quadra.horarios.weekday;

  if (!horario || !horario.start || !horario.end) return 0;

  try {
    const startTime = parse(horario.start, 'HH:mm', date);
    let endTime = parse(horario.end, 'HH:mm', date);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;
    if (endTime <= startTime) endTime = addDays(endTime, 1);
    
    const slotIncrement = 30; // Assume 30 min increments for occupancy calculation
    
    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const slots = Math.floor(diffMinutes / slotIncrement);
    return isNaN(slots) ? 0 : slots;
  } catch (e) {
    console.error("Erro ao parsear horário:", horario);
    return 0;
  }
};

export const calculateDailyOccupancy = (
  date: Date,
  allReservas: Reserva[],
  quadras: Quadra[],
  selectedQuadraId: string | 'all'
): { rate: number; booked: number; total: number } => {
  const relevantQuadras = selectedQuadraId === 'all'
    ? quadras.filter(q => q.status === 'ativa')
    : quadras.filter(q => q.id === selectedQuadraId && q.status === 'ativa');

  if (relevantQuadras.length === 0) {
    return { rate: 0, booked: 0, total: 0 };
  }

  const totalSlotsForDay = relevantQuadras.reduce((acc, quadra) => {
    return acc + calculateTotalSlotsForDay(quadra, date);
  }, 0);

  const bookedSlotsForDay = allReservas.filter(reserva => {
    const reservaDate = parseDateStringAsLocal(reserva.date);
    return isSameDay(reservaDate, date) &&
           reserva.status !== 'cancelada' &&
           (selectedQuadraId === 'all' || reserva.quadra_id === selectedQuadraId);
  }).length;

  if (totalSlotsForDay === 0) {
    return { rate: 0, booked: bookedSlotsForDay, total: 0 };
  }

  const occupancyRate = (bookedSlotsForDay / totalSlotsForDay) * 100;

  return { rate: Math.min(occupancyRate, 100), booked: bookedSlotsForDay, total: totalSlotsForDay };
};

export const generateCalendarDays = (
  currentMonth: Date,
  allReservas: Reserva[],
  quadras: Quadra[],
  selectedQuadraId: string | 'all'
) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfMonth = getDay(monthStart);
  
  const calendarDays = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ key: `empty-${i}`, isEmpty: true });
  }

  for (const day of daysInMonth) {
    const occupancy = calculateDailyOccupancy(day, allReservas, quadras, selectedQuadraId);
    calendarDays.push({
      key: day.toISOString(),
      dayOfMonth: day.getDate(),
      date: day,
      occupancyRate: occupancy.rate,
      isEmpty: false,
    });
  }

  return calendarDays;
};

export const calculateMonthlyOccupancy = (
  month: Date,
  monthlyBookings: Reserva[],
  quadras: Quadra[]
): number => {
  const activeQuadras = quadras.filter(q => q.status === 'ativa');
  if (activeQuadras.length === 0) return 0;

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  let totalAvailableHours = 0;

  const calculateHoursInDay = (horario?: { start: string; end: string }): number => {
    if (!horario || !horario.start || !horario.end) return 0;
    try {
      const start = parse(horario.start, 'HH:mm', new Date());
      let end = parse(horario.end, 'HH:mm', new Date());
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      if (end <= start) end = addDays(end, 1);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return isNaN(diff) || diff < 0 ? 0 : diff;
    } catch {
      return 0;
    }
  };

  for (const day of daysInMonth) {
    const dayOfWeek = getDay(day);
    for (const quadra of activeQuadras) {
      if (quadra.horarios) {
        let horario;
        if (dayOfWeek === 0) horario = quadra.horarios.sunday;
        else if (dayOfWeek === 6) horario = quadra.horarios.saturday;
        else horario = quadra.horarios.weekday;
        totalAvailableHours += calculateHoursInDay(horario);
      }
    }
  }
  
  if (totalAvailableHours <= 0) return 0;

  const totalBookedHours = monthlyBookings.reduce((sum, r) => {
    if (!r.start_time || !r.end_time) return sum;
    try {
      const startTime = parse(r.start_time, 'HH:mm', new Date());
      let endTime = parse(r.end_time, 'HH:mm', new Date());
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return sum;
      if (endTime <= startTime) endTime = addDays(endTime, 1);
      const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return sum + (isNaN(diffHours) || diffHours < 0 ? 0 : diffHours);
    } catch {
      return sum;
    }
  }, 0);

  const monthlyRate = (totalBookedHours / totalAvailableHours) * 100;
  
  if (isNaN(monthlyRate)) return 0;

  return Math.min(monthlyRate, 100);
};
