import React, { useState, useMemo } from 'react';
import { FinanceTransaction } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';

type SortableKeys = 'date' | 'description' | 'category' | 'type' | 'amount';
type SortDirection = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: (Partial<FinanceTransaction> & { source?: string, date: Date, description: string, type: 'receita' | 'despesa', amount: number })[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'date', direction: 'desc' });

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...transactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="text-xl font-semibold mb-4">Lançamentos Detalhados</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('date')}>
                <span className="flex items-center">Data {getSortIcon('date')}</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('description')}>
                <span className="flex items-center">Descrição {getSortIcon('description')}</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('category')}>
                <span className="flex items-center">Categoria {getSortIcon('category')}</span>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase cursor-pointer" onClick={() => requestSort('amount')}>
                <span className="flex items-center justify-end">Valor {getSortIcon('amount')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {sortedTransactions.map((t, index) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm">{format(t.date, 'dd/MM/yy')}</td>
                <td className="px-4 py-3 text-sm">{t.description || t.source}</td>
                <td className="px-4 py-3 text-sm"><span className="px-2 py-1 text-xs rounded-full bg-brand-gray-100 dark:bg-brand-gray-700">{t.category || t.source}</span></td>
                <td className={`px-4 py-3 text-sm text-right font-semibold ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="flex items-center justify-end">
                    {t.type === 'receita' ? <TrendingUp className="h-4 w-4 mr-1"/> : <TrendingDown className="h-4 w-4 mr-1"/>}
                    {formatCurrency(t.amount)}
                  </span>
                </td>
              </tr>
            ))}
            {sortedTransactions.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-sm text-brand-gray-500">Nenhum lançamento no período selecionado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
