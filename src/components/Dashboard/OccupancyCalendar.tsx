import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quadra } from '../../types';

interface OccupancyCalendarProps {
  calendarDays: any[];
  currentMonth: Date;
  quadras: Quadra[];
  selectedQuadraId: string;
  onMonthChange: (direction: 'next' | 'prev') => void;
  onQuadraChange: (id: string) => void;
  onDayClick: (date: Date) => void;
}

const OccupancyCalendar: React.FC<OccupancyCalendarProps> = ({
  calendarDays,
  currentMonth,
  quadras,
  selectedQuadraId,
  onMonthChange,
  onQuadraChange,
  onDayClick,
}) => {
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getOccupancyColor = (rate: number) => {
    if (rate === 0) return 'bg-brand-gray-100 dark:bg-brand-gray-700/50';
    if (rate < 30) return 'bg-green-100 dark:bg-green-900/50';
    if (rate < 60) return 'bg-green-200 dark:bg-green-800/60';
    if (rate < 90) return 'bg-green-300 dark:bg-green-700/70';
    return 'bg-green-400 dark:bg-green-600/80';
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Calendário de Ocupação</h3>
        <div className="flex items-center gap-4">
          <select
            value={selectedQuadraId}
            onChange={(e) => onQuadraChange(e.target.value)}
            className="form-select text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
          >
            <option value="all">Todas as Quadras</option>
            {quadras.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
          <div className="flex items-center">
            <button onClick={() => onMonthChange('prev')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="w-32 text-center font-medium capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
            <button onClick={() => onMonthChange('next')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day, index) => (
          day.isEmpty ? (
            <div key={day.key} className="aspect-square"></div>
          ) : (
            <motion.div
              key={day.key}
              onClick={() => onDayClick(day.date)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer hover:ring-2 hover:ring-brand-blue-400 ${getOccupancyColor(day.occupancyRate)}`}
              title={`Ocupação: ${day.occupancyRate.toFixed(0)}%`}
            >
              <span className="text-brand-gray-800 dark:text-brand-gray-200">{day.dayOfMonth}</span>
            </motion.div>
          )
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 text-xs">
        <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-brand-gray-100 dark:bg-brand-gray-700/50 mr-1.5"></span>0%</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/50 mr-1.5"></span>1-29%</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800/60 mr-1.5"></span>30-59%</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700/70 mr-1.5"></span>60-89%</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600/80 mr-1.5"></span>90-100%</div>
      </div>
    </div>
  );
};

export default OccupancyCalendar;
