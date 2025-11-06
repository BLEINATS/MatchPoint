import React, { useMemo } from 'react';
import { AtletaAluguel, Reserva } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { isBefore } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface AtletaFinanceiroTabProps {
  atleta: AtletaAluguel;
  reservas: Reserva[];
}

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ElementType, color: string }> = ({ label, value, icon: Icon, color }) => (
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

const AtletaFinanceiroTab: React.FC<AtletaFinanceiroTabProps> = ({ atleta, reservas }) => {
  const financialData = useMemo(() => {
    let aReceber = 0;
    let recebido = 0;
    const transactions: { id: string, description: string, amount: number, date: string, status: 'recebido' | 'a_receber' }[] = [];

    reservas.forEach(reserva => {
      if (reserva.atleta_aceite_status === 'aceito' && reserva.status !== 'cancelada') {
        const isCompleted = isBefore(parseDateStringAsLocal(`${reserva.date}T${reserva.end_time}`), new Date());
        
        if (isCompleted) {
          const comissao = atleta.taxa_hora * (1 - (atleta.comissao_arena / 100));
          // Mock payment status
          const isPaid = Math.random() > 0.3; 
          
          if (isPaid) {
            recebido += comissao;
            transactions.push({ id: reserva.id, description: `Jogo com ${reserva.clientName}`, amount: comissao, date: reserva.date, status: 'recebido' });
          } else {
            aReceber += comissao;
            transactions.push({ id: reserva.id, description: `Jogo com ${reserva.clientName}`, amount: comissao, date: reserva.date, status: 'a_receber' });
          }
        }
      }
    });

    return {
      aReceber,
      recebido,
      transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [atleta, reservas]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Total a Receber" value={formatCurrency(financialData.aReceber)} icon={TrendingUp} color="text-yellow-500" />
        <StatCard label="Total Recebido (Mês)" value={formatCurrency(financialData.recebido)} icon={TrendingDown} color="text-green-500" />
      </div>
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold p-6">Extrato de Ganhos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Descrição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Valor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
              {financialData.transactions.length > 0 ? financialData.transactions.map(t => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-gray-900 dark:text-white">{t.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(t.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 'recebido' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                      {t.status === 'recebido' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {t.status === 'recebido' ? 'Recebido' : 'A Receber'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-brand-gray-500">Nenhuma transação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtletaFinanceiroTab;
