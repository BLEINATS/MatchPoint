import { localApi } from '../lib/localApi';
import { Reserva, Aluno, GamificationSettings, GamificationAchievement, GamificationPointTransaction, CreditTransaction } from '../types';
import { formatCurrency } from './formatters';
import { differenceInHours } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

export const awardPointsForNewReservation = async (reserva: Reserva, alunoId: string, arenaId: string) => {
  try {
    const { data: settingsData } = await localApi.select<GamificationSettings>('gamification_settings', arenaId);
    const settings = settingsData?.[0];

    if (!settings || !settings.is_enabled) return;
    
    const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
    const aluno = allAlunos.find(a => a.id === alunoId);
    if (!aluno) return;

    let totalPointsToAdd = 0;
    const descriptions: string[] = [];

    if (settings.points_per_reservation > 0) {
      totalPointsToAdd += settings.points_per_reservation;
      descriptions.push('Nova reserva');
    }
    if (settings.points_per_real > 0 && reserva.total_price) {
      const pointsFromPrice = Math.floor(reserva.total_price * settings.points_per_real);
      if (pointsFromPrice > 0) {
        totalPointsToAdd += pointsFromPrice;
        descriptions.push(`Valor da reserva (${formatCurrency(reserva.total_price)})`);
      }
    }

    const { data: allReservations } = await localApi.select<Reserva>('reservas', arenaId);
    const { data: allAchievements } = await localApi.select<GamificationAchievement>('gamification_achievements', arenaId);
    const { data: unlockedAchievements } = await localApi.select<any>('aluno_achievements', arenaId);

    const firstReservationAchievement = allAchievements.find(a => a.type === 'first_reservation');
    const hasUnlockedFirst = unlockedAchievements.some((ua: any) => ua.aluno_id === aluno.id && ua.achievement_id === firstReservationAchievement?.id);
    const userReservationsCount = allReservations.filter(r => (r.profile_id === aluno.profile_id || r.clientName === aluno.name) && r.status !== 'cancelada').length;

    if (firstReservationAchievement && !hasUnlockedFirst && userReservationsCount <= 1) {
        totalPointsToAdd += firstReservationAchievement.points_reward;
        descriptions.push(`Conquista: ${firstReservationAchievement.name}`);
        await localApi.upsert('aluno_achievements', [{
            aluno_id: aluno.id,
            achievement_id: firstReservationAchievement.id,
            unlocked_at: new Date().toISOString()
        }], arenaId);
    }

    if (totalPointsToAdd === 0) return;

    const updatedPoints = (aluno.gamification_points || 0) + totalPointsToAdd;
    await localApi.upsert('alunos', [{ ...aluno, gamification_points: updatedPoints }], arenaId);

    await localApi.upsert('gamification_point_transactions', [{
      aluno_id: aluno.id,
      arena_id: arenaId,
      points: totalPointsToAdd,
      type: 'reservation_created',
      description: descriptions.join(' + '),
      related_reservation_id: reserva.id,
    }], arenaId);

  } catch (error) {
    console.error("Error awarding points for new reservation:", error);
  }
};

export const processCancellation = async (reserva: Reserva, arenaId: string): Promise<{ creditRefunded: number; pointsDeducted: number }> => {
  const profileId = reserva.profile_id;
  if (!profileId) return { creditRefunded: 0, pointsDeducted: 0 };

  const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
  const aluno = allAlunos.find(a => a.profile_id === profileId);
  if (!aluno) return { creditRefunded: 0, pointsDeducted: 0 };

  // 1. Handle Points Deduction
  const { data: transactions } = await localApi.select<GamificationPointTransaction>('gamification_point_transactions', arenaId);
  const existingDeduction = transactions.find(t => t.related_reservation_id === reserva.id && t.type === 'cancellation_deduction');
  
  let pointsToDeduct = 0;
  if (!existingDeduction) {
    pointsToDeduct = transactions
        .filter(t => t.related_reservation_id === reserva.id && t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);
  }

  // 2. Handle Credit Refund
  const hoursUntilReservation = differenceInHours(parseDateStringAsLocal(`${reserva.date}T${reserva.start_time}`), new Date());
  let creditToRefund = 0;
  let refundReason = "Cancelamento com menos de 12h";
  if (hoursUntilReservation >= 24) {
      creditToRefund = reserva.total_price || 0;
      refundReason = "Cancelamento com +24h";
  } else if (hoursUntilReservation >= 12) {
      creditToRefund = (reserva.total_price || 0) * 0.5;
      refundReason = "Cancelamento entre 12h e 24h";
  }

  // 3. Update Aluno record
  let hasChanges = false;
  const updatedAluno = { ...aluno };

  if (pointsToDeduct > 0) {
      updatedAluno.gamification_points = Math.max(0, (updatedAluno.gamification_points || 0) - pointsToDeduct);
      hasChanges = true;
  }
  if (creditToRefund > 0) {
      updatedAluno.credit_balance = (updatedAluno.credit_balance || 0) + creditToRefund;
      hasChanges = true;
  }

  if (hasChanges) {
      await localApi.upsert('alunos', [updatedAluno], arenaId);
  }

  // 4. Create transaction logs
  if (pointsToDeduct > 0) {
      await localApi.upsert('gamification_point_transactions', [{
          aluno_id: aluno.id,
          arena_id: arenaId,
          points: -pointsToDeduct,
          type: 'cancellation_deduction',
          description: `Dedução por cancelamento da reserva #${reserva.id.substring(0, 8)}`,
          related_reservation_id: reserva.id,
      }], arenaId);
  }
  if (creditToRefund > 0) {
      await localApi.upsert('credit_transactions', [{
          aluno_id: aluno.id,
          arena_id: arenaId,
          amount: creditToRefund,
          type: 'cancellation_credit',
          description: `Crédito (${refundReason})`,
          related_reservation_id: reserva.id,
      }], arenaId);
  }

  return { creditRefunded: creditToRefund, pointsDeducted: pointsToDeduct };
};

export const reverseReservationPoints = async (reserva: Reserva, arenaId: string): Promise<number> => {
    // This function is now deprecated in favor of processCancellation.
    // The logic has been moved into processCancellation.
    return 0;
};

export const processReservationCompletion = async (reserva: Reserva, aluno: Aluno, arenaId: string) => {
    // This logic is now handled at reservation creation.
    return;
};
