import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarRange, CalendarDays } from 'lucide-react';
import Button from '../Forms/Button';

interface DatePickerCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({ selectedDate, onDateChange }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const today = startOfDay(new Date());

  const handleNavigation = (direction: 'next' | 'prev') => {
    const newDate = viewMode === 'week'
      ? direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)
      : direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (viewMode === 'month') {
        const newSelected = startOfMonth(newDate);
        if(!isSameDay(selectedDate, newSelected)) onDateChange(newSelected);
    } else {
        const newSelected = startOfWeek(newDate, { locale: ptBR });
        if(!isSameDay(selectedDate, newSelected)) onDateChange(newSelected);
    }
  };

  const headerTitle = useMemo(() => {
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  }, [currentDate]);

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold capitalize text-brand-gray-900 dark:text-white">
        {headerTitle}
      </h3>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => handleNavigation('prev')}><ChevronLeft className="h-5 w-5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleNavigation('next')}><ChevronRight className="h-5 w-5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')} title={viewMode === 'week' ? 'Ver Mês' : 'Ver Semana'}>
          {viewMode === 'week' ? <CalendarDays className="h-5 w-5" /> : <CalendarRange className="h-5 w-5" />}
        </Button>
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
    let days: Date[];
    let prefixDaysCount = 0;

    if (viewMode === 'week') {
        const weekStart = startOfWeek(currentDate, { locale: ptBR });
        const weekEnd = endOfWeek(currentDate, { locale: ptBR });
        days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        prefixDaysCount = getDay(monthStart);
    }
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: prefixDaysCount }).map((_, i) => <div key={`empty-pre-${i}`} className="aspect-square"></div>)}
        {days.map((day, index) => {
          const isPastDay = isBefore(day, today);
          const isSelectedDay = isSameDay(day, selectedDate);
          const isTodayDay = isSameDay(day, today);

          let cellClasses = 'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all';
          if (isPastDay) {
            cellClasses += ' text-brand-gray-400 dark:text-brand-gray-600 cursor-not-allowed';
          } else {
            cellClasses += ' cursor-pointer hover:bg-blue-100 dark:hover:bg-brand-blue-500/20';
          }
          if (isSelectedDay) {
            cellClasses += ' bg-brand-blue-500 text-white shadow-md';
          } else if (isTodayDay) {
            cellClasses += ' bg-blue-50 dark:bg-brand-blue-900/50 text-brand-blue-600 dark:text-brand-blue-300';
          } else {
            cellClasses += ' text-brand-gray-800 dark:text-brand-gray-200';
          }

          return (
            <div
              key={index}
              className={cellClasses}
              onClick={() => !isPastDay && onDateChange(day)}
            >
              <span>{format(day, 'd')}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-4 sm:p-6">
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </div>
  );
};

export default DatePickerCalendar;
