import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aluno, CreditTransaction, GamificationPointTransaction, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement } from '../../types';
import { X, CreditCard, Gift, Banknote } from 'lucide-react';
import Button from '../Forms/Button';
import RewardsTab from './RewardsTab';
import { formatCurrency } from '../../utils/formatters';
import { format, addDays, isBefore } from 'date-fns';
import PaymentsHistoryTab from './PaymentsHistoryTab';
import { useAuth } from '../../context/AuthContext';

const ClientCreditsTab: React.FC<{balance: number, history: CreditTransaction[]}> = ({balance, history}) => {
    const { selectedArenaContext: arena } = useAuth();
    
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Meus Créditos</h3>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Saldo de Crédito</h3>
                    <CreditCard className="h-6 w-6" />
                </div>
                {(balance ?? 0) > 0 ? (
                    <p className="text-4xl font-bold mt-2">{formatCurrency(balance)}</p>
                ) : (
                    <p className="text-4xl font-bold mt-2">0 créditos</p>
                )}
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

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'credits' | 'gamification' | 'payments';
  aluno: Aluno | null;
  creditHistory: CreditTransaction[];
  gamificationHistory: GamificationPointTransaction[];
  paymentHistory: { id: string; date: string; description: string; amount: number }[];
  levels: GamificationLevel[];
  rewards: GamificationReward[];
  achievements: GamificationAchievement[];
  unlockedAchievements: AlunoAchievement[];
  gamificationEnabled: boolean;
  onDataChange: () => void;
  completedReservationsCount: number;
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  aluno,
  creditHistory,
  gamificationHistory,
  paymentHistory,
  levels,
  rewards,
  achievements,
  unlockedAchievements,
  gamificationEnabled,
  onDataChange,
  completedReservationsCount,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'credits', label: 'Créditos', icon: CreditCard },
    { id: 'gamification', label: 'Gamificação', icon: Gift },
    { id: 'payments', label: 'Pagamentos', icon: Banknote },
  ];

  const renderContent = () => {
    if (!aluno) return <p>Carregando...</p>;
    switch (activeTab) {
      case 'credits':
        return <ClientCreditsTab balance={aluno.credit_balance || 0} history={creditHistory} />;
      case 'gamification':
        return gamificationEnabled ? (
          <RewardsTab
            aluno={aluno}
            levels={levels}
            rewards={rewards}
            achievements={achievements}
            unlockedAchievements={unlockedAchievements}
            history={gamificationHistory}
            onDataChange={onDataChange}
            completedReservationsCount={completedReservationsCount}
          />
        ) : <p>O sistema de gamificação não está ativo para esta arena.</p>;
      case 'payments':
        return <PaymentsHistoryTab history={paymentHistory} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Meu Progresso</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>

            <div className="border-b border-brand-gray-200 dark:border-brand-gray-700">
              <nav className="-mb-px flex justify-around sm:justify-start sm:space-x-4 sm:px-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'credits' | 'gamification' | 'payments')}
                    className={`whitespace-nowrap py-4 px-4 sm:px-2 border-b-2 font-medium text-sm flex-grow sm:flex-grow-0 flex items-center justify-center transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                        : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:hover:text-brand-gray-300'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileDetailModal;
