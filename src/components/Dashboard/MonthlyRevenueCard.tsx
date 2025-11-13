import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';
import { Reserva } from '../../types';
import { startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, addDays, format, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface MonthlyRevenueCardProps {
  label: string;
  value: number;
  reservas: Reserva[];
  className?: string;
}

const MonthlyRevenueCard: React.FC<MonthlyRevenueCardProps> = ({ label, value, reservas, className }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);

  const weeklyRevenue = useMemo(() => {
    if (!reservas) return [];

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyReservas = reservas.filter(r => {
        const reservaDate = parseDateStringAsLocal(r.date);
        return isWithinInterval(reservaDate, { start: monthStart, end: monthEnd }) &&
               (r.status === 'confirmada' || r.status === 'realizada');
    });

    const weeklyTotals: { weekLabel: string; total: number; isCurrent: boolean }[] = [];
    let currentWeekStart = startOfWeek(monthStart, { locale: ptBR });

    while (currentWeekStart <= monthEnd) {
        const currentWeekEnd = endOfWeek(currentWeekStart, { locale: ptBR });
        
        const weekReservas = monthlyReservas.filter(r => {
            const reservaDate = parseDateStringAsLocal(r.date);
            return isWithinInterval(reservaDate, { start: currentWeekStart, end: currentWeekEnd });
        });

        const weekTotal = weekReservas.reduce((sum, r) => sum + (r.total_price || 0), 0);

        const isCurrentWeek = isSameWeek(now, currentWeekStart, { locale: ptBR });

        // Garante que a semana atual seja sempre exibida, mesmo que o total seja zero.
        if (weekTotal > 0 || isCurrentWeek) {
            weeklyTotals.push({
                weekLabel: `${format(currentWeekStart, 'dd/MM')} - ${format(currentWeekEnd, 'dd/MM')}`,
                total: weekTotal,
                isCurrent: isCurrentWeek,
            });
        }
        
        currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeklyTotals;
  }, [reservas]);

  useEffect(() => {
    if (currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  }, [weeklyRevenue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col lg:h-44", className)}
    >
      <div className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-brand-gray-900">
            <DollarSign className="h-6 w-6 text-purple-500" />
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-bold text-brand-gray-900 dark:text-white mt-2">{formatCurrency(value)}</p>
      </div>
      
      <div ref={scrollContainerRef} className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex-grow min-h-0 overflow-y-auto pr-2">
        {weeklyRevenue.length > 0 ? (
          <>
            <h4 className="text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400 mb-2">
              Receita por Semana
            </h4>
            <div className="space-y-2">
              {weeklyRevenue.map((week, index) => (
                <div 
                  key={index}
                  ref={week.isCurrent ? currentWeekRef : null}
                  className={cn(
                    "flex justify-between items-center text-xs p-2 rounded-md"
                  )}
                >
                  <span className={cn("text-brand-gray-600 dark:text-brand-gray-300", week.isCurrent && "text-brand-blue-600 dark:text-brand-blue-300")}>{week.weekLabel}</span>
                  <span className={cn("font-semibold text-brand-gray-800 dark:text-brand-gray-200", week.isCurrent && "text-brand-blue-600 dark:text-brand-blue-300")}>{formatCurrency(week.total)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-brand-gray-500">Sem dados de receita semanal.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MonthlyRevenueCard;
