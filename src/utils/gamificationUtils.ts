import { localApi } from '../lib/localApi';
import { Reserva, Aluno, GamificationSettings, GamificationAchievement } from '../types';

export const processReservationCompletion = async (reserva: Reserva, aluno: Aluno, arenaId: string) => {
  try {
    // 1. Fetch gamification settings
    const { data: settingsData } = await localApi.select<GamificationSettings>('gamification_settings', arenaId);
    const settings = settingsData?.[0];

    if (!settings || !settings.is_enabled) {
      console.log('Gamification is disabled for this arena.');
      return;
    }

    let totalPointsToAdd = 0;
    const descriptions: string[] = [];

    // 2. Calculate points for the reservation
    if (settings.points_per_reservation > 0) {
      totalPointsToAdd += settings.points_per_reservation;
      descriptions.push('Reserva completada');
    }
    if (settings.points_per_real > 0 && reserva.total_price) {
      const pointsFromPrice = Math.floor(reserva.total_price * settings.points_per_real);
      totalPointsToAdd += pointsFromPrice;
      descriptions.push(`Valor da reserva (${reserva.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
    }

    // Check for first reservation achievement
    const { data: allReservations } = await localApi.select<Reserva>('reservas', arenaId);
    const { data: allAchievements } = await localApi.select<GamificationAchievement>('gamification_achievements', arenaId);
    const { data: unlockedAchievements } = await localApi.select<any>('aluno_achievements', arenaId);

    const firstReservationAchievement = allAchievements.find(a => a.type === 'first_reservation');
    const hasUnlockedFirst = unlockedAchievements.some((ua: any) => ua.aluno_id === aluno.id && ua.achievement_id === firstReservationAchievement?.id);
    const isFirstReservation = allReservations.filter(r => (r.profile_id === aluno.profile_id || r.clientName === aluno.name) && r.status === 'confirmada').length <= 1;

    if (firstReservationAchievement && !hasUnlockedFirst && isFirstReservation) {
        totalPointsToAdd += firstReservationAchievement.points_reward;
        descriptions.push(`Conquista: ${firstReservationAchievement.name}`);
        await localApi.upsert('aluno_achievements', [{
            aluno_id: aluno.id,
            achievement_id: firstReservationAchievement.id,
            unlocked_at: new Date().toISOString()
        }], arenaId);
    }

    if (totalPointsToAdd === 0) {
      console.log('No points to add for this reservation.');
      return;
    }

    // 3. Update Aluno's points
    const updatedPoints = (aluno.gamification_points || 0) + totalPointsToAdd;
    await localApi.upsert('alunos', [{ ...aluno, gamification_points: updatedPoints }], arenaId);

    // 4. Create transaction record
    await localApi.upsert('gamification_point_transactions', [{
      aluno_id: aluno.id,
      arena_id: arenaId,
      points: totalPointsToAdd,
      type: 'reservation_completed',
      description: descriptions.join(' + '),
      related_reservation_id: reserva.id,
    }], arenaId);

    console.log(`Added ${totalPointsToAdd} points to ${aluno.name}`);

  } catch (error) {
    console.error("Error processing gamification for reservation:", error);
  }
};
