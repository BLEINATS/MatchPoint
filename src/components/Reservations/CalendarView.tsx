import React, { useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, startOfDay, addDays, subDays, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reserva, Quadra } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import DayDetailView from './DayDetailView';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface CalendarViewProps {
  reservas: Reserva[];
  quadras: Quadra[];
  onReservationClick: (reserva: Reserva) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  onSlotClick: (date: Date, time: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ reservas, quadras, onReservationClick, selectedDate, onDateChange, onDayDoubleClick, onSlotClick }) => {
  const currentMonth = startOfMonth(selectedDate);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newMonth = direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    onDateChange(newMonth);
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold capitalize text-brand-gray-900 dark:text-white">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </h2>
      <div className="flex space-x-2">
        <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => handleMonthChange('next')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = currentMonth;
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfDay(subDays(monthStart, getDay(monthStart)));
    const endDate = endOfDay(addDays(monthEnd, 6 - getDay(monthEnd)));
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayReservas = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), day) && r.status !== 'cancelada');
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          const getCellClasses = () => {
            const base = 'p-2 border rounded-lg min-h-[120px] transition-all cursor-pointer flex flex-col';
            if (!isCurrentMonth) {
              return `${base} bg-brand-gray-50 dark:bg-brand-gray-900/50 text-brand-gray-400 opacity-50 border-transparent`;
            }
            if (isSelected) {
              return `${base} bg-white dark:bg-brand-gray-800 border-2 border-orange-500 shadow-lg`;
            }
            if (isToday) {
              return `${base} bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700 ring-1 ring-brand-blue-400`;
            }
            return `${base} bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700 hover:bg-blue-50 dark:hover:bg-brand-gray-700`;
          };

          const getDayNumberClasses = () => {
            const base = 'font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors';
            if (isSelected) {
              return `${base} bg-orange-500 text-white`;
            }
            if (isToday) {
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
                  const typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
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
      <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      <div className="lg:col-span-1">
        <DayDetailView 
          date={selectedDate} 
          reservas={reservas}
          quadras={quadras}
          onSlotClick={(time) => onSlotClick(selectedDate, time)}
        />
      </div>
    </div>
  );
};

export default CalendarView;
