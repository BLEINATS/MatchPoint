import React, { useState, useMemo } from 'react';
import { Aluno, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement, GamificationPointTransaction, RedeemedVoucher, GamificationSettings } from '../../types';
import { Star, Gift, Trophy, CheckCircle, History } from 'lucide-react';
import Button from '../Forms/Button';
import { format, addDays } from 'date-fns';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { supabaseApi } from '../../lib/supabaseApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

interface RewardsTabProps {
  aluno: Aluno | null;
  levels: GamificationLevel[];
  rewards: GamificationReward[];
  achievements: GamificationAchievement[];
  unlockedAchievements: AlunoAchievement[];
  history: GamificationPointTransaction[];
  completedReservationsCount?: number;
  onDataChange: () => void;
}

const generateVoucherCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const RewardsTab: React.FC<RewardsTabProps> = ({ aluno, levels, rewards, achievements, unlockedAchievements, history, completedReservationsCount = 0, onDataChange }) => {
  const [rewardToRedeem, setRewardToRedeem] = useState<GamificationReward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { addToast } = useToast();
  const { selectedArenaContext: arena } = useAuth();

  const currentLevel = useMemo(() => {
    if (!aluno || !levels || levels.length === 0) return null;
    const sortedLevels = [...levels].sort((a, b) => b.points_required - a.points_required);
    return sortedLevels.find(l => (aluno.gamification_points || 0) >= l.points_required) || null;
  }, [aluno, levels]);

  const handleConfirmRedemption = async () => {
    if (!aluno || !rewardToRedeem || !arena) return;

    setIsRedeeming(true);
    try {
      const { data: settingsData } = await supabaseApi.select<GamificationSettings>('gamification_settings', arena.id);
      const settings = settingsData?.[0];

      const { data: allAlunos } = await supabaseApi.select<Aluno>('alunos', arena.id);
      const currentAlunoState = allAlunos.find(a => a.id === aluno.id);
      if (!currentAlunoState) throw new Error("Aluno não encontrado para atualizar.");

      const currentPoints = currentAlunoState.gamification_points || 0;
      if (currentPoints < rewardToRedeem.points_cost) {
        throw new Error("Pontos insuficientes para resgatar esta recompensa.");
      }

      // 1. Deduct points from user
      const updatedAlunoData = {
        ...currentAlunoState,
        gamification_points: currentPoints - rewardToRedeem.points_cost,
      };
      
      // 2. Create point transaction for deduction
      await supabaseApi.upsert('gamification_point_transactions', [{
        aluno_id: aluno.id,
        arena_id: arena.id,
        points: -rewardToRedeem.points_cost,
        type: 'reward_redemption',
        description: `Resgate: ${rewardToRedeem.title}`,
      }], arena.id);

      // 3. Handle reward type
      if (rewardToRedeem.type === 'discount' || rewardToRedeem.type === 'free_hour') {
        let creditValue = 0;
        let creditDescription = `Crédito por resgate: ${rewardToRedeem.title}`;

        if (rewardToRedeem.type === 'discount' && rewardToRedeem.value && rewardToRedeem.value > 0) {
          creditValue = rewardToRedeem.value;
        } else if (rewardToRedeem.type === 'free_hour') {
          const standardHourPrice = 90; // This is a magic number, should be improved later
          creditValue = standardHourPrice * (rewardToRedeem.value || 1);
          creditDescription = `Crédito (Hora Grátis): ${rewardToRedeem.title}`;
        }
        
        if (creditValue > 0) {
          updatedAlunoData.credit_balance = (updatedAlunoData.credit_balance || 0) + creditValue;
          await supabaseApi.upsert('credit_transactions', [{
              aluno_id: aluno.id,
              arena_id: arena.id,
              amount: creditValue,
              type: 'goodwill_credit',
              description: creditDescription,
          }], arena.id);
        }
      } else if (rewardToRedeem.type === 'free_item') {
        let expires_at: string | null = null;
        if (settings?.voucher_expiration_days && settings.voucher_expiration_days > 0) {
          expires_at = addDays(new Date(), settings.voucher_expiration_days).toISOString();
        }

        const newVoucher: Omit<RedeemedVoucher, 'id' | 'created_at'> = {
          arena_id: arena.id,
          aluno_id: aluno.id,
          code: generateVoucherCode(),
          reward_id: rewardToRedeem.id,
          reward_title: rewardToRedeem.title,
          product_id: rewardToRedeem.product_id || null,
          item_description: rewardToRedeem.item_description || null,
          status: 'pendente',
          redeemed_at: null,
          expires_at: expires_at,
        };
        await supabaseApi.upsert('redeemed_vouchers', [newVoucher], arena.id);
      }
      
      // Save updated student data (points and/or credit balance)
      await supabaseApi.upsert('alunos', [updatedAlunoData], arena.id);

      // 4. Update reward quantity if applicable
      if (rewardToRedeem.quantity !== null && rewardToRedeem.quantity > 0) {
        await supabaseApi.upsert('gamification_rewards', [{ ...rewardToRedeem, quantity: rewardToRedeem.quantity - 1 }], arena.id);
      }

      // 5. Send notification
      if (aluno.profile_id) {
        await supabaseApi.upsert('notificacoes', [{
            profile_id: aluno.profile_id,
            arena_id: arena.id,
            message: `Você resgatou "${rewardToRedeem.title}"!`,
            type: 'gamification_reward',
        }], arena.id);
      }
      
      await onDataChange();
      addToast({ message: 'Recompensa resgatada com sucesso! Verifique "Meus Vouchers" no seu perfil.', type: 'success' });

    } catch (error: any) {
      addToast({ message: `Erro ao resgatar: ${error.message}`, type: 'error' });
    } finally {
      setIsRedeeming(false);
      setRewardToRedeem(null);
    }
  };

  const getAchievementProgress = (achievement: GamificationAchievement) => {
    const targetCountMap: Record<string, number> = {
      'first_reservation': 1,
      'loyalty_10': 10,
      'loyalty_50': 50,
      'loyalty_100': 100,
    };
    const targetCount = targetCountMap[achievement.type];
    if (!targetCount) return { progress: 0, text: achievement.description };

    const currentCount = completedReservationsCount || 0;
    const progress = Math.min((currentCount / targetCount) * 100, 100);
    const text = `Complete ${targetCount} reservas (${currentCount}/${targetCount})`;
    
    return { progress, text };
  };

  if (!aluno) {
    return <div className="text-center p-8 text-brand-gray-500">Carregando dados de gamificação...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Gift className="mr-2 h-6 w-6 text-green-500" /> Recompensas para Resgate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.filter(r => r.is_active).map(reward => {
            const userPoints = aluno.gamification_points || 0;
            const canAfford = userPoints >= reward.points_cost;
            const pointsNeeded = reward.points_cost - userPoints;
            
            return (
              <div key={reward.id} className="bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg shadow p-4 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold">{reward.title}</h4>
                  <p className="text-sm text-brand-gray-500 mt-1">{reward.description}</p>
                  {reward.quantity !== null && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Restam: {reward.quantity}</p>}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">{reward.points_cost} Pontos</span>
                  {canAfford ? (
                    <Button size="sm" disabled={(reward.quantity !== null && reward.quantity <= 0)} onClick={() => setRewardToRedeem(reward)}>Resgatar</Button>
                  ) : (
                    <div className="text-right">
                      <Button size="sm" disabled>Resgatar</Button>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Faltam {pointsNeeded} pts</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Trophy className="mr-2 h-6 w-6 text-yellow-500" /> Conquistas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map(ach => {
            const isUnlocked = unlockedAchievements.some(ua => ua.achievement_id === ach.id);
            const { progress, text } = getAchievementProgress(ach);
            return (
              <div key={ach.id} className={`p-4 rounded-lg text-center border ${isUnlocked ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700' : 'bg-brand-gray-100 dark:bg-brand-gray-800/50 border-brand-gray-200 dark:border-brand-gray-700'}`}>
                <div className="relative w-12 h-12 mx-auto">
                  <Trophy className={`w-12 h-12 ${isUnlocked ? 'text-yellow-500' : 'text-brand-gray-400'}`} />
                  {isUnlocked && <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 bg-white dark:bg-yellow-900/50 rounded-full text-green-500" />}
                </div>
                <p className="font-semibold text-sm mt-2">{ach.name}</p>
                <p className="text-xs text-brand-gray-500 min-h-[30px]">{isUnlocked ? ach.description : text}</p>
                {!isUnlocked && (
                  <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-1.5 mt-2">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><History className="mr-2 h-6 w-6 text-brand-blue-500" /> Histórico de Pontos</h3>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="max-h-96 overflow-y-auto">
            {history.length > 0 ? (
              <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {history.map(tx => (
                  <li key={tx.id} className="p-4 flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">{tx.description}</p>
                      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                        {tx.created_at ? format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm') : ''}
                      </p>
                    </div>
                    <span className={`font-bold text-base whitespace-nowrap ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.points >= 0 ? '+' : ''}{tx.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-sm text-brand-gray-500">Nenhuma transação de pontos encontrada.</p>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={!!rewardToRedeem}
        onClose={() => setRewardToRedeem(null)}
        onConfirm={handleConfirmRedemption}
        title="Confirmar Resgate"
        message={
            rewardToRedeem && (
                <p>
                    Você tem certeza que deseja usar{' '}
                    <strong>{rewardToRedeem.points_cost} pontos</strong> para resgatar a recompensa{' '}
                    <strong>"{rewardToRedeem.title}"</strong>?
                </p>
            )
        }
        confirmText={isRedeeming ? 'Resgatando...' : 'Sim, Resgatar'}
        icon={<Gift className="h-10 w-10 text-green-500" />}
      />
    </div>
  );
};

export default RewardsTab;
