import React, { useState, useMemo } from 'react';
import { Evento } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { DollarSign, CreditCard, Plus, Trash2, Banknote, TrendingUp, TrendingDown, FileText, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../context/ThemeContext';
import { v4 as uuidv4 } from 'uuid';
import TransactionItemModal from '../Torneios/TransactionItemModal';

interface FinanceiroTabProps {
  evento: Evento;
  setEvento: React.Dispatch<React.SetStateAction<Evento | null>>;
}

const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ evento, setEvento }) => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; description: string; amount: number; } | null>(null);
  const [modalType, setModalType] = useState<'expense' | 'sponsor'>('expense');

  const financialData = useMemo(() => {
    const totalPaid = evento.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalRevenue = evento.totalValue || 0;
    const totalDiscount = evento.discount || 0;
    const balanceDue = totalRevenue - totalDiscount - totalPaid;
    const sponsorshipRevenue = evento.sponsors?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const totalExpenses = evento.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const profit = (totalRevenue - totalDiscount) + sponsorshipRevenue - totalExpenses;
    
    return { totalPaid, balanceDue, sponsorshipRevenue, totalExpenses, profit };
  }, [evento]);

  const openModal = (item: any | null, type: 'expense' | 'sponsor') => {
    setModalType(type);
    setEditingItem(item ? {
      id: item.id,
      description: item.description || item.name,
      amount: item.amount,
    } : null);
    setIsModalOpen(true);
  };

  const handleSaveItem = (data: { description: string; amount: number }) => {
    setEvento(prev => {
      if (!prev) return null;
      
      if (modalType === 'expense') {
        const expenses = prev.expenses || [];
        if (editingItem) {
          const updatedExpenses = expenses.map(e => e.id === editingItem.id ? { ...e, ...data } : e);
          return { ...prev, expenses: updatedExpenses };
        } else {
          return { ...prev, expenses: [...expenses, { id: uuidv4(), ...data }] };
        }
      } else { // sponsor
        const sponsors = prev.sponsors || [];
        if (editingItem) {
          const updatedSponsors = sponsors.map(s => s.id === editingItem.id ? { ...s, name: data.description, amount: data.amount } : s);
          return { ...prev, sponsors: updatedSponsors };
        } else {
          return { ...prev, sponsors: [...sponsors, { id: uuidv4(), name: data.description, amount: data.amount }] };
        }
      }
    });
  };

  const removeExpense = (id: string) => {
    setEvento(prev => prev ? { ...prev, expenses: prev.expenses?.filter(e => e.id !== id) } : null);
  };

  const removeSponsor = (id: string) => {
    setEvento(prev => prev ? { ...prev, sponsors: prev.sponsors?.filter(s => s.id !== id) } : null);
  };

  const addPayment = () => {
    const amount = parseFloat(newPayment.amount.replace(',', '.')) || 0;
    if (amount <= 0) return;

    setEvento(prev => {
      if (!prev) return null;
      const newPaymentObj = {
        id: `payment_${Date.now()}`,
        date: new Date().toISOString(),
        amount,
        method: newPayment.method,
      };
      return { ...prev, payments: [...(prev.payments || []), newPaymentObj] };
    });
    setNewPayment({ amount: '', method: 'pix' });
  };
  
  const removePayment = (paymentId: string) => {
    setEvento(prev => {
      if (!prev) return null;
      return { ...prev, payments: prev.payments.filter(p => p.id !== paymentId) };
    });
  };

  const [newPayment, setNewPayment] = useState({ amount: '', method: 'pix' });

  const formatLegendCurrency = (value: number): string => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const chartOption = useMemo(() => {
    const data = [
        { value: evento.totalValue - (evento.discount || 0), name: 'Valor do Evento' },
        { value: financialData.sponsorshipRevenue, name: 'Patrocínios' },
        { value: financialData.totalExpenses, name: 'Despesas' }
    ].filter(item => item.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${formatLegendCurrency(params.value)} (${params.percent}%)`
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        textStyle: { color: theme === 'dark' ? '#cbd5e1' : '#475569' },
        formatter: (name: string) => {
            const item = data.find(d => d.name === name);
            const value = item ? item.value : 0;
            return `${name}: ${formatLegendCurrency(value)}`;
        }
      },
      series: [{
        name: 'Movimentações',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['75%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold', formatter: '{b}\n{c}' }
        },
        labelLine: { show: false },
        data: data,
      }],
      color: ['#3b82f6', '#14b8a6', '#ef4444']
    };
  }, [evento, financialData, theme]);

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Valor Total do Evento" value={formatCurrency(evento.totalValue)} icon={DollarSign} color="text-blue-500" />
          <StatCard label="Total Pago" value={formatCurrency(financialData.totalPaid)} icon={TrendingUp} color="text-green-500" />
          {evento.discount && evento.discount > 0 && (
            <StatCard label="Desconto Aplicado" value={formatCurrency(evento.discount)} icon={Percent} color="text-yellow-500" />
          )}
          <StatCard label="Saldo Devedor" value={formatCurrency(financialData.balanceDue)} icon={TrendingDown} color={financialData.balanceDue > 0 ? "text-red-500" : "text-green-500"} />
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Lançar Novo Pagamento</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Valor (R$)"
              value={newPayment.amount}
              onChange={(e) => setNewPayment(p => ({ ...p, amount: e.target.value }))}
              className="flex-grow"
              type="text"
              inputMode="decimal"
            />
            <select 
              value={newPayment.method}
              onChange={(e) => setNewPayment(p => ({...p, method: e.target.value}))}
              className="form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
            >
              <option value="pix">PIX</option>
              <option value="cartao">Cartão de Crédito</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="transferencia">Transferência</option>
            </select>
            <Button onClick={addPayment}>
              <Plus className="h-4 w-4 mr-2" /> Lançar
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold p-6">Histórico de Pagamentos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Método</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {evento.payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-800 dark:text-brand-gray-200">{format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-800 dark:text-brand-gray-200 capitalize flex items-center">
                      {payment.method === 'pix' && <Banknote className="h-4 w-4 mr-2 text-brand-gray-400" />}
                      {payment.method === 'cartao' && <CreditCard className="h-4 w-4 mr-2 text-brand-gray-400" />}
                      {payment.method === 'dinheiro' && <DollarSign className="h-4 w-4 mr-2 text-brand-gray-400" />}
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" onClick={() => removePayment(payment.id)} className="text-brand-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {evento.payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-brand-gray-500">Nenhum pagamento lançado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <TransactionItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        type={modalType}
      />
    </>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, color: string, icon: React.ElementType }> = ({ label, value, color, icon: Icon }) => (
  <div className="bg-brand-gray-50 dark:bg-brand-gray-900/50 rounded-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${color.replace('text-', 'bg-').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
        <p className={`text-2xl font-bold text-brand-gray-900 dark:text-white`}>{value}</p>
      </div>
    </div>
  </div>
);

export default FinanceiroTab;
