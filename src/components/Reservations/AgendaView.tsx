import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { Quadra, Reserva } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { Plus, DollarSign, AlertCircle, CheckCircle, CreditCard, ShoppingBag, Clock } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import Timer from '../Shared/Timer';

interface AgendaViewProps {
  quadras: Quadra[];
  reservas: Reserva[];
  selectedDate: Date;
  onSlotClick: (quadraId: string, time: string) => void;
  onReservationClick: (reserva: Reserva) => void;
  onDataChange: () => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ quadras, reservas, selectedDate, onSlotClick, onReservationClick, onDataChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const timeSlots = Array.from({ length: (23 - 6) * 2 + 1 }, (_, i) => {
    const totalMinutes = 6 * 60 + i * 30;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setMinutes(totalMinutes);
    return format(date, 'HH:mm');
  });

  useEffect(() => {
    const am8 = containerRef.current?.querySelector('[data-time-label="08:00"]');
    if (am8) {
      am8.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  const reservationsForDay = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), selectedDate) && r.status !== 'cancelada');

  const getPaymentStatusIcon = (status?: 'pago' | 'pendente' | 'parcialmente_pago') => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-3 w-3 text-white/80" title="Pago" />;
      case 'parcialmente_pago':
        return <DollarSign className="h-3 w-3 text-white/80" title="Parcialmente Pago" />;
      case 'pendente':
        return <AlertCircle className="h-3 w-3 text-white/80" title="Pendente" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      <div ref={containerRef} className="max-h-[70vh] overflow-auto relative">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${quadras.length}, minmax(150px, 1fr))` }}>
          <div className="sticky top-0 z-20 bg-brand-gray-50 dark:bg-brand-gray-700 p-2 border-b border-r border-brand-gray-200 dark:border-brand-gray-600"></div>
          {quadras.map((quadra) => (
            <div key={`${quadra.id}-header`} className="sticky top-0 z-20 bg-brand-gray-50 dark:bg-brand-gray-700 p-3 text-center border-b border-r border-brand-gray-200 dark:border-brand-gray-600">
              <p className="font-semibold text-sm text-brand-gray-900 dark:text-white truncate">{quadra.name}</p>
            </div>
          ))}

          <div className="col-start-1 col-end-2 row-start-2">
            {timeSlots.map(time => (
              <div key={time} data-time-label={time} className="h-12 flex items-center justify-center border-r border-b border-brand-gray-200 dark:border-brand-gray-700">
                <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{time}</span>
              </div>
            ))}
          </div>

          {quadras.map((quadra, quadraIndex) => (
            <div key={`${quadra.id}-slots`} style={{ gridColumnStart: quadraIndex + 2, gridRowStart: 2 }}>
              {timeSlots.map(time => (
                <div
                  key={time}
                  onClick={() => onSlotClick(quadra.id, time)}
                  className="h-12 border-r border-b border-brand-gray-200 dark:border-brand-gray-700 hover:bg-blue-50 dark:hover:bg-brand-blue-500/10 cursor-pointer group flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 text-brand-gray-300 dark:text-brand-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div 
          className="absolute top-[49px] left-0 w-full h-full grid" 
          style={{ gridTemplateColumns: `60px repeat(${quadras.length}, minmax(150px, 1fr))`, pointerEvents: 'none' }}
        >
          <div /> 

          {quadras.map((quadra, quadraIndex) => (
            <div key={`${quadra.id}-reservations`} className="relative" style={{ gridColumnStart: quadraIndex + 2 }}>
              {reservationsForDay
                .filter(r => r.quadra_id === quadra.id)
                .map(reservation => {
                  const [startHours, startMins] = reservation.start_time.split(':').map(Number);
                  const [endHours, endMins] = reservation.end_time.split(':').map(Number);

                  let startMinutes = startHours * 60 + startMins;
                  let endMinutes = endHours * 60 + endMins;
                  
                  if (endMinutes <= startMinutes) {
                    endMinutes += 24 * 60;
                  }
                  
                  const topOffsetMinutes = startMinutes - (6 * 60);
                  const durationMinutes = endMinutes - startMinutes;
                  
                  const top = (topOffsetMinutes / 30) * 3;
                  const height = (durationMinutes / 30) * 3;

                  if (height <= 0) return null;

                  const isPendingPayment = reservation.status === 'aguardando_pagamento';
                  let typeDetails = getReservationTypeDetails(reservation.type, reservation.isRecurring);
                  
                  if (isPendingPayment) {
                    typeDetails = {
                      label: 'Aguardando Pagamento',
                      icon: Clock,
                      bgColor: 'bg-yellow-400',
                      borderColor: 'border-yellow-500',
                      publicBgColor: '',
                      publicTextColor: ''
                    };
                  }

                  const Icon = typeDetails.icon;
                  const textColor = isPendingPayment ? 'text-yellow-900' : 'text-white';


                  const rentedItemsTitle = reservation.rented_items && reservation.rented_items.length > 0 
                    ? `Itens: ${reservation.rented_items.map(i => `${i.quantity}x ${i.name}`).join(', ')}` 
                    : undefined;

                  return (
                    <motion.div
                      key={reservation.id}
                      onClick={(e) => { e.stopPropagation(); onReservationClick(reservation); }}
                      className={`absolute w-[calc(100%-4px)] m-0.5 p-2 rounded-lg ${textColor} text-xs cursor-pointer shadow-lg z-10 flex flex-col justify-between overflow-hidden ${typeDetails.bgColor} ${isPendingPayment ? 'bg-striped' : 'bg-opacity-90'} border-l-4 ${typeDetails.borderColor}`}
                      style={{
                          top: `${top}rem`,
                          height: `calc(${height}rem - 4px)`,
                          pointerEvents: 'auto',
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      layout
                    >
                      <div>
                        <p className="font-bold flex items-center flex-shrink-0">
                          <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{reservation.clientName || typeDetails.label}</span>
                        </p>
                        <p className="text-xs opacity-80">{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-semibold opacity-90 flex items-center gap-1">
                          {formatCurrency(reservation.total_price)}
                          {reservation.credit_used && reservation.credit_used > 0 && (
                            <CreditCard className="h-3 w-3 text-current opacity-80" title={`Pago com ${formatCurrency(reservation.credit_used)} de crédito`} />
                          )}
                          {rentedItemsTitle && (
                            <ShoppingBag className="h-3 w-3 text-current opacity-80" title={rentedItemsTitle} />
                          )}
                        </span>
                        {isPendingPayment && reservation.payment_deadline ? (
                          <div className="text-xs font-bold flex items-center">
                            <Timer deadline={reservation.payment_deadline} onExpire={onDataChange} />
                            <Clock className="h-3 w-3 ml-1 animate-pulse" />
                          </div>
                        ) : (
                          getPaymentStatusIcon(reservation.payment_status)
                        )}
                      </div>
                    </motion.div>
                  );
                })
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;
