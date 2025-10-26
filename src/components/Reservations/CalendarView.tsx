import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, startOfDay, addWeeks, subWeeks, startOfWeek, endOfWeek, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from 'lucide-react';
import { Reserva, Quadra } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import Button from '../Forms/Button';

interface CalendarViewProps {
  allReservations: Reserva[];
  quadras: any[];
  onReservationClick: (reserva: Reserva) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  onSlotClick: (date: Date, time: string) => void;
}

const MAX_EVENTS_VISIBLE = 2;

const CalendarView: React.FC<CalendarViewProps> = ({ allReservations, onReservationClick, selectedDate, onDateChange, onDayDoubleClick }) => {
  const [viewMode, setViewMode] = useState<'month'>('month');
  const today = startOfDay(new Date());

  const handleNavigation = (direction: 'next' | 'prev') => {
    const newDate = viewMode === 'week'
      ? direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1)
      : direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1);
    onDateChange(newDate);
  };

  const headerTitle = useMemo(() => {
    return format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  }, [selectedDate]);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
      <h2 className="text-xl font-bold capitalize text-brand-gray-900 dark:text-white">
        {headerTitle}
      </h2>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onDateChange(today)}>Hoje</Button>
        <Button variant="ghost" size="icon" onClick={() => handleNavigation('prev')} className="p-2 rounded-md">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleNavigation('next')} className="p-2 rounded-md">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  const renderDaysOfWeek = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">
        {days.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayReservas = allReservations.filter(r => isSameDay(parseDateStringAsLocal(r.date), day) && r.status !== 'cancelada');
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          
          const getCellClasses = () => {
            const base = 'p-2 border rounded-lg min-h-[120px] transition-all cursor-pointer flex flex-col';
            if (!isCurrentMonth) {
              return `${base} bg-brand-gray-50 dark:bg-brand-gray-900/50 text-brand-gray-400 opacity-50 border-transparent`;
            }
            if (isSelected) {
              return `${base} bg-white dark:bg-brand-gray-800 border-2 border-orange-500 shadow-lg`;
            }
            if (isTodayDay) {
              return `${base} bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700 ring-1 ring-brand-blue-400`;
            }
            return `${base} bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700 hover:bg-blue-50 dark:hover:bg-brand-gray-700`;
          };

          const getDayNumberClasses = () => {
            const base = 'font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors';
            if (isSelected) {
              return `${base} bg-orange-500 text-white`;
            }
            if (isTodayDay && isCurrentMonth) {
              return `${base} bg-brand-blue-100 text-brand-blue-600 dark:bg-brand-blue-500/20 dark:text-brand-blue-300`;
            }
            return 'font-medium';
          };
          
          const sortedReservas = dayReservas.sort((a, b) => a.start_time.localeCompare(b.start_time));
          const visibleReservas = sortedReservas.slice(0, MAX_EVENTS_VISIBLE);
          const hiddenCount = sortedReservas.length - visibleReservas.length;

          return (
            <div
              key={day.toString()}
              onClick={() => onDateChange(day)}
              onDoubleClick={() => onDayDoubleClick(day)}
              className={getCellClasses()}
            >
              <div className="flex justify-between items-start">
                <span className={getDayNumberClasses()}>
                  {format(day, 'd')}
                </span>
                {sortedReservas.length > 0 && (
                  <span className="text-xs font-bold bg-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
                    {sortedReservas.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {visibleReservas.map(r => {
                  let typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
                  if (r.status === 'aguardando_pagamento') {
                    typeDetails = getReservationTypeDetails('aguardando_pagamento');
                  }
                  return (
                    <div 
                      key={r.id} 
                      onClick={(e) => { e.stopPropagation(); onReservationClick(r); }} 
                      className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate cursor-pointer flex items-center ${typeDetails.publicBgColor} ${typeDetails.publicTextColor}`}
                      title={`${r.start_time.slice(0,5)} - ${r.clientName || typeDetails.label}`}
                    >
                      <span className="font-bold mr-1.5">{r.start_time.slice(0, 5)}</span>
                      <span className="truncate flex-1">{r.clientName || typeDetails.label}</span>
                    </div>
                  )
                })}
                 {hiddenCount > 0 && (
                    <div className="text-center text-xs font-medium text-brand-blue-500 mt-1">
                        + {hiddenCount} mais
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </div>
  );
};

export default CalendarView;
