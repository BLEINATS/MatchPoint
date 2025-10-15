import React, { useState, useMemo } from 'react';
import { Torneio } from '../../types';
import Button from '../Forms/Button';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, FileText, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../context/ThemeContext';
import { v4 as uuidv4 } from 'uuid';
import TransactionItemModal from './TransactionItemModal';

interface FinanceiroTabProps {
  torneio: Torneio;
  setTorneio: React.Dispatch<React.SetStateAction<Torneio | null>>;
}

const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ torneio, setTorneio }) => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; description: string; amount: number; } | null>(null);
  const [modalType, setModalType] = useState<'expense' | 'sponsor'>('expense');

  const financialData = useMemo(() => {
    const paidParticipants = torneio.participants?.filter(p => p.payment_status === 'pago') || [];
    
    const getPlayersPerEntry = (participant: Torneio['participants'][0]): number => {
        if (torneio.modality === 'individual') return 1;
        const playerCount = participant.players.filter(p => p.name && p.name.trim()).length;
        if (playerCount === 0) {
            return torneio.modality === 'duplas' ? 2 : (torneio.team_size || 1);
        }
        return playerCount;
    };

    let paidPlayersCount = 0;
    const registrationRevenue = paidParticipants.reduce((total, participant) => {
      const playerCount = getPlayersPerEntry(participant);
      paidPlayersCount += playerCount;
      return total + (playerCount * torneio.registration_fee);
    }, 0);

    const sponsorshipRevenue = torneio.sponsors?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const totalRevenue = registrationRevenue + sponsorshipRevenue;
    const totalExpenses = torneio.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const profit = totalRevenue - totalExpenses;
    return { registrationRevenue, sponsorshipRevenue, totalRevenue, totalExpenses, profit, paidPlayersCount };
  }, [torneio]);

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
    setTorneio(prev => {
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
    setTorneio(prev => prev ? { ...prev, expenses: prev.expenses?.filter(e => e.id !== id) } : null);
  };

  const removeSponsor = (id: string) => {
    setTorneio(prev => prev ? { ...prev, sponsors: prev.sponsors?.filter(s => s.id !== id) } : null);
  };

  const formatLegendCurrency = (value: number): string => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const chartOption = useMemo(() => {
    const data = [
        { value: financialData.registrationRevenue, name: 'Inscrições' },
        { value: financialData.sponsorshipRevenue, name: 'Outras Receitas' },
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
      color: ['#22c55e', '#14b8a6', '#ef4444']
    };
  }, [financialData, theme]);

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label={`Receita (Inscrições)`} value={formatCurrency(financialData.registrationRevenue)} icon={Users} color="text-green-500" />
          <StatCard label="Outras Receitas" value={formatCurrency(financialData.sponsorshipRevenue)} icon={TrendingUp} color="text-teal-500" />
          <StatCard label="Despesas Totais" value={formatCurrency(financialData.totalExpenses)} icon={TrendingDown} color="text-red-500" />
          <StatCard label="Lucro / Prejuízo" value={formatCurrency(financialData.profit)} icon={FileText} color={financialData.profit >= 0 ? "text-blue-500" : "text-red-500"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Despesas Section */}
            <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Despesas do Torneio</h3>
                <Button size="sm" onClick={() => openModal(null, 'expense')}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {torneio.expenses?.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-md">
                    <button onClick={() => openModal(item, 'expense')} className="flex-1 text-left text-sm hover:text-blue-500">{item.description}</button>
                    <div className="flex items-center">
                      <span className="font-semibold text-sm mr-4">{formatCurrency(item.amount)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeExpense(item.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {(!torneio.expenses || torneio.expenses.length === 0) && <p className="text-sm text-center text-brand-gray-500 py-4">Nenhuma despesa lançada.</p>}
              </div>
            </div>

            {/* Outras Receitas Section */}
            <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Outras Receitas (Patrocínios, etc.)</h3>
                <Button size="sm" onClick={() => openModal(null, 'sponsor')}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {torneio.sponsors?.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-md">
                    <button onClick={() => openModal({ ...item, description: item.name }, 'sponsor')} className="flex-1 text-left text-sm hover:text-blue-500">{item.name}</button>
                    <div className="flex items-center">
                      <span className="font-semibold text-sm mr-4">{formatCurrency(item.amount)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeSponsor(item.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {(!torneio.sponsors || torneio.sponsors.length === 0) && <p className="text-sm text-center text-brand-gray-500 py-4">Nenhuma outra receita lançada.</p>}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="text-xl font-semibold mb-4">Visão Geral Financeira</h3>
            <ReactECharts option={chartOption} style={{ height: '300px' }} theme={theme} />
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
  <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${color.replace('text-', 'bg-').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default FinanceiroTab;
