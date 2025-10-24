import { Reserva, Torneio, Evento, Quadra, Turma } from '../types';
import { eachDayOfInterval, format, parse, addMinutes, getDay, isWithinInterval, startOfDay, endOfDay, addYears, differenceInMinutes } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

/**
 * Sincroniza as reservas de um torneio com a agenda principal.
 * Remove os bloqueios antigos e cria novos com base nos dados atuais do torneio.
 */
export const syncTournamentReservations = (
  torneio: Torneio,
  allReservas: Reserva[],
  quadras: Quadra[]
): Reserva[] => {
  const otherReservas = allReservas.filter(r => r.torneio_id !== torneio.id);

  if (torneio.status === 'cancelado' || torneio.status === 'planejado') {
    return otherReservas;
  }

  const newReservationsForTournament: Reserva[] = torneio.matches
    .filter(match => match.date && match.start_time && match.quadra_id)
    .map(match => {
      const p1 = torneio.participants.find(p => p.id === match.participant_ids[0]);
      const p2 = torneio.participants.find(p => p.id === match.participant_ids[1]);
      const clientName = `Partida: ${p1?.name || '?'} vs ${p2?.name || '?'}`;
      
      const quadra = quadras.find(q => q.id === match.quadra_id);
      const duration = quadra?.booking_duration_minutes || 60;
      const startTimeDate = parse(match.start_time!, 'HH:mm', new Date());
      const endTimeDate = addMinutes(startTimeDate, duration);
      const endTime = format(endTimeDate, 'HH:mm');

      return {
        id: `reserva_match_${match.id}`,
        arena_id: torneio.arena_id,
        quadra_id: match.quadra_id!,
        torneio_id: torneio.id,
        date: match.date!,
        start_time: match.start_time!,
        end_time: endTime,
        type: 'torneio',
        status: 'confirmada',
        clientName: clientName,
        isRecurring: false,
        created_at: new Date().toISOString(),
      } as Reserva;
    });

  return [...otherReservas, ...newReservationsForTournament];
};


/**
 * Sincroniza as reservas de um evento privado com a agenda principal.
 */
export const syncEventReservations = (
  evento: Evento,
  allReservas: Reserva[]
): Reserva[] => {
  const otherReservas = allReservas.filter(r => r.evento_id !== evento.id);

  if (evento.status !== 'confirmado' && evento.status !== 'realizado') {
    return otherReservas;
  }

  const newReservationsForEvent: Reserva[] = [];
  if (evento.quadras_ids.length > 0) {
    const eventDays = eachDayOfInterval({
      start: parseDateStringAsLocal(evento.startDate),
      end: parseDateStringAsLocal(evento.endDate),
    });

    for (const day of eventDays) {
      for (const quadraId of evento.quadras_ids) {
        newReservationsForEvent.push({
          id: `reserva_evento_${evento.id}_${quadraId}_${format(day, 'yyyyMMdd')}`,
          arena_id: evento.arena_id,
          quadra_id: quadraId,
          evento_id: evento.id,
          date: format(day, 'yyyy-MM-dd'),
          start_time: evento.courtStartTime || evento.startTime,
          end_time: evento.courtEndTime || evento.endTime,
          type: 'evento',
          status: 'confirmada',
          clientName: `Evento: ${evento.name}`,
          isRecurring: false,
          created_at: new Date().toISOString(),
        } as Reserva);
      }
    }
  }
  
  return [...otherReservas, ...newReservationsForEvent];
};

/**
 * Sincroniza as reservas de uma turma com a agenda principal.
 * Gera slots de reserva individuais para cada aula dentro do bloco de tempo da turma.
 */
export const syncTurmaReservations = (
  turma: Turma,
  allReservas: Reserva[]
): Reserva[] => {
  const otherReservas = allReservas.filter(r => r.turma_id !== turma.id);
  const newReservationsForTurma: Reserva[] = [];

  if (!turma.schedule || turma.schedule.length === 0) {
    return otherReservas;
  }

  const loopStartDate = parseDateStringAsLocal(turma.start_date);
  const loopEndDate = turma.end_date ? parseDateStringAsLocal(turma.end_date) : addYears(loopStartDate, 1);
  
  const classDays = eachDayOfInterval({ start: loopStartDate, end: loopEndDate });

  for (const day of classDays) {
    const scheduleForDay = turma.schedule.find(s => s.day === getDay(day));
    
    if (scheduleForDay) {
      try {
        const blockStartTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
        const blockEndTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
        const blockDuration = differenceInMinutes(blockEndTime, blockStartTime);
        
        if (blockDuration > 0) {
          const numberOfSlots = Math.floor(blockDuration / 60);

          for (let i = 0; i < numberOfSlots; i++) {
            const slotStartTime = addMinutes(blockStartTime, i * 60);
            const slotEndTime = addMinutes(slotStartTime, 60);
            
            newReservationsForTurma.push({
              id: `reserva_turma_${turma.id}_${format(day, 'yyyyMMdd')}_${format(slotStartTime, 'HHmm')}`,
              arena_id: turma.arena_id,
              quadra_id: turma.quadra_id,
              turma_id: turma.id,
              date: format(day, 'yyyy-MM-dd'),
              start_time: format(slotStartTime, 'HH:mm'),
              end_time: format(slotEndTime, 'HH:mm'),
              type: 'aula',
              status: 'confirmada',
              clientName: `Aula: ${turma.name}`,
              isRecurring: true,
              master_id: `turma_${turma.id}`,
              created_at: new Date().toISOString(),
            } as Reserva);
          }
        }
      } catch (e) {
        console.error("Error processing schedule for turma:", turma.name, e);
      }
    }
  }

  return [...otherReservas, ...newReservationsForTurma];
};
