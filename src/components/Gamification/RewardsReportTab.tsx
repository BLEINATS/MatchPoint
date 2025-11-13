import React, { useState, useMemo } from 'react';
import { RedeemedVoucher, Aluno, Product, GamificationReward } from '../../types';
import { format, endOfDay, subMonths, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart2, Gift, Users, ArrowDown, ArrowUp } from 'lucide-react';
import Input from '../Forms/Input';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface RewardsReportTabProps {
  vouchers: RedeemedVoucher[];
  alunos: Aluno[];
  products: Product[];
  rewards: GamificationReward[];
}

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="bg-brand-gray-50 dark:bg-brand-gray-900/50 p-4 rounded-lg">
    <div className="flex items-center">
      <div className="p-3 rounded-lg bg-brand-blue-100 dark:bg-brand-blue-500/20 mr-4">
        <Icon className="h-6 w-6 text-brand-blue-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

type FormattedVoucher = {
  id: string;
  itemName: string;
  alunoName: string;
  status: 'Pendente' | 'Resgatado' | 'Expirado';
  pointsCost: number;
  solicitadoEm: Date;
  entregueEm: Date | null;
};

const RewardsReportTab: React.FC<RewardsReportTabProps> = ({ vouchers, alunos, products, rewards }) => {
  const [filters, setFilters] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof FormattedVoucher; direction: 'asc' | 'desc' }>({ key: 'solicitadoEm', direction: 'desc' });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getItemName = (voucher: RedeemedVoucher) => {
    if (voucher.product_id) {
      const product = products.find(p => p.id === voucher.product_id);
      return product?.name || voucher.reward_title;
    }
    return voucher.item_description || voucher.reward_title;
  };

  const formattedAndFilteredVouchers = useMemo(() => {
    const start = parseDateStringAsLocal(filters.startDate);
    const end = endOfDay(parseDateStringAsLocal(filters.endDate));

    const formatted = vouchers.map(v => {
      const isExpired = v.expires_at && isPast(new Date(v.expires_at)) && v.status === 'pendente';
      let statusLabel: 'Pendente' | 'Resgatado' | 'Expirado' = 'Pendente';
      if (isExpired) {
        statusLabel = 'Expirado';
      } else if (v.status === 'resgatado') {
        statusLabel = 'Resgatado';
      }

      return {
        id: v.id,
        itemName: getItemName(v),
        alunoName: alunos.find(a => a.id === v.aluno_id)?.name || 'Desconhecido',
        status: statusLabel,
        pointsCost: rewards.find(r => r.id === v.reward_id)?.points_cost || 0,
        solicitadoEm: new Date(v.created_at),
        entregueEm: v.redeemed_at ? new Date(v.redeemed_at) : null,
      };
    });

    const filtered = formatted.filter(v => {
      const dateMatch = v.solicitadoEm >= start && v.solicitadoEm <= end;
      const statusMatch = filters.status === 'all' || v.status.toLowerCase() === filters.status;
      return dateMatch && statusMatch;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [vouchers, alunos, products, rewards, filters, sortConfig]);

  const summaryStats = useMemo(() => {
    const totalRedeemed = formattedAndFilteredVouchers.length;
    const totalPointsSpent = formattedAndFilteredVouchers.reduce((sum, v) => sum + v.pointsCost, 0);
    
    const itemCounts = formattedAndFilteredVouchers.reduce((acc, v) => {
        acc[v.itemName] = (acc[v.itemName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    return { totalRedeemed, totalPointsSpent, topItems };
  }, [formattedAndFilteredVouchers]);

  const requestSort = (key: keyof FormattedVoucher) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof FormattedVoucher) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const getStatusBadge = (status: 'Pendente' | 'Resgatado' | 'Expirado') => {
    const styles = {
      Pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      Resgatado: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      Expirado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total de Vouchers" value={summaryStats.totalRedeemed} icon={Gift} />
        <StatCard label="Total de Pontos Gastos" value={summaryStats.totalPointsSpent.toLocaleString('pt-BR')} icon={Users} />
        <div className="bg-brand-gray-50 dark:bg-brand-gray-900/50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">Top 3 Itens Resgatados</h4>
          <ul className="space-y-1">
            {summaryStats.topItems.map((item, index) => (
              <li key={index} className="flex justify-between text-sm">
                <span className="font-semibold text-brand-gray-800 dark:text-white truncate">{item.name}</span>
                <span className="text-brand-gray-600 dark:text-brand-gray-400">{item.count}x</span>
              </li>
            ))}
            {summaryStats.topItems.length === 0 && <p className="text-xs text-center text-brand-gray-500">Nenhum dado.</p>}
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Filtros do Relatório</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Data Inicial" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          <Input label="Data Final" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800">
              <option value="all">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="resgatado">Resgatado</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('itemName')}>Item {getSortIcon('itemName')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('alunoName')}>Cliente {getSortIcon('alunoName')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('pointsCost')}>Custo (Pontos) {getSortIcon('pointsCost')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('solicitadoEm')}>Data Solicitação {getSortIcon('solicitadoEm')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('entregueEm')}>Data Entrega {getSortIcon('entregueEm')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {formattedAndFilteredVouchers.map(v => (
              <tr key={v.id}>
                <td className="px-4 py-3 text-sm font-medium text-brand-gray-900 dark:text-white">{v.itemName}</td>
                <td className="px-4 py-3 text-sm">{v.alunoName}</td>
                <td className="px-4 py-3 text-sm">{getStatusBadge(v.status)}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold">{v.pointsCost}</td>
                <td className="px-4 py-3 text-sm text-right">{format(v.solicitadoEm, 'dd/MM/yy HH:mm', { locale: ptBR })}</td>
                <td className="px-4 py-3 text-sm text-right">{v.entregueEm ? format(v.entregueEm, 'dd/MM/yy HH:mm', { locale: ptBR }) : '-'}</td>
              </tr>
            ))}
            {formattedAndFilteredVouchers.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-sm text-brand-gray-500">Nenhum registro encontrado para os filtros selecionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RewardsReportTab;
