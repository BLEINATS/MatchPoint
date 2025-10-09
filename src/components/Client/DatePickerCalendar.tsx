import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({ selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const today = startOfDay(new Date());

  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(current => direction === 'next' ? addMonths(current, 1) : subMonths(current, 1));
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold capitalize text-brand-gray-900 dark:text-white">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </h3>
      <div className="flex items-center">
        <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
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
    const suffixDaysCount = 6 - getDay(endOfMonth(monthStart));

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
        {Array.from({ length: suffixDaysCount }).map((_, i) => <div key={`empty-suf-${i}`} className="aspect-square"></div>)}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </div>
  );
};

export default DatePickerCalendar;
