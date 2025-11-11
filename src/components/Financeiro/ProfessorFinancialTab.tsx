import React, { useMemo, useState } from 'react';
import { Professor, Turma } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, TrendingUp, Clock, Hash, ChevronDown, Calendar, BookOpen } from 'lucide-react';
import { differenceInMinutes, parse, getDay, startOfMonth, endOfMonth, eachDayOfInterval, format, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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

const ProfessorFinancialTab: React.FC<{ professor: Professor; turmas: Turma[] }> = ({ professor, turmas }) => {
  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(format(new Date(), 'yyyy-MM'));

  const monthlyFinancialData = useMemo(() => {
    const professorTurmas = turmas.filter(t => t.professor_id === professor.id);
    const today = new Date();
    
    return Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      const monthStart = startOfMonth(monthDate);
      const monthEnd = isSameMonth(monthDate, today) ? today : endOfMonth(monthDate);
      
      const daysInPeriod = eachDayOfInterval({ start: monthStart, end: monthEnd });

      let totalValue = 0;
      let totalClassesInMonth = 0;
      let totalHoursInMonth = 0;
      let breakdownItems: { id: string, name: string, detail: string, value: number }[] = [];

      switch (professor.payment_type) {
        case 'mensal':
          let hasClassesThisMonth = false;
          professorTurmas.forEach(turma => {
            if (hasClassesThisMonth) return;
            daysInPeriod.forEach(day => {
              if (turma.schedule?.some(s => s.day === getDay(day))) {
                hasClassesThisMonth = true;
              }
            });
          });
          if(hasClassesThisMonth) {
            totalValue = professor.salario_mensal || 0;
          }
          breakdownItems = professorTurmas.map(turma => ({
            id: turma.id,
            name: turma.name,
            detail: 'Salário Fixo Mensal',
            value: 0,
          }));
          break;

        case 'por_aula':
          professorTurmas.forEach(turma => {
            let classesGivenForTurma = 0;
            const schedule = turma.schedule || [];
            daysInPeriod.forEach(day => {
              const scheduleForDay = schedule.find(s => s.day === getDay(day));
              if (scheduleForDay) {
                try {
                  const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
                  const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
                  if (!isNaN(startTime.valueOf()) && !isNaN(endTime.valueOf()) && endTime > startTime) {
                      const durationMinutes = differenceInMinutes(endTime, startTime);
                      const numberOfSlots = Math.floor(durationMinutes / 60);
                      classesGivenForTurma += numberOfSlots;
                  }
                } catch(e) { console.error("Error parsing time for 'por_aula' calculation:", e); }
              }
            });
            const monthlyValueForTurma = classesGivenForTurma * (professor.valor_por_aula || 0);
            totalValue += monthlyValueForTurma;
            totalClassesInMonth += classesGivenForTurma;
            if (classesGivenForTurma > 0) {
              breakdownItems.push({
                id: turma.id,
                name: turma.name,
                detail: `${classesGivenForTurma} aulas dadas no mês`,
                value: monthlyValueForTurma,
              });
            }
          });
          break;
        
        case 'por_hora':
        default:
          professorTurmas.forEach(turma => {
            let hoursWorkedForTurma = 0;
            const schedule = turma.schedule || [];
            daysInPeriod.forEach(day => {
              const scheduleForDay = schedule.find(s => s.day === getDay(day));
              if (scheduleForDay && scheduleForDay.start_time && scheduleForDay.end_time) {
                try {
                  const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
                  const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
                  if (!isNaN(startTime.valueOf()) && !isNaN(endTime.valueOf()) && endTime > startTime) {
                    hoursWorkedForTurma += differenceInMinutes(endTime, startTime) / 60;
                  }
                } catch (e) { console.error("Error parsing time for financial calculation:", e); }
              }
            });
            const monthlyValueForTurma = hoursWorkedForTurma * (professor.valor_hora_aula || 0);
            totalValue += monthlyValueForTurma;
            totalHoursInMonth += hoursWorkedForTurma;
            if (hoursWorkedForTurma > 0) {
              breakdownItems.push({
                id: turma.id,
                name: turma.name,
                detail: `${hoursWorkedForTurma.toFixed(1).replace('.',',')}h trabalhadas no mês`,
                value: monthlyValueForTurma,
              });
            }
          });
          break;
      }
      
      return { monthKey, monthLabel, totalValue, breakdownItems, totalClassesInMonth, totalHoursInMonth };
    });
  }, [professor, turmas]);

  const currentMonthData = monthlyFinancialData[0];

  const getPaymentTypeCard = () => {
    switch (professor.payment_type) {
      case 'por_hora':
        return <StatCard label="Valor por Hora" value={formatCurrency(professor.valor_hora_aula)} icon={Clock} color="text-blue-500" />;
      case 'por_aula':
        return <StatCard label="Valor por Aula" value={formatCurrency(professor.valor_por_aula)} icon={Hash} color="text-blue-500" />;
      case 'mensal':
        return <StatCard label="Salário Fixo Mensal" value={formatCurrency(professor.salario_mensal)} icon={Calendar} color="text-blue-500" />;
      default:
        return null;
    }
  };

  const getMetricCard = () => {
    if (professor.payment_type === 'por_aula') {
        return <StatCard label="Aulas Dadas (Mês)" value={currentMonthData.totalClassesInMonth} icon={BookOpen} color="text-purple-500" />;
    }
    if (professor.payment_type === 'por_hora') {
        return <StatCard label="Horas Trabalhadas (Mês)" value={`${currentMonthData.totalHoursInMonth.toFixed(1)}h`} icon={Clock} color="text-orange-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Ganhos Realizados (Mês Atual)" 
          value={formatCurrency(currentMonthData.totalValue)} 
          icon={TrendingUp} 
          color="text-green-500" 
        />
        {getPaymentTypeCard()}
        {getMetricCard()}
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Histórico de Ganhos</h3>
        <div className="space-y-2">
          {monthlyFinancialData.map(monthData => (
            <div key={monthData.monthKey} className="border-b border-brand-gray-200 dark:border-brand-gray-700 last:border-b-0">
              <button
                onClick={() => setExpandedMonthKey(expandedMonthKey === monthData.monthKey ? null : monthData.monthKey)}
                className="w-full flex justify-between items-center py-4 px-2 text-left hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 rounded-md"
              >
                <span className="font-semibold text-brand-gray-900 dark:text-white capitalize">{monthData.monthLabel}</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(monthData.totalValue)}</span>
                  <ChevronDown className={`h-5 w-5 text-brand-gray-500 transition-transform ${expandedMonthKey === monthData.monthKey ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <AnimatePresence>
                {expandedMonthKey === monthData.monthKey && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 px-2">
                      {monthData.breakdownItems.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-brand-gray-100 dark:bg-brand-gray-700/50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Turma</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Detalhe</th>
                                {professor.payment_type !== 'mensal' && <th className="px-4 py-2 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Valor</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {monthData.breakdownItems.map(item => (
                                <tr key={item.id}>
                                  <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                                  <td className="px-4 py-2 text-sm text-brand-gray-500">{item.detail}</td>
                                  {professor.payment_type !== 'mensal' && <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">{formatCurrency(item.value)}</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-sm text-brand-gray-500 py-4">Nenhuma atividade registrada para este mês.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessorFinancialTab;
