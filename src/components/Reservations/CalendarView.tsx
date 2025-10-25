import React, { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, startOfDay, addWeeks, subWeeks, startOfWeek, endOfWeek, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from 'lucide-react';
import { Reserva } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import DayDetailView from './DayDetailView';
import Button from '../Forms/Button';

interface CalendarViewProps {
  reservas: Reserva[];
  quadras: any[];
  onReservationClick: (reserva: Reserva) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  onSlotClick: (date: Date, time: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ reservas, quadras, onReservationClick, selectedDate, onDateChange, onDayDoubleClick, onSlotClick }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDisplayDate, setCurrentDisplayDate] = useState(selectedDate);
  const today = startOfDay(new Date());

  useEffect(() => {
    setCurrentDisplayDate(selectedDate);
  }, [selectedDate]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const newDate = viewMode === 'week'
      ? direction === 'next' ? addWeeks(currentDisplayDate, 1) : subWeeks(currentDisplayDate, 1)
      : direction === 'next' ? addMonths(currentDisplayDate, 1) : subMonths(currentDisplayDate, 1);
    setCurrentDisplayDate(newDate);
    onDateChange(newDate);
  };

  const headerTitle = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDisplayDate, { locale: ptBR });
      const weekEnd = endOfWeek(currentDisplayDate, { locale: ptBR });
      if (isSameMonth(weekStart, weekEnd)) {
        return format(currentDisplayDate, 'MMMM yyyy', { locale: ptBR });
      }
      return `${format(weekStart, 'MMM', { locale: ptBR })} - ${format(weekEnd, 'MMM yyyy', { locale: ptBR })}`;
    }
    return format(currentDisplayDate, 'MMMM yyyy', { locale: ptBR });
  }, [currentDisplayDate, viewMode]);

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
        <Button variant="ghost" size="icon" onClick={() => setViewMode(prev => prev === 'week' ? 'month' : 'week')} className="p-2 rounded-md" title={viewMode === 'week' ? 'Ver Mês' : 'Ver Semana'}>
          {viewMode === 'week' ? <CalendarIcon className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
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
    let days: Date[];
    let isCurrentPeriod: (day: Date) => boolean;

    if (viewMode === 'week') {
        const weekStart = startOfWeek(currentDisplayDate, { locale: ptBR });
        const weekEnd = endOfWeek(currentDisplayDate, { locale: ptBR });
        days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        isCurrentPeriod = () => true;
    } else { // month view
      const monthStart = startOfMonth(currentDisplayDate);
      const monthEnd = endOfMonth(monthStart);
      const calendarStart = startOfWeek(monthStart, { locale: ptBR });
      const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
      days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      isCurrentPeriod = (day) => isSameMonth(day, currentDisplayDate);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayReservas = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), day) && r.status !== 'cancelada');
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isSameDay(day, today);
          const isCurrent = isCurrentPeriod(day);
          
          const getCellClasses = () => {
            const base = 'p-2 border rounded-lg min-h-[120px] transition-all cursor-pointer flex flex-col';
            if (!isCurrent) {
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
            if (isTodayDay && isCurrent) {
              return `${base} bg-brand-blue-100 text-brand-blue-600 dark:bg-brand-blue-500/20 dark:text-brand-blue-300`;
            }
            return 'font-medium';
          };

          return (
            <div
              key={day.toString()}
              onClick={() => onDateChange(day)}
              onDoubleClick={() => onDayDoubleClick(day)}
              className={getCellClasses()}
            >
              <div className="flex justify-start">
                <span className={getDayNumberClasses()}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                {dayReservas.slice(0, 2).map(r => {
                  let typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
                  if (r.status === 'aguardando_pagamento') {
                    typeDetails = {
                      ...getReservationTypeDetails('aguardando_pagamento', r.isRecurring),
                    };
                  }
                  return (
                    <div 
                      key={r.id} 
                      onClick={(e) => { e.stopPropagation(); onReservationClick(r); }} 
                      className={`text-xs p-1 rounded truncate cursor-pointer flex items-center ${typeDetails.publicBgColor} ${typeDetails.publicTextColor}`}
                      title={`${r.start_time} - ${r.clientName || typeDetails.label}`}
                    >
                      <span className="font-bold mr-1">{r.start_time.slice(0, 5)}</span>
                      <span className="truncate flex items-center">
                        {r.clientName || typeDetails.label}
                      </span>
                    </div>
                  )
                })}
                {dayReservas.length > 2 && (
                  <div className="text-xs text-brand-gray-500 mt-1">+{dayReservas.length - 2} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-3 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        {renderHeader()}
        {renderDaysOfWeek()}
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarView;
