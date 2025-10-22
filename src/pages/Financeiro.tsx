import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, FileText, Loader2, Filter } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Reserva, FinanceTransaction } from '../types';
import Button from '../components/Forms/Button';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import FinancialChart from '../components/Financeiro/FinancialChart';
import TransactionModal from '../components/Financeiro/TransactionModal';

const Financeiro: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const [reservasRes, transactionsRes] = await Promise.all([
        localApi.select<Reserva>('reservas', arena.id),
        localApi.select<FinanceTransaction>('finance_transactions', arena.id),
      ]);
      setReservas(reservasRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados financeiros: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveTransaction = async (transaction: Omit<FinanceTransaction, 'id' | 'arena_id' | 'created_at'> | FinanceTransaction) => {
    if (!arena) return;
    try {
      await localApi.upsert('finance_transactions', [{ ...transaction, arena_id: arena.id }], arena.id);
      addToast({ message: 'Transação salva com sucesso!', type: 'success' });
      await loadData();
      setIsModalOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar transação: ${error.message}`, type: 'error' });
    }
  };
  
  const handleDeleteTransaction = async (id: string) => {
    if (!arena || !window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await localApi.delete('finance_transactions', [id], arena.id);
      addToast({ message: 'Transação excluída com sucesso.', type: 'success' });
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir transação: ${error.message}`, type: 'error' });
    }
  };

  const financialData = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const allTransactions = [
      ...reservas
        .filter(r => r.status === 'confirmada' || r.status === 'realizada')
        .map(r => ({
          id: `res-${r.id}`,
          date: r.date,
          description: `Reserva: ${r.clientName} (${r.start_time})`,
          amount: r.total_price || 0,
          type: 'receita' as 'receita',
          category: 'Reservas',
        })),
      ...transactions,
    ];

    const currentMonthTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= currentMonthStart && tDate <= endOfMonth(new Date());
    });
    
    const receitaTotal = currentMonthTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesasTotais = currentMonthTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const contasAReceber = reservas.filter(r => r.status === 'confirmada' && r.payment_status === 'pendente').reduce((sum, r) => sum + (r.total_price || 0), 0);
    
    return {
      receitaTotal,
      despesasTotais,
      contasAReceber,
      lucroLiquido: receitaTotal - despesasTotais,
      allTransactions: allTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [reservas, transactions]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Painel Financeiro</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Acompanhe a saúde financeira da sua arena.</p>
            </div>
            <Button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Receita do Mês" value={formatCurrency(financialData.receitaTotal)} icon={TrendingUp} color="text-green-500" />
              <StatCard label="Despesas do Mês" value={formatCurrency(financialData.despesasTotais)} icon={TrendingDown} color="text-red-500" />
              <StatCard label="Contas a Receber" value={formatCurrency(financialData.contasAReceber)} icon={DollarSign} color="text-yellow-500" />
              <StatCard label="Lucro Líquido" value={formatCurrency(financialData.lucroLiquido)} icon={FileText} color="text-blue-500" />
            </div>

            <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 mb-8">
              <h3 className="text-xl font-semibold mb-4">Fluxo de Caixa Mensal</h3>
              <FinancialChart transactions={financialData.allTransactions} />
            </div>

            <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold mb-4">Últimas Transações</h3>
              <TransactionList 
                transactions={financialData.allTransactions.slice(0, 20)} 
                onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </>
        )}
      </div>
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, value: string, icon: React.ElementType, color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
      <Icon className={`h-6 w-6 ${color}`} />
    </div>
    <p className="text-3xl font-bold text-brand-gray-900 dark:text-white mt-2">{value}</p>
  </div>
);

const TransactionList: React.FC<{ transactions: FinanceTransaction[], onEdit: (t: FinanceTransaction) => void, onDelete: (id: string) => void }> = ({ transactions, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Data</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Descrição</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Categoria</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Valor</th>
          <th className="relative px-4 py-3"><span className="sr-only">Ações</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
        {transactions.map(t => (
          <tr key={t.id}>
            <td className="px-4 py-3 text-sm">{format(new Date(t.date), 'dd/MM/yy')}</td>
            <td className="px-4 py-3 text-sm">{t.description}</td>
            <td className="px-4 py-3 text-sm"><span className="px-2 py-1 text-xs rounded-full bg-brand-gray-100 dark:bg-brand-gray-700">{t.category}</span></td>
            <td className={`px-4 py-3 text-sm text-right font-semibold ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
            <td className="px-4 py-3 text-right">
              {!t.id.startsWith('res-') && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)} className="text-red-500">Excluir</Button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Financeiro;
