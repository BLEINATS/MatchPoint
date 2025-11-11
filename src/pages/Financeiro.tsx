import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, FileText, Loader2, Filter, BarChart2, List, Handshake, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Reserva, FinanceTransaction, Professor, AtletaAluguel } from '../types';
import Button from '../components/Forms/Button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import FinancialChart from '../components/Financeiro/FinancialChart';
import TransactionModal from '../components/Financeiro/TransactionModal';
import AtletaPaymentsTab from '../components/Financeiro/AtletaPaymentsTab';
import ProfessorPaymentsTab from '../components/Financeiro/ProfessorPaymentsTab';

type TabType = 'overview' | 'transactions' | 'athlete_payments' | 'professor_payments';

const TransactionCard: React.FC<{ transaction: FinanceTransaction, onEdit: (t: FinanceTransaction) => void, onDelete: (id: string) => void }> = ({ transaction, onEdit, onDelete }) => (
  <div className="p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg space-y-3 border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brand-gray-900 dark:text-white truncate">{transaction.description}</p>
        <p className="text-sm text-brand-gray-500">{transaction.category}</p>
      </div>
      <div className={`text-lg font-bold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(transaction.amount)}
      </div>
    </div>
    <div className="flex justify-between items-center text-xs text-brand-gray-500 dark:text-brand-gray-400">
      <span>{format(new Date(transaction.date), 'dd/MM/yy')}</span>
      {!transaction.id.startsWith('res-') && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)}>Editar</Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(transaction.id)} className="text-red-500">Excluir</Button>
        </div>
      )}
    </div>
  </div>
);

const TransactionList: React.FC<{ transactions: FinanceTransaction[], onEdit: (t: FinanceTransaction) => void, onDelete: (id: string) => void }> = ({ transactions, onEdit, onDelete }) => (
  <div>
    {/* Mobile View */}
    <div className="md:hidden space-y-3">
      {transactions.map(t => (
        <TransactionCard key={t.id} transaction={t} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>

    {/* Desktop View */}
    <div className="hidden md:block overflow-x-auto">
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
                    <Button variant="ghost" size="sm" onClick={() => onEdit(t)}><Edit className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)} className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {transactions.length === 0 && (
      <p className="text-center py-8 text-sm text-brand-gray-500">Nenhuma transação encontrada.</p>
    )}
  </div>
);

const Financeiro: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atletas, setAtletas] = useState<AtletaAluguel[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const [reservasRes, transactionsRes, profsRes, atletasRes, turmasRes] = await Promise.all([
        localApi.select<Reserva>('reservas', arena.id),
        localApi.select<FinanceTransaction>('finance_transactions', arena.id),
        localApi.select<Professor>('professores', arena.id),
        localApi.select<AtletaAluguel>('atletas_aluguel', arena.id),
        localApi.select<any>('turmas', arena.id),
      ]);
      setReservas(reservasRes.data || []);
      setTransactions(transactionsRes.data || []);
      setProfessores(profsRes.data || []);
      setAtletas(atletasRes.data || []);
      setTurmas(turmasRes.data || []);
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
        .filter(r => (r.status === 'confirmada' || r.status === 'realizada') && r.payment_status === 'pago')
        .map(r => ({
          id: `res-${r.id}`,
          date: r.date,
          description: `Reserva: ${r.clientName} (${r.start_time})`,
          amount: r.total_price || 0,
          type: 'receita' as 'receita',
          category: 'Reservas',
          created_at: r.created_at,
        })),
      ...transactions,
    ];

    const currentMonthTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= currentMonthStart && tDate <= endOfMonth(new Date());
    });
    
    const receitaTotal = currentMonthTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesasTotais = currentMonthTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const contasAReceber = reservas.filter(r => (r.status === 'confirmada' || r.status === 'aguardando_pagamento') && r.payment_status === 'pendente').reduce((sum, r) => sum + (r.total_price || 0), 0);
    
    return {
      receitaTotal,
      despesasTotais,
      contasAReceber,
      lucroLiquido: receitaTotal - despesasTotais,
      allTransactions: allTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [reservas, transactions]);

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
    { id: 'transactions', label: 'Transações', icon: List },
    { id: 'athlete_payments', label: 'Pagamentos de Atletas', icon: Handshake },
    { id: 'professor_payments', label: 'Pagamentos de Professores', icon: Handshake },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Receita do Mês" value={formatCurrency(financialData.receitaTotal)} icon={TrendingUp} color="text-green-500" />
              <StatCard label="Despesas do Mês" value={formatCurrency(financialData.despesasTotais)} icon={TrendingDown} color="text-red-500" />
              <StatCard label="Contas a Receber" value={formatCurrency(financialData.contasAReceber)} icon={DollarSign} color="text-yellow-500" />
              <StatCard label="Lucro Líquido" value={formatCurrency(financialData.lucroLiquido)} icon={FileText} color="text-blue-500" />
            </div>
            <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold mb-4">Fluxo de Caixa Mensal</h3>
              <FinancialChart transactions={financialData.allTransactions} />
            </div>
          </>
        );
      case 'transactions':
        return (
          <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="text-xl font-semibold mb-4">Últimas Transações</h3>
            <TransactionList 
              transactions={financialData.allTransactions} 
              onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              onDelete={handleDeleteTransaction}
            />
          </div>
        );
      case 'athlete_payments':
        return <AtletaPaymentsTab 
                  reservas={reservas} 
                  profissionais={[...professores, ...atletas]} 
                  onDataChange={loadData} 
                />;
      case 'professor_payments':
        return <ProfessorPaymentsTab
                  professores={professores}
                  turmas={turmas}
                  transactions={transactions}
                  onDataChange={loadData}
                />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
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
        
        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400'}`}>
                <tab.icon className="mr-2 h-5 w-5" />{tab.label}
              </button>
            ))}
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
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

export default Financeiro;
