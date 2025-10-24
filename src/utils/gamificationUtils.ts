import { localApi } from '../lib/localApi';
import { Reserva, Aluno, GamificationSettings, GamificationPointTransaction, CreditTransaction, Quadra } from '../types';
import { formatCurrency } from './formatters';
import { differenceInHours, format } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

/**
 * Awards points for a completed reservation.
 * Checks for existing transactions to prevent awarding points multiple times.
 */
export const awardPointsForCompletedReservation = async (reserva: Reserva, arenaId: string) => {
  if (reserva.status !== 'confirmada' && reserva.status !== 'realizada') {
    return;
  }
  
  try {
    const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
    let aluno: Aluno | undefined;

    if (reserva.aluno_id) {
      aluno = allAlunos.find(a => a.id === reserva.aluno_id);
    }
    if (!aluno && reserva.profile_id) {
      aluno = allAlunos.find(a => a.profile_id === reserva.profile_id);
    }
    if (!aluno && reserva.clientName) {
      aluno = allAlunos.find(a => a.name === reserva.clientName);
    }
    
    if (!aluno) return;

    const { data: settingsData } = await localApi.select<GamificationSettings>('gamification_settings', arenaId);
    const settings = settingsData?.[0];
    if (!settings || !settings.is_enabled) return;

    const { data: existingTransactions } = await localApi.select<GamificationPointTransaction>('gamification_point_transactions', arenaId);
    const alreadyAwarded = existingTransactions.some(t => t.related_reservation_id === reserva.id && (t.type === 'reservation_completed' || t.type === 'reservation_created'));
    if (alreadyAwarded) return;

    let totalPointsToAdd = 0;
    const descriptions: string[] = [];

    if (settings.points_per_reservation > 0) {
      totalPointsToAdd += settings.points_per_reservation;
      descriptions.push('Reserva concluída');
    }
    if (settings.points_per_real > 0 && reserva.total_price) {
      const pointsFromPrice = Math.floor(reserva.total_price * settings.points_per_real);
      if (pointsFromPrice > 0) {
        totalPointsToAdd += pointsFromPrice;
        descriptions.push(`Valor da reserva (${formatCurrency(reserva.total_price)})`);
      }
    }

    if (totalPointsToAdd === 0) return;

    const updatedPoints = (aluno.gamification_points || 0) + totalPointsToAdd;
    await localApi.upsert('alunos', [{ ...aluno, gamification_points: updatedPoints }], arenaId);

    await localApi.upsert('gamification_point_transactions', [{
      aluno_id: aluno.id,
      arena_id: arenaId,
      points: totalPointsToAdd,
      type: 'reservation_completed',
      description: descriptions.join(' + '),
      related_reservation_id: reserva.id,
    }], arenaId);

  } catch (error) {
    console.error("Error awarding points for completed reservation:", error);
  }
};


/**
 * Handles credit refund for a reservation cancellation.
 * Point deduction logic is removed as points are now awarded post-completion.
 */
export const processCancellation = async (
  reserva: Reserva,
  arenaId: string,
  quadras: Quadra[],
  creditToRefund?: number,
  refundReason?: string
): Promise<{ creditRefunded: number; pointsDeducted: number }> => {
  const profileId = reserva.profile_id;
  if (!profileId) {
    return { creditRefunded: 0, pointsDeducted: 0 };
  }

  const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
  const aluno = allAlunos.find(a => a.profile_id === profileId);
  if (!aluno) return { creditRefunded: 0, pointsDeducted: 0 };

  let finalCreditToRefund = 0;
  let finalRefundReason = refundReason;

  if (creditToRefund !== undefined && refundReason) {
    finalCreditToRefund = creditToRefund;
  } else {
    const reservaDate = parseDateStringAsLocal(reserva.date);
    const [hours, minutes] = reserva.start_time.split(':').map(Number);
    reservaDate.setHours(hours, minutes, 0, 0);
    const reservaStartDateTime = reservaDate;
    
    const hoursUntilReservation = differenceInHours(reservaStartDateTime, new Date());
    const originalPrice = reserva.total_price || 0;

    if (hoursUntilReservation >= 24) {
      finalCreditToRefund = originalPrice;
      finalRefundReason = 'Cancelamento com +24h';
    } else if (hoursUntilReservation >= 12) {
      finalCreditToRefund = originalPrice * 0.5;
      finalRefundReason = 'Cancelamento entre 12h e 24h';
    } else {
      finalCreditToRefund = 0;
      finalRefundReason = 'Cancelamento com -12h';
    }
  }

  if (finalCreditToRefund > 0) {
    const updatedAluno = { ...aluno };
    updatedAluno.credit_balance = (updatedAluno.credit_balance || 0) + finalCreditToRefund;
    await localApi.upsert('alunos', [updatedAluno], arenaId);

    const quadraName = quadras.find(q => q.id === reserva.quadra_id)?.name || 'Quadra';
    const reservaDetails = `${quadraName} em ${format(parseDateStringAsLocal(reserva.date), 'dd/MM/yy')} às ${reserva.start_time.slice(0,5)}`;
    const newDescription = `Crédito (${finalRefundReason}): ${reservaDetails}`;

    await localApi.upsert('credit_transactions', [{
      aluno_id: aluno.id,
      arena_id: arenaId,
      amount: finalCreditToRefund,
      type: 'cancellation_credit',
      description: newDescription,
      related_reservation_id: reserva.id,
    }], arenaId);
  }
  
  return { creditRefunded: finalCreditToRefund, pointsDeducted: 0 };
};

// This function is deprecated with the new logic but kept for safety.
export const awardPointsForReservation = awardPointsForCompletedReservation;
