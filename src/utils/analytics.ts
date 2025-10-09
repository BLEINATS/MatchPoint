import { Quadra, Reserva } from '../types';
import { getDay, parse, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

const timeStringToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

type CourtAvailability = {
  courtId: string;
  courtName: string;
  ranges: string[];
};

export const getAvailableTimeRangesForDay = (
  quadras: Quadra[],
  reservas: Reserva[],
  date: Date
): CourtAvailability[] => {
  const activeQuadras = quadras.filter(q => q.status === 'ativa');
  if (activeQuadras.length === 0) return [];

  const dayOfWeek = getDay(date);
  const today = startOfDay(new Date());
  const isToday = isSameDay(date, today);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const dailyReservas = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), date) && r.status !== 'cancelada');

  const availabilityByCourt: CourtAvailability[] = activeQuadras.map(quadra => {
    const timeline: boolean[] = Array(48).fill(false); // true = available

    let horario;
    if (dayOfWeek === 0) horario = quadra.horarios?.sunday;
    else if (dayOfWeek === 6) horario = quadra.horarios?.saturday;
    else horario = quadra.horarios?.weekday;

    if (horario && horario.start && horario.end) {
      const startMinutes = timeStringToMinutes(horario.start);
      let endMinutes = timeStringToMinutes(horario.end);
      if (endMinutes === 0 && horario.end === '00:00') endMinutes = 24 * 60;
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;

      for (let min = startMinutes; min < endMinutes; min += 30) {
        const slotIndex = Math.floor(min / 30);
        if (slotIndex < 48) {
          timeline[slotIndex] = true;
        }
      }
    }

    const quadraReservas = dailyReservas.filter(r => r.quadra_id === quadra.id);
    quadraReservas.forEach(reserva => {
      const startMinutes = timeStringToMinutes(reserva.start_time);
      let endMinutes = timeStringToMinutes(reserva.end_time);
      if (endMinutes === 0 && reserva.end_time === '00:00') endMinutes = 24 * 60;
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;

      for (let min = startMinutes; min < endMinutes; min += 30) {
        const slotIndex = Math.floor(min / 30);
        if (slotIndex < 48) {
          timeline[slotIndex] = false;
        }
      }
    });

    const ranges: string[] = [];
    let startRange: number | null = null;

    for (let i = 0; i < 48; i++) {
      const slotMinutes = i * 30;

      if (isToday && slotMinutes < nowMinutes) {
        if (startRange !== null) {
          const endRangeTime = minutesToTimeString(i * 30);
          if (minutesToTimeString(startRange) !== endRangeTime) {
             ranges.push(`${minutesToTimeString(startRange)} - ${endRangeTime}`);
          }
          startRange = null;
        }
        continue;
      }

      if (timeline[i] && startRange === null) {
        startRange = slotMinutes;
      } else if (!timeline[i] && startRange !== null) {
        const endRangeTime = minutesToTimeString(i * 30);
        if (minutesToTimeString(startRange) !== endRangeTime) {
            ranges.push(`${minutesToTimeString(startRange)} - ${endRangeTime}`);
        }
        startRange = null;
      }
    }

    if (startRange !== null) {
      const endRangeTime = '00:00';
      if (minutesToTimeString(startRange) !== endRangeTime) {
         ranges.push(`${minutesToTimeString(startRange)} - ${endRangeTime}`);
      }
    }

    return {
      courtId: quadra.id,
      courtName: quadra.name,
      ranges,
    };
  }).filter(court => court.ranges.length > 0);

  return availabilityByCourt;
};


export const getAvailableSlotsForDay = (quadra: Quadra, date: Date): number => {
  if (quadra.status !== 'ativa' || !quadra.horarios) return 0;

  const dayOfWeek = getDay(date);
  
  let horario;
  if (dayOfWeek === 0) {
    horario = quadra.horarios.sunday;
  } else if (dayOfWeek === 6) {
    horario = quadra.horarios.saturday;
  } else {
    horario = quadra.horarios.weekday;
  }

  if (!horario || !horario.start || !horario.end) return 0;

  try {
    const startTime = parse(horario.start, 'HH:mm', date);
    let endTime = parse(horario.end, 'HH:mm', date);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return 0;
    }

    if (endTime <= startTime) endTime = addDays(endTime, 1);
    
    const intervalMinutes = quadra.booking_duration_minutes || 60;
    if (intervalMinutes <= 0) return 0;

    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const slots = Math.floor(diffMinutes / intervalMinutes);
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
    return acc + getAvailableSlotsForDay(quadra, date);
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
