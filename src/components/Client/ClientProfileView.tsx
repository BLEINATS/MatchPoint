import React from 'react';
import { Aluno, CreditTransaction, GamificationPointTransaction, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement, AtletaAluguel, Profile } from '../../types';
import AtletasTab from './AtletasTab';
import RewardsTab from './RewardsTab';
import { formatCurrency } from '../../utils/formatters';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';
import PaymentMethodsTab from './PaymentMethodsTab';
import { useAuth } from '../../context/AuthContext';

interface ClientProfileViewProps {
  aluno: Aluno | null;
  profile: Profile | null;
  creditHistory: CreditTransaction[];
  gamificationHistory: GamificationPointTransaction[];
  levels: GamificationLevel[];
  rewards: GamificationReward[];
  achievements: GamificationAchievement[];
  unlockedAchievements: AlunoAchievement[];
  gamificationEnabled: boolean;
  atletas: AtletaAluguel[];
  onViewProfile: (atleta: AtletaAluguel) => void;
  onProfileUpdate: (updatedProfile: Partial<Profile>) => void;
  completedReservationsCount: number;
}

const ClientProfileView: React.FC<ClientProfileViewProps> = ({
  aluno,
  profile,
  creditHistory,
  gamificationHistory,
  levels,
  rewards,
  achievements,
  unlockedAchievements,
  gamificationEnabled,
  atletas,
  onViewProfile,
  onProfileUpdate,
  completedReservationsCount
}) => {
  if (!profile) return null;
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-white">Meu Perfil</h2>
      
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <CreditsTab balance={aluno?.credit_balance || 0} history={creditHistory} />
      </div>

      {gamificationEnabled && (
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <RewardsTab 
            aluno={aluno}
            levels={levels}
            rewards={rewards}
            achievements={achievements}
            unlockedAchievements={unlockedAchievements}
            history={gamificationHistory}
            completedReservationsCount={completedReservationsCount}
          />
        </div>
      )}

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <PaymentMethodsTab profile={profile} onProfileUpdate={onProfileUpdate} />
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <AtletasTab atletas={atletas} onViewProfile={onViewProfile} />
      </div>
    </div>
  );
};

const CreditsTab: React.FC<{balance: number, history: CreditTransaction[]}> = ({balance, history}) => {
    const { selectedArenaContext: arena } = useAuth();
    
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Meus Créditos</h3>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Saldo de Crédito</h3>
                    <CreditCard className="h-6 w-6" />
                </div>
                <p className="text-4xl font-bold mt-2">{formatCurrency(balance)}</p>
                <p className="text-sm opacity-80 mt-1">Use seu crédito para abater o valor de novas reservas.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-3">Histórico de Transações</h4>
                {history.length > 0 ? (
                    <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700 max-h-60 overflow-y-auto pr-2">
                        {history.map(item => {
                            const isPositiveCredit = item.amount > 0;
                            let expirationDate: Date | null = null;
                            if (isPositiveCredit && arena?.credit_expiration_days && item.created_at) {
                                expirationDate = addDays(new Date(item.created_at), arena.credit_expiration_days);
                            }
                            const isExpired = expirationDate && isBefore(expirationDate, new Date());

                            return (
                                <li key={item.id} className={`py-3 flex justify-between items-start gap-2 ${isExpired ? 'opacity-50' : ''}`}>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm truncate ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.amount > 0 ? 'Crédito Adicionado' : 'Crédito Utilizado'}</p>
                                    <p className="text-xs text-brand-gray-500 truncate">{item.description}</p>
                                    <p className="text-xs text-brand-gray-400 mt-1">{item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : ''}</p>
                                    {expirationDate && (
                                        <p className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-brand-gray-400'}`}>
                                            {isExpired ? 'Expirou em:' : 'Expira em:'} {format(expirationDate, 'dd/MM/yyyy')}
                                        </p>
                                    )}
                                  </div>
                                  <p className={`text-base font-bold text-right ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}> {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)} </p>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-sm text-brand-gray-500 py-8">Nenhuma transação de crédito encontrada.</p>
                )}
            </div>
        </div>
    );
};

export default ClientProfileView;
