import React, { useMemo } from 'react';
import { Professor, Turma, Aluno } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Star, TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react';
import { startOfMonth, subMonths, format, endOfMonth, eachDayOfInterval, getDay, parse, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface ProfessorPerformanceTabProps {
  professor: Professor;
  turmas: Turma[];
  alunos: Aluno[];
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

const ProfessorPerformanceTab: React.FC<ProfessorPerformanceTabProps> = ({ professor, turmas, alunos }) => {
  const performanceData = useMemo(() => {
    const professorTurmas = turmas.filter(t => t.professor_id === professor.id);
    const totalTurmasAtivas = professorTurmas.length;

    const uniqueStudentIds = new Set<string>();
    professorTurmas.forEach(turma => {
        (turma.matriculas || []).forEach(matricula => {
            matricula.student_ids.forEach(studentId => uniqueStudentIds.add(studentId));
        });
    });
    const totalAlunos = uniqueStudentIds.size;

    const avgRating = professor.avg_rating || (professor.ratings && professor.ratings.length > 0
        ? professor.ratings.reduce((sum, r) => sum + r.rating, 0) / professor.ratings.length
        : 0);

    const monthlyStats = Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(new Date(), i);
      const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const daysInPeriod = eachDayOfInterval({ start: monthStart, end: monthEnd });

      let receitaMensal = 0;
      let aulasDadas = 0;

      const turmasNoMes = professorTurmas.filter(turma => {
          const turmaStart = parseDateStringAsLocal(turma.start_date);
          const turmaEnd = turma.end_date ? parseDateStringAsLocal(turma.end_date) : null;
          if (isAfter(turmaStart, monthEnd)) return false;
          if (turmaEnd && isBefore(turmaEnd, monthStart)) return false;
          return true;
      });

      if (professor.payment_type === 'mensal') {
        let hasClassesThisMonth = false;
        turmasNoMes.forEach(turma => {
            daysInPeriod.forEach(day => {
                const scheduleForDay = turma.schedule?.find(s => s.day === getDay(day));
                if (scheduleForDay) {
                    const classDate = new Date(day);
                    if (isAfter(classDate, parseDateStringAsLocal(turma.start_date)) && (!turma.end_date || isBefore(classDate, parseDateStringAsLocal(turma.end_date)))) {
                        aulasDadas++;
                        hasClassesThisMonth = true;
                    }
                }
            });
        });
        if (hasClassesThisMonth) {
            receitaMensal = professor.salario_mensal || 0;
        }
      } else {
        turmasNoMes.forEach(turma => {
          daysInPeriod.forEach(day => {
            const scheduleForDay = turma.schedule?.find(s => s.day === getDay(day));
            if (scheduleForDay) {
                const classDate = new Date(day);
                if (isAfter(classDate, parseDateStringAsLocal(turma.start_date)) && (!turma.end_date || isBefore(classDate, parseDateStringAsLocal(turma.end_date)))) {
                    aulasDadas++;
                    if (professor.payment_type === 'por_aula') {
                        receitaMensal += professor.valor_por_aula || 0;
                    } else { // por_hora
                        try {
                        const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
                        const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
                        if (!isNaN(startTime.valueOf()) && !isNaN(endTime.valueOf()) && endTime > startTime) {
                            const durationHours = differenceInMinutes(endTime, startTime) / 60;
                            receitaMensal += durationHours * (professor.valor_hora_aula || 0);
                        }
                        } catch (e) { /* ignore parse errors */ }
                    }
                }
            }
          });
        });
      }
      
      return { monthLabel, aulas: aulasDadas, receita: receitaMensal };
    });

    const receitaMesAtual = monthlyStats[0]?.receita || 0;

    return {
      totalTurmasAtivas,
      totalAlunos,
      receitaMesAtual,
      avaliacaoMedia: avgRating > 0 ? avgRating.toFixed(1) : 'N/A',
      monthlyStats,
    };
  }, [professor, turmas]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total de Turmas Ativas" value={performanceData.totalTurmasAtivas} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Receita Total Gerada (Mês)" value={formatCurrency(performanceData.receitaMesAtual)} icon={DollarSign} color="text-blue-500" />
        <StatCard label="Avaliação Média" value={performanceData.avaliacaoMedia} icon={Star} color="text-yellow-500" />
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
