import { Reserva, Torneio, Evento, Quadra } from '../types';
import { eachDayOfInterval, format, parse, addMinutes } from 'date-fns';
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
  // 1. Remove todas as reservas antigas associadas a este torneio
  const otherReservas = allReservas.filter(r => r.torneio_id !== torneio.id);

  // 2. Se o torneio foi cancelado ou voltou para planejamento, não cria novos bloqueios
  if (torneio.status === 'cancelado' || torneio.status === 'planejado') {
    return otherReservas;
  }

  // 3. Cria novos bloqueios para cada partida agendada
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

  // 4. Retorna a lista combinada
  return [...otherReservas, ...newReservationsForTournament];
};


/**
 * Sincroniza as reservas de um evento privado com a agenda principal.
 * Remove os bloqueios antigos e cria novos com base nos dados atuais do evento.
 */
export const syncEventReservations = (
  evento: Evento,
  allReservas: Reserva[]
): Reserva[] => {
  // 1. Remove todas as reservas antigas associadas a este evento
  const otherReservas = allReservas.filter(r => r.evento_id !== evento.id);

  // 2. Se o evento não estiver confirmado, não cria novos bloqueios
  if (evento.status !== 'confirmado' && evento.status !== 'realizado') {
    return otherReservas;
  }

  // 3. Cria novos bloqueios para o período do evento
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
  
  // 4. Retorna a lista combinada
  return [...otherReservas, ...newReservationsForEvent];
};
