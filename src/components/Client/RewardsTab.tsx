import React, { useState } from 'react';
import { Aluno, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement, GamificationPointTransaction } from '../../types';
import { Star, Gift, Trophy, CheckCircle, History } from 'lucide-react';
import Button from '../Forms/Button';
import { format } from 'date-fns';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { localApi } from '../../lib/localApi';
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
      const { data: allAlunos } = await localApi.select<Aluno>('alunos', aluno.arena_id);
      const currentAlunoState = allAlunos.find(a => a.id === aluno.id);
      if (!currentAlunoState) throw new Error("Aluno não encontrado para atualizar.");

      const updatedAlunoData = { ...currentAlunoState };

      const currentPoints = updatedAlunoData.gamification_points || 0;
      if (currentPoints < rewardToRedeem.points_cost) {
        throw new Error("Pontos insuficientes para resgatar esta recompensa.");
      }
      updatedAlunoData.gamification_points = currentPoints - rewardToRedeem.points_cost;

      let creditValue = 0;
      let creditDescription = `Crédito por resgate: ${rewardToRedeem.title}`;

      if (rewardToRedeem.type === 'discount' && rewardToRedeem.value && rewardToRedeem.value > 0) {
        creditValue = rewardToRedeem.value;
      } else if (rewardToRedeem.type === 'free_hour') {
        const standardHourPrice = 90; // Preço padrão de uma hora, pode ser buscado das configurações da arena no futuro
        creditValue = standardHourPrice * (rewardToRedeem.value || 1);
        creditDescription = `Crédito (1 Hora Grátis): ${rewardToRedeem.title}`;
      }
      
      if (creditValue > 0) {
        updatedAlunoData.credit_balance = (updatedAlunoData.credit_balance || 0) + creditValue;
      }
      
      await localApi.upsert('alunos', [updatedAlunoData], aluno.arena_id);
      
      await localApi.upsert('gamification_point_transactions', [{
        aluno_id: aluno.id,
        arena_id: aluno.arena_id,
        points: -rewardToRedeem.points_cost,
        type: 'reward_redemption',
        description: `Resgate: ${rewardToRedeem.title}`,
      }], aluno.arena_id);

      if (creditValue > 0) {
        await localApi.upsert('credit_transactions', [{
            aluno_id: aluno.id,
            arena_id: aluno.arena_id,
            amount: creditValue,
            type: 'goodwill_credit',
            description: creditDescription,
        }], aluno.arena_id);
      }

      if (rewardToRedeem.quantity !== null && rewardToRedeem.quantity > 0) {
        await localApi.upsert('gamification_rewards', [{ ...rewardToRedeem, quantity: rewardToRedeem.quantity - 1 }], aluno.arena_id);
      }

      if (aluno.profile_id) {
        const notificationMessage = creditValue > 0
          ? `Você resgatou "${rewardToRedeem.title}" e ganhou ${formatCurrency(creditValue)} de crédito!`
          : `Você resgatou "${rewardToRedeem.title}"!`;
        
        await localApi.upsert('notificacoes', [{
            profile_id: aluno.profile_id,
            arena_id: aluno.arena_id,
            message: notificationMessage,
            type: 'gamification_reward',
        }], aluno.arena_id);
      }

      addToast({ message: 'Recompensa resgatada com sucesso!', type: 'success' });
      await refreshAlunoProfile();

    } catch (error: any) {
      addToast({ message: `Erro ao resgatar: ${error.message}`, type: 'error' });
    } finally {
      setIsRedeeming(false);
      setRewardToRedeem(null);
    }
  };

  const currentLevel = levels.sort((a, b) => b.points_required - a.points_required).find(l => (aluno.gamification_points || 0) >= l.points_required);
  const nextLevel = levels.sort((a, b) => a.points_required - b.points_required).find(l => (aluno.gamification_points || 0) < l.points_required);

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
            <h4 className="text-lg font-bold">{currentLevel?.name || 'Iniciante'}</h4>
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
        <h4 className="text-lg font-semibold mb-4 flex items-center"><Gift className="mr-2 h-5 w-5 text-green-500" /> Recompensas para Resgate</h4>
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
        <h4 className="text-lg font-semibold mb-4 flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500" /> Conquistas</h4>
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
        <h4 className="text-lg font-semibold mb-4 flex items-center"><History className="mr-2 h-5 w-5 text-brand-blue-500" /> Histórico de Pontos</h4>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="max-h-96 overflow-y-auto">
            {history.length > 0 ? (
              <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {history.map(tx => (
                  <li key={tx.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-brand-gray-800 dark:text-brand-gray-200">{tx.description}</p>
                      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                        {tx.created_at ? format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm') : ''}
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
