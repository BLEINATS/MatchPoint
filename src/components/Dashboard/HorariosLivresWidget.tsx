import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quadra, Reserva } from '../../types';
import { Clock, Zap, AlertTriangle, Trophy } from 'lucide-react';
import Button from '../Forms/Button';
import { format, parse, addMinutes, getDay, isPast, isSameDay, startOfDay, addDays } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { expandRecurringReservations } from '../../utils/reservationUtils';
import { cn } from '../../lib/utils';

interface HorariosLivresWidgetProps {
  quadras: Quadra[];
  reservas: Reserva[];
  className?: string;
}

const HorariosLivresWidget: React.FC<HorariosLivresWidgetProps> = ({ quadras, reservas, className }) => {
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  const displayedReservations = useMemo(() => {
    return expandRecurringReservations(reservas, today, today, quadras);
  }, [reservas, quadras, today]);

  const generateTimeSlots = (quadra: Quadra) => {
    const slots = [];
    const dayOfWeek = getDay(today);
    let horario = dayOfWeek === 0 ? quadra.horarios?.sunday : dayOfWeek === 6 ? quadra.horarios?.saturday : quadra.horarios?.weekday;
    if (!horario || !horario.start || !horario.end) return [];
    
    let currentTime = parse(horario.start.trim(), 'HH:mm', today);
    let endTime = parse(horario.end.trim(), 'HH:mm', today);
    if (endTime <= currentTime && horario.end !== '00:00') {
      endTime = addDays(endTime, 1);
    } else if (horario.end === '00:00') {
      endTime = addDays(startOfDay(today), 1);
    }
    
    const interval = 60; // Assume 60 min slots for simplicity
    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, interval);
    }
    return slots;
  };

  const getSlotStatus = (time: string, quadraId: string) => {
    const slotStart = parse(time, 'HH:mm', today);
    
    if (isPast(slotStart)) return { status: 'past' as const, data: null };
    
    const slotEnd = addMinutes(slotStart, 60);

    const reserva = displayedReservations.find(r => {
      if (r.quadra_id !== quadraId || !isSameDay(parseDateStringAsLocal(r.date), today) || r.status === 'cancelada') {
        return false;
      }
      
      const resStartTime = parse(r.start_time, 'HH:mm', today);
      let resEndTime = parse(r.end_time, 'HH:mm', today);

      if (resEndTime <= resStartTime) {
        resEndTime = addDays(resEndTime, 1);
      }
      
      if (isNaN(resStartTime.getTime()) || isNaN(resEndTime.getTime())) return false;

      // Check for overlap: (StartA < EndB) and (EndA > StartB)
      return slotStart < resEndTime && slotEnd > resStartTime;
    });

    if (!reserva) return { status: 'available' as const, data: null };

    if (reserva.status === 'aguardando_pagamento') {
      return { status: 'pending_payment' as const, data: reserva };
    }

    return { status: 'booked' as const, data: reserva };
  };

  const handleSlotClick = (quadraId: string, time: string, status: 'available' | 'pending_payment') => {
    if (status === 'available') {
      navigate('/reservas', { 
        state: { 
          openModal: true, 
          type: 'avulsa',
          quadraId: quadraId,
          time: time,
          selectedDate: today.toISOString()
        } 
      });
    } else if (status === 'pending_payment') {
      navigate('/reservas', {
        state: {
          selectedDate: today.toISOString(),
          quadraId: quadraId,
        }
      });
    }
  };

  const renderSlotButton = (quadra: Quadra, time: string) => {
    const { status, data } = getSlotStatus(time, quadra.id);

    let styles = '', icon = null, disabled = false, title = '';
    
    switch (status) {
      case 'available':
        styles = 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20';
        icon = <Clock className="h-3 w-3 mr-1.5" />;
        title = 'Horário livre';
        break;
      case 'pending_payment':
        styles = 'bg-yellow-400 !text-black dark:!text-black bg-striped hover:bg-yellow-500 border-yellow-500';
        icon = <AlertTriangle className="h-3 w-3 mr-1.5" />;
        title = `Aguardando Pagamento: ${data?.clientName}`;
        break;
      case 'past':
        return null; // Do not render past slots
      case 'booked':
        return null; // Do not render booked slots
      default:
        return null;
    }

    return (
      <Button
        key={time}
        variant="outline"
        size="sm"
        onClick={() => handleSlotClick(quadra.id, time, status as any)}
        className={`flex items-center justify-center transition-all ${styles}`}
        disabled={disabled}
        title={title}
      >
        {icon}
        {time}
      </Button>
    );
  };

  const slotsByCourt = useMemo(() => {
    return quadras
      .filter(q => q.status === 'ativa')
      .map(quadra => {
        const slots = generateTimeSlots(quadra)
          .map(time => ({ time, status: getSlotStatus(time, quadra.id).status }))
          .filter(slot => slot.status === 'available' || slot.status === 'pending_payment');
        return {
          courtId: quadra.id,
          courtName: quadra.name,
          slots
        };
      });
  }, [quadras, displayedReservations, today]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }} 
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-[28rem]", className)}
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex-shrink-0">Horários Livres & Pendentes Hoje</h3>
      <div className="space-y-4 flex-grow overflow-y-auto px-2 pb-2 -mx-2 min-h-0">
        {slotsByCourt.length > 0 ? slotsByCourt.map(courtData => (
          <div key={courtData.courtId}>
            <h4 className="font-semibold text-brand-blue-600 dark:text-brand-blue-400 mb-2 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-1">
              {courtData.courtName}
            </h4>
            {courtData.slots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {courtData.slots.map(slot => renderSlotButton(quadras.find(q => q.id === courtData.courtId)!, slot.time))}
              </div>
            ) : (
              <div className="text-center py-4 px-2">
                <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200">Parabéns!</p>
                <p className="text-xs text-brand-gray-500">Agenda lotada para hoje.</p>
              </div>
            )}
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Zap className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
            <p className="text-sm text-brand-gray-500">Nenhuma quadra ativa ou horários disponíveis hoje.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HorariosLivresWidget;
