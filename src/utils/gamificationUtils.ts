import { localApi } from '../lib/localApi';
import { Reserva, Aluno, GamificationSettings, GamificationPointTransaction, CreditTransaction, Quadra, GamificationAchievement, AlunoAchievement } from '../types';
import { formatCurrency } from './formatters';
import { differenceInHours, format, isBefore } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

/**
 * Awards points for a completed reservation and checks for any newly unlocked achievements.
 */
export const awardPointsForCompletedReservation = async (reserva: Reserva, arenaId: string) => {
  if (!reserva.profile_id) return;

  try {
    const { data: settingsData } = await localApi.select<GamificationSettings>('gamification_settings', arenaId);
    const settings = settingsData?.[0];
    if (!settings || !settings.is_enabled) return;

    const { data: allAlunos } = await localApi.select<Aluno>('alunos', arenaId);
    let aluno = allAlunos.find(a => a.profile_id === reserva.profile_id);
    if (!aluno) return;

    const { data: transactions } = await localApi.select<GamificationPointTransaction>('gamification_point_transactions', arenaId);
    const alreadyAwarded = transactions.some(t => t.related_reservation_id === reserva.id && (t.type === 'reservation_completed'));
    if (alreadyAwarded) return;

    let totalPointsToAdd = 0;
    const newPointTransactions: Omit<GamificationPointTransaction, 'id' | 'created_at'>[] = [];

    // Points for the reservation itself
    if (settings.points_per_reservation > 0) {
      totalPointsToAdd += settings.points_per_reservation;
      newPointTransactions.push({
        aluno_id: aluno.id,
        arena_id: arenaId,
        points: settings.points_per_reservation,
        type: 'reservation_completed',
        description: 'Reserva concluída',
        related_reservation_id: reserva.id,
        related_achievement_id: null,
      });
    }
    if (settings.points_per_real > 0 && reserva.total_price) {
      const pointsFromPrice = Math.floor(reserva.total_price * settings.points_per_real);
      if (pointsFromPrice > 0) {
        totalPointsToAdd += pointsFromPrice;
        newPointTransactions.push({
          aluno_id: aluno.id,
          arena_id: arenaId,
          points: pointsFromPrice,
          type: 'reservation_completed',
          description: `Valor da reserva (${formatCurrency(reserva.total_price)})`,
          related_reservation_id: reserva.id,
          related_achievement_id: null,
        });
      }
    }

    // Check for achievements
    const { data: allUserReservas } = await localApi.select<Reserva>('reservas', arenaId);
    const userCompletedReservas = allUserReservas.filter(r => 
        r.profile_id === aluno?.profile_id && 
        (r.status === 'confirmada' || r.status === 'realizada')
    );
    const completedCount = userCompletedReservas.length;

    const { data: achievements } = await localApi.select<GamificationAchievement>('gamification_achievements', arenaId);
    const { data: unlockedAchievementsData } = await localApi.select<AlunoAchievement>('aluno_achievements', arenaId);
    const unlockedForUser = unlockedAchievementsData.filter(ua => ua.aluno_id === aluno!.id);
    const unlockedIds = new Set(unlockedForUser.map(ua => ua.achievement_id));

    const newUnlockedAchievements: Omit<AlunoAchievement, 'unlocked_at'>[] = [];

    for (const ach of achievements) {
      if (unlockedIds.has(ach.id)) continue;

      let unlocked = false;
      switch (ach.type) {
        case 'first_reservation':
          if (completedCount === 1) unlocked = true;
          break;
        case 'loyalty_10':
          if (completedCount >= 10) unlocked = true;
          break;
        case 'loyalty_50':
          if (completedCount >= 50) unlocked = true;
          break;
        case 'loyalty_100':
          if (completedCount >= 100) unlocked = true;
          break;
      }

      if (unlocked) {
        totalPointsToAdd += ach.points_reward;
        newPointTransactions.push({
          aluno_id: aluno.id,
          arena_id: arenaId,
          points: ach.points_reward,
          type: 'achievement_unlocked',
          description: `Conquista: ${ach.name}`,
          related_achievement_id: ach.id,
          related_reservation_id: null,
        });
        newUnlockedAchievements.push({ aluno_id: aluno.id, achievement_id: ach.id });
      }
    }

    if (totalPointsToAdd > 0) {
      const updatedPoints = (aluno.gamification_points || 0) + totalPointsToAdd;
      await localApi.upsert('alunos', [{ ...aluno, gamification_points: updatedPoints }], arenaId);
      await localApi.upsert('gamification_point_transactions', newPointTransactions, arenaId);
      if (newUnlockedAchievements.length > 0) {
        await localApi.upsert('aluno_achievements', newUnlockedAchievements, arenaId);
      }
    }
  } catch (error) {
    console.error("Error awarding points/achievements:", error);
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
