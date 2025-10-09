import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, startOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Turma } from '../../../types';

interface AttendanceCalendarProps {
  attendance: { date: Date; status: 'present' | 'absent' }[];
  turmas: Turma[];
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ attendance, turmas }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(current => direction === 'next' ? addMonths(current, 1) : subMonths(current, 1));
  };

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
      <h3 className="text-lg font-semibold capitalize text-brand-gray-900 dark:text-white">
        Calendário de Frequência
      </h3>
      <div className="flex items-center">
        <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="w-32 text-center font-medium capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
        <button onClick={() => handleMonthChange('next')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderDaysOfWeek = () => {
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return (
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">
        {days.map((day, i) => <div key={i}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = currentMonth;
    const days = eachDayOfInterval({ start: startOfMonth(monthStart), end: endOfMonth(monthStart) });
    const prefixDaysCount = getDay(monthStart);

    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: prefixDaysCount }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
        {days.map((day, index) => {
          const isClassDay = turmas.some(t => t.daysOfWeek.includes(getDay(day)));
          const attendanceRecord = attendance.find(a => isSameDay(a.date, day));
          
          let cellContent = null;
          let cellBg = 'bg-transparent';

          if (isClassDay && isBefore(day, startOfDay(new Date()))) {
            if (attendanceRecord?.status === 'present') {
              cellContent = <CheckCircle className="h-5 w-5 text-green-500" />;
              cellBg = 'bg-green-50 dark:bg-green-500/10';
            } else {
              cellContent = <XCircle className="h-5 w-5 text-red-500" />;
              cellBg = 'bg-red-50 dark:bg-red-500/10';
            }
          } else if (isClassDay) {
            cellContent = <HelpCircle className="h-5 w-5 text-brand-gray-400" />;
            cellBg = 'bg-brand-gray-100 dark:bg-brand-gray-700/50';
          }

          return (
            <div key={index} className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${cellBg}`}>
              <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-brand-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-brand-gray-800 dark:text-brand-gray-200'}`}>
                {format(day, 'd')}
              </span>
              {cellContent && <div className="mt-1">{cellContent}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 text-xs text-brand-gray-600 dark:text-brand-gray-400">
      <div className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-1.5" /> Presença</div>
      <div className="flex items-center"><XCircle className="h-4 w-4 text-red-500 mr-1.5" /> Falta</div>
      <div className="flex items-center"><HelpCircle className="h-4 w-4 text-brand-gray-400 mr-1.5" /> Aula Futura</div>
    </div>
  );

  return (
    <div>
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
      {renderLegend()}
    </div>
  );
};

export default AttendanceCalendar;
