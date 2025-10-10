import React, { useMemo } from 'react';
import { Professor, Turma } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { differenceInMinutes, parse } from 'date-fns';

interface ProfessorFinancialTabProps {
  professor: Professor;
  turmas: Turma[];
}

const StatCard: React.FC<{ label: string, value: string, icon: React.ElementType, color: string }> = ({ label, value, icon: Icon, color }) => (
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

const ProfessorFinancialTab: React.FC<ProfessorFinancialTabProps> = ({ professor, turmas }) => {
  const financialData = useMemo(() => {
    let totalAReceber = 0;
    const comissoes: { id: string, turmaName: string, valor: number, data: string }[] = [];

    turmas.forEach(turma => {
      if (turma.professor_id === professor.id && professor.valor_hora_aula) {
        try {
          const startTime = parse(turma.start_time, 'HH:mm', new Date());
          const endTime = parse(turma.end_time, 'HH:mm', new Date());
          const durationMinutes = differenceInMinutes(endTime, startTime);
          const durationHours = durationMinutes / 60;
          
          if (durationHours > 0) {
            const comissao = durationHours * professor.valor_hora_aula;
            totalAReceber += comissao;
            comissoes.push({
              id: turma.id,
              turmaName: turma.name,
              valor: comissao,
              data: turma.start_date,
            });
          }
        } catch (e) {
          console.error("Error calculating class duration:", e);
        }
      }
    });

    return {
      totalAReceber,
      jaRecebido: 0, // Simulação
      comissoes,
    };
  }, [professor, turmas]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Total a Receber (Estimado)" value={formatCurrency(financialData.totalAReceber)} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Já Recebido (Este Mês)" value={formatCurrency(financialData.jaRecebido)} icon={TrendingDown} color="text-yellow-500" />
      </div>
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold p-6">Comissões Geradas por Aula</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Turma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Data Referência</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Valor Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
              {financialData.comissoes.length > 0 ? financialData.comissoes.map(c => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-gray-900 dark:text-white">{c.turmaName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{c.data}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(c.valor)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-brand-gray-500">Nenhuma comissão registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfessorFinancialTab;
