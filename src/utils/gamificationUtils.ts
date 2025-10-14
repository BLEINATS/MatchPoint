import { localApi } from '../lib/localApi';
import { Reserva, Aluno, GamificationSettings, GamificationPointTransaction, CreditTransaction } from '../types';
import { formatCurrency } from './formatters';
import { differenceInHours } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

/**
 * Awards points for a completed reservation.
 * Checks for existing transactions to prevent awarding points multiple times.
 */
export const awardPointsForCompletedReservation = async (reserva: Reserva, arenaId: string) => {
  if (!reserva.profile_id || !reserva.total_price || reserva.total_price <= 0 || reserva.status !== 'confirmada') {
    return;
  }

  try {
    const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
    const aluno = allAlunos.find(a => a.profile_id === reserva.profile_id);
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
export const processCancellation = async (reserva: Reserva, arenaId: string): Promise<{ creditRefunded: number; pointsDeducted: number }> => {
  const profileId = reserva.profile_id;
  if (!profileId || !reserva.total_price || reserva.total_price <= 0) {
    return { creditRefunded: 0, pointsDeducted: 0 };
  }

  const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
  const aluno = allAlunos.find(a => a.profile_id === profileId);
  if (!aluno) return { creditRefunded: 0, pointsDeducted: 0 };

  // Calculate credit refund based on cancellation policy
  const hoursUntilReservation = differenceInHours(parseDateStringAsLocal(`${reserva.date}T${reserva.start_time}`), new Date());
  let creditToRefund = 0;
  let refundReason = "Cancelamento com menos de 12h";

  if (hoursUntilReservation >= 24) {
    creditToRefund = reserva.total_price || 0;
    refundReason = "Reembolso integral (+24h)";
  } else if (hoursUntilReservation >= 12) {
    creditToRefund = (reserva.total_price || 0) * 0.5;
    refundReason = "Reembolso de 50% (12-24h)";
  }

  // If there's credit to refund, update the student's balance and log the transaction
  if (creditToRefund > 0) {
    const updatedAluno = { ...aluno };
    updatedAluno.credit_balance = (updatedAluno.credit_balance || 0) + creditToRefund;
    await localApi.upsert('alunos', [updatedAluno], arenaId);

    await localApi.upsert('credit_transactions', [{
      aluno_id: aluno.id,
      arena_id: arenaId,
      amount: creditToRefund,
      type: 'cancellation_credit',
      description: `Crédito (${refundReason})`,
      related_reservation_id: reserva.id,
    }], arenaId);
  }
  
  // No points are deducted because they are only awarded after the reservation is completed.
  return { creditRefunded: creditToRefund, pointsDeducted: 0 };
};

// This function is deprecated with the new logic but kept for safety.
export const awardPointsForReservation = awardPointsForCompletedReservation;
