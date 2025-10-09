import React, { useState } from 'react';
import { Aluno, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement, GamificationPointTransaction } from '../../types';
import { Star, Gift, Trophy, CheckCircle, History } from 'lucide-react';
import Button from '../Forms/Button';
import { format } from 'date-fns';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface RewardsTabProps {
  aluno: Aluno | null;
  levels: GamificationLevel[];
  rewards: GamificationReward[];
  achievements: GamificationAchievement[];
  unlockedAchievements: AlunoAchievement[];
  history: GamificationPointTransaction[];
}

const RewardsTab: React.FC<RewardsTabProps> = ({ aluno, levels, rewards, achievements, unlockedAchievements, history }) => {
  const [rewardToRedeem, setRewardToRedeem] = useState<GamificationReward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { addToast } = useToast();
  const { refreshAlunoProfile } = useAuth();

  if (!aluno) {
    return <div className="text-center p-8 text-brand-gray-500">Carregando dados de gamificação...</div>;
  }

  const handleConfirmRedemption = async () => {
    if (!aluno || !rewardToRedeem) return;

    setIsRedeeming(true);
    try {
      // 1. Deduct points
      const { error: rpcError } = await supabase.rpc('add_gamification_points', {
        p_aluno_id: aluno.id,
        p_points_to_add: -rewardToRedeem.points_cost,
        p_description: `Resgate: ${rewardToRedeem.title}`,
      });
      if (rpcError) throw rpcError;

      // 2. Update quantity if limited
      if (rewardToRedeem.quantity !== null && rewardToRedeem.quantity > 0) {
        const { error: updateError } = await supabase
          .from('gamification_rewards')
          .update({ quantity: rewardToRedeem.quantity - 1 })
          .eq('id', rewardToRedeem.id);
        if (updateError) {
          console.error("Erro ao atualizar quantidade da recompensa:", updateError);
        }
      }

      // 3. Add credit if it's a discount reward
      if (rewardToRedeem.type === 'discount' && rewardToRedeem.value && rewardToRedeem.value > 0) {
        const creditValue = rewardToRedeem.value;
        
        const { error: creditError } = await supabase.rpc('add_credit_to_aluno', {
            aluno_id_to_update: aluno.id,
            arena_id_to_check: aluno.arena_id,
            amount_to_add: creditValue
        });
        if (creditError) throw creditError;

        const { error: transactionError } = await supabase.from('credit_transactions').insert({
            aluno_id: aluno.id,
            arena_id: aluno.arena_id,
            amount: creditValue,
            type: 'goodwill_credit',
            description: `Crédito por resgate: ${rewardToRedeem.title}`,
        });
        if (transactionError) throw transactionError;

        if (aluno.profile_id) {
            await supabase.from('notificacoes').insert({
                profile_id: aluno.profile_id,
                arena_id: aluno.arena_id,
                message: `Você resgatou "${rewardToRedeem.title}" e ganhou ${creditValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de crédito!`,
                type: 'gamification_reward',
            });
        }
      } else {
        if (aluno.profile_id) {
            await supabase.from('notificacoes').insert({
              profile_id: aluno.profile_id,
              arena_id: aluno.arena_id,
              message: `Você resgatou "${rewardToRedeem.title}"!`,
              type: 'gamification_reward',
            });
        }
      }

      // 4. Notify admin
      await supabase.from('notificacoes').insert({
        arena_id: aluno.arena_id,
        message: `Cliente ${aluno.name} resgatou a recompensa "${rewardToRedeem.title}".`,
        type: 'gamification_reward',
      });

      addToast({ message: 'Recompensa resgatada com sucesso!', type: 'success' });
      refreshAlunoProfile();
    } catch (error: any) {
      addToast({ message: `Erro ao resgatar: ${error.message}`, type: 'error' });
    } finally {
      setIsRedeeming(false);
      setRewardToRedeem(null);
    }
  };

  const currentLevel = levels.find(l => (aluno.gamification_points || 0) >= l.points_required);
  const currentLevelIndex = currentLevel ? levels.findIndex(l => l.id === currentLevel.id) : -1;
  const nextLevel = currentLevelIndex > 0 ? levels[currentLevelIndex - 1] : null;

  let progressPercentage = 0;
  if (currentLevel) {
      if (nextLevel && nextLevel.points_required > currentLevel.points_required) {
          const pointsInLevel = (aluno.gamification_points || 0) - currentLevel.points_required;
          const pointsForNextLevel = nextLevel.points_required - currentLevel.points_required;
          progressPercentage = (pointsInLevel / pointsForNextLevel) * 100;
      } else {
          progressPercentage = 100;
      }
  }

  return (
    <div className="space-y-8">
      {/* Level and Points */}
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">{currentLevel?.name || 'Iniciante'}</h3>
            <p className="text-sm text-brand-gray-500">Seu nível no MatchPlay Rewards</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-blue-500">{aluno.gamification_points || 0}</p>
            <p className="text-sm text-brand-gray-500">MatchPoints</p>
          </div>
        </div>
        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
          <div className="bg-brand-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
        </div>
        {nextLevel && (
          <p className="text-xs text-right mt-2 text-brand-gray-500">
            Faltam {nextLevel.points_required - (aluno.gamification_points || 0)} pontos para o nível {nextLevel.name}
          </p>
        )}
      </div>

      {/* Rewards */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Gift className="mr-2 h-5 w-5 text-green-500" /> Recompensas para Resgate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.filter(r => r.is_active).map(reward => (
            <div key={reward.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow p-4 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold">{reward.title}</h4>
                <p className="text-sm text-brand-gray-500 mt-1">{reward.description}</p>
                {reward.quantity !== null && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Restam: {reward.quantity}</p>}
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-green-600 dark:text-green-400">{reward.points_cost} Pontos</span>
                <Button 
                  size="sm" 
                  disabled={(aluno.gamification_points || 0) < reward.points_cost || (reward.quantity !== null && reward.quantity <= 0)}
                  onClick={() => setRewardToRedeem(reward)}
                >
                  Resgatar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500" /> Conquistas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map(ach => {
            const isUnlocked = unlockedAchievements.some(ua => ua.achievement_id === ach.id);
            return (
              <div key={ach.id} className={`p-4 rounded-lg text-center border ${isUnlocked ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700' : 'bg-brand-gray-100 dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700'}`}>
                <div className="relative w-12 h-12 mx-auto">
                  <Trophy className={`w-12 h-12 ${isUnlocked ? 'text-yellow-500' : 'text-brand-gray-400'}`} />
                  {isUnlocked && <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 bg-white dark:bg-yellow-900/50 rounded-full text-green-500" />}
                </div>
                <p className="font-semibold text-sm mt-2">{ach.name}</p>
                <p className="text-xs text-brand-gray-500">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* History */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><History className="mr-2 h-5 w-5 text-brand-blue-500" /> Histórico de Pontos</h3>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="max-h-96 overflow-y-auto">
            {history.length > 0 ? (
              <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {history.map(tx => (
                  <li key={tx.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-brand-gray-800 dark:text-brand-gray-200">{tx.description}</p>
                      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                        {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <span className={`font-bold text-lg ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
