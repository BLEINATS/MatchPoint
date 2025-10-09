import React, { useState, useEffect, useCallback } from 'react';
import { Aluno, CreditTransaction } from '../../types';
import { localApi } from '../../lib/localApi';
import { useToast } from '../../context/ToastContext';
import { Loader2, Plus, Minus, DollarSign, History } from 'lucide-react';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';

interface CreditsTabProps {
  aluno: Aluno;
  onDataChange: () => void;
}

const CreditsTab: React.FC<CreditsTabProps> = ({ aluno, onDataChange }) => {
  const { addToast } = useToast();
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creditToAdd, setCreditToAdd] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(aluno.credit_balance || 0);

  const loadCreditData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: historyData } = await localApi.select<CreditTransaction>('credit_transactions', aluno.arena_id);
      const alunoHistory = historyData
        .filter(h => h.aluno_id === aluno.id)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
      setHistory(alunoHistory);

      const { data: alunoData } = await localApi.select<Aluno>('alunos', aluno.arena_id);
      const currentAluno = alunoData.find(a => a.id === aluno.id);
      setCurrentBalance(currentAluno?.credit_balance || 0);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados de crédito: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [aluno.id, aluno.arena_id, addToast]);

  useEffect(() => {
    loadCreditData();
  }, [loadCreditData]);

  const handleCreditAdjustment = async () => {
    const amount = parseFloat(creditToAdd.replace(',', '.')) || 0;
    if (amount === 0 || !adjustmentReason.trim()) {
      addToast({ message: 'Por favor, insira um valor e um motivo.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedBalance = (currentBalance || 0) + amount;
      await localApi.upsert('alunos', [{ ...aluno, credit_balance: updatedBalance }], aluno.arena_id);
      
      await localApi.upsert('credit_transactions', [{
        aluno_id: aluno.id,
        arena_id: aluno.arena_id,
        amount: amount,
        type: 'manual_adjustment',
        description: adjustmentReason,
      }], aluno.arena_id);

      addToast({ message: 'Crédito ajustado com sucesso!', type: 'success' });
      setCreditToAdd('');
      setAdjustmentReason('');
      
      await loadCreditData();
      onDataChange();

    } catch (error: any) {
      addToast({ message: `Erro ao ajustar crédito: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-brand-gray-50 dark:bg-brand-gray-900/50 rounded-lg p-4 flex justify-between items-center border border-brand-gray-200 dark:border-brand-gray-700">
        <div className="flex items-center">
          <DollarSign className="h-8 w-8 text-green-500 mr-4" />
          <div>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Saldo Atual</p>
            <p className="font-bold text-lg text-brand-gray-900 dark:text-white">{formatCurrency(currentBalance)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-3">Ajuste Manual de Crédito</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Valor (R$)" type="text" inputMode="decimal" value={creditToAdd} onChange={(e) => setCreditToAdd(e.target.value)} placeholder="Ex: 50,00 ou -20,00" />
          <Input label="Motivo do Ajuste" value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Ex: Pagamento adiantado" />
        </div>
        <div className="mt-4 text-right">
          <Button onClick={handleCreditAdjustment} isLoading={isSubmitting}>
            {Number(creditToAdd.replace(',', '.')) >= 0 ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
            Ajustar Crédito
          </Button>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3 flex items-center"><History className="h-5 w-5 mr-2 text-brand-blue-500"/> Histórico de Créditos</h4>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
          {history.length > 0 ? history.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-2 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-md">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-brand-gray-500">{format(new Date(tx.created_at!), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <span className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}</span>
            </div>
          )) : (
            <p className="text-sm text-center text-brand-gray-500 py-4">Nenhuma transação de crédito encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditsTab;
