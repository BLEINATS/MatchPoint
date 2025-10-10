import React, { useMemo } from 'react';
import { Professor, Turma } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Star, TrendingUp, DollarSign } from 'lucide-react';
import { startOfMonth, subMonths, format, isWithinInterval, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessorPerformanceTabProps {
  professor: Professor;
  turmas: Turma[];
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

const ProfessorPerformanceTab: React.FC<ProfessorPerformanceTabProps> = ({ professor, turmas }) => {
  const performanceData = useMemo(() => {
    const professorTurmas = turmas.filter(t => t.professor_id === professor.id);
    const totalAulas = professorTurmas.length;
    const receitaTotal = professorTurmas.reduce((sum, t) => sum + ((t.student_ids?.length || 0) * (t.monthly_fee || 0)), 0);
    
    const monthlyStats = Array.from({ length: 3 }).map((_, i) => {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const turmasNoMes = professorTurmas.filter(t => {
        const startDate = new Date(t.start_date);
        return isWithinInterval(startDate, { start: monthStart, end: monthEnd });
      });

      const aulasNoMes = turmasNoMes.length;
      const receitaNoMes = turmasNoMes.reduce((sum, t) => sum + ((t.student_ids?.length || 0) * (t.monthly_fee || 0)), 0);
      
      return {
        monthLabel: format(month, 'MMMM yyyy', { locale: ptBR }),
        aulas: aulasNoMes,
        receita: receitaNoMes,
      };
    });

    return {
      totalAulas,
      receitaTotal,
      avaliacaoMedia: 4.8, // Mocked
      monthlyStats,
    };
  }, [professor, turmas]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total de Turmas Ativas" value={performanceData.totalAulas} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Receita Total Gerada" value={formatCurrency(performanceData.receitaTotal)} icon={DollarSign} color="text-blue-500" />
        <StatCard label="Avaliação Média" value={`${performanceData.avaliacaoMedia} ⭐`} icon={Star} color="text-yellow-500" />
      </div>
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold p-6">Estatísticas Mensais</h3>
        <div className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          {performanceData.monthlyStats.map(stat => (
            <div key={stat.monthLabel} className="p-4 flex justify-between items-center">
              <span className="font-semibold capitalize">{stat.monthLabel}</span>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-sm text-brand-gray-500">Aulas</p>
                  <p className="font-bold">{stat.aulas}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-gray-500">Receita</p>
                  <p className="font-bold">{formatCurrency(stat.receita)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessorPerformanceTab;
