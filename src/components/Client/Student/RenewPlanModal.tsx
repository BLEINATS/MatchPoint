import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, GraduationCap, CheckCircle, Info } from 'lucide-react';
import { Aluno, PlanoAula } from '../../../types';
import Button from '../../Forms/Button';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { supabaseApi } from '../../../lib/supabaseApi';
import { format } from 'date-fns';

interface RenewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno;
  planos: PlanoAula[];
  onDataChange: () => void;
}

const RenewPlanModal: React.FC<RenewPlanModalProps> = ({ isOpen, onClose, aluno, planos, onDataChange }) => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>(aluno.plan_id || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const activePlanos = useMemo(() => planos.filter(p => p.is_active), [planos]);
  
  const handleConfirm = async () => {
    if (!selectedPlanoId || !arena) {
        addToast({ message: 'Selecione um plano para continuar.', type: 'error' });
        return;
    }
    
    const selectedPlano = activePlanos.find(p => p.id === selectedPlanoId);
    if (!selectedPlano) {
        addToast({ message: 'Plano selecionado não é válido.', type: 'error' });
        return;
    }

    setIsProcessing(true);
    try {
        const updatedAluno: Aluno = {
            ...aluno,
            plan_id: selectedPlano.id,
            plan_name: selectedPlano.name,
            monthly_fee: selectedPlano.price,
            aulas_restantes: selectedPlano.num_aulas,
            join_date: format(new Date(), 'yyyy-MM-dd'), // Reset join date on renewal
            last_credit_reset_date: new Date().toISOString(),
        };
        await supabaseApi.upsert('alunos', [updatedAluno], arena.id);

        await supabaseApi.upsert('finance_transactions', [{
            arena_id: arena.id,
            description: `Pagamento/Renovação Plano: ${selectedPlano.name} - ${aluno.name}`,
            amount: selectedPlano.price,
            type: 'receita',
            category: 'Mensalidade',
            date: format(new Date(), 'yyyy-MM-dd'),
        }], arena.id);
        
        addToast({ message: `Plano "${selectedPlano.name}" ativado com sucesso!`, type: 'success' });
        onDataChange();
        onClose();

    } catch (error: any) {
        addToast({ message: `Erro ao renovar plano: ${error.message}`, type: 'error' });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-brand-blue-500" />
                Renovar / Trocar Plano
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Selecione um novo plano para continuar suas aulas.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>O plano é uma mensalidade pré-paga. A renovação é automática todo mês, sempre no mesmo dia da sua assinatura.</p>
              </div>
              <div className="space-y-3">
                {activePlanos.map(plano => {
                  const isSelected = selectedPlanoId === plano.id;
                  return (
                    <button 
                      key={plano.id} 
                      onClick={() => setSelectedPlanoId(plano.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all relative ${
                        isSelected 
                          ? 'border-brand-blue-500 bg-blue-100 dark:bg-brand-blue-500/20' 
                          : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'
                      }`}
                    >
                      {isSelected && (
                          <CheckCircle className="h-5 w-5 text-brand-blue-500 absolute top-3 right-3" />
                      )}
                      <p className={`font-bold text-lg ${isSelected ? 'text-brand-blue-800 dark:text-brand-blue-200' : 'text-brand-gray-900 dark:text-white'}`}>{plano.name}</p>
                      <p className={`text-sm mt-1 ${isSelected ? 'text-brand-blue-700 dark:text-brand-blue-300' : 'text-brand-gray-500 dark:text-brand-gray-400'}`}>{plano.description}</p>
                      <div className="flex justify-between items-end mt-2">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-brand-blue-600 dark:text-brand-blue-300' : 'text-brand-gray-500 dark:text-brand-gray-400'}`}>
                            {plano.num_aulas === null ? 'Aulas Ilimitadas' : `${plano.num_aulas} aulas`} / {plano.duration_type}
                          </span>
                          <p className={`text-xl font-bold ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(plano.price)}
                          </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedPlanoId || isProcessing} isLoading={isProcessing}>
                <Save className="h-4 w-4 mr-2"/> Confirmar Renovação
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RenewPlanModal;
