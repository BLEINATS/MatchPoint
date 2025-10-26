import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Star, CheckCircle } from 'lucide-react';
import { Arena, Plan, Subscription } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPlanId: string) => void;
  arena: Arena | null;
  plans: Plan[];
  currentSubscription: Subscription | null;
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ isOpen, onClose, onConfirm, arena, plans, currentSubscription }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  useEffect(() => {
    if (isOpen && currentSubscription) {
      setSelectedPlanId(currentSubscription.plan_id);
    } else if (isOpen) {
      setSelectedPlanId('');
    }
  }, [isOpen, currentSubscription]);

  const handleConfirm = () => {
    if (selectedPlanId && selectedPlanId !== currentSubscription?.plan_id) {
      onConfirm(selectedPlanId);
    }
  };
  
  if (!arena) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Alterar Plano da Arena</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Selecione o novo plano de assinatura para a arena <strong>{arena.name}</strong>.
              </p>
              <div className="space-y-3">
                {plans.filter(p => p.is_active).map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button 
                      key={plan.id} 
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all relative ${
                        isSelected 
                          ? 'border-brand-blue-500 bg-blue-100 dark:bg-brand-blue-500/20' 
                          : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'
                      }`}
                    >
                      {isSelected && (
                          <CheckCircle className="h-5 w-5 text-brand-blue-500 absolute top-3 right-3" />
                      )}
                      <p className={`font-bold text-lg ${isSelected ? 'text-brand-blue-800 dark:text-brand-blue-200' : 'text-brand-gray-900 dark:text-white'}`}>{plan.name}</p>
                      <div className="flex justify-between items-end mt-1">
                          <ul className="text-xs text-brand-gray-500 dark:text-brand-gray-400 space-y-1">
                            {plan.features.slice(0, 2).map((feat, i) => <li key={i} className="flex items-center"><Star className="h-3 w-3 mr-1.5 text-yellow-400"/>{feat}</li>)}
                            {plan.features.length > 2 && <li className="italic">e mais...</li>}
                          </ul>
                          <p className={`text-xl font-bold ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(plan.price)}
                            <span className="text-sm font-normal">/mês</span>
                          </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedPlanId || selectedPlanId === currentSubscription?.plan_id}>
                <Save className="h-4 w-4 mr-2"/> Salvar Alteração
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangePlanModal;
