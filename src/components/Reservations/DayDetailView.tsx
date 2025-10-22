import React, { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quadra, Reserva } from '../../types';
import { Plus, DollarSign, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface DayDetailViewProps {
  date: Date;
  reservas: Reserva[];
  quadras: Quadra[];
  onSlotClick: (time: string) => void;
  onReservationClick: (reserva: Reserva) => void;
}

const timeStringToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const DayDetailView: React.FC<DayDetailViewProps> = ({ date, reservas, quadras, onSlotClick, onReservationClick }) => {
  
  const reservationsForDay = useMemo(() => {
    return reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), date) && r.status !== 'cancelada');
  }, [reservas, date]);

  const timeSlots = useMemo(() => 
    Array.from({ length: (23 - 6) * 2 }, (_, i) => {
      const totalMinutes = 6 * 60 + i * 30;
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }),
    []
  );
  
  const getReservationForSlot = (slotTime: string) => {
    const slotMinutes = timeStringToMinutes(slotTime);
    return reservationsForDay.find(r => {
      const startMinutes = timeStringToMinutes(r.start_time);
      const endMinutes = timeStringToMinutes(r.end_time);
      const duration = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60 - startMinutes) + endMinutes;
      return slotMinutes >= startMinutes && slotMinutes < startMinutes + duration;
    });
  };
  
  const getQuadraName = (id: string) => quadras.find(q => q.id === id)?.name || 'N/A';

  const getPaymentStatus = (status?: 'pago' | 'pendente' | 'parcialmente_pago') => {
    switch (status) {
      case 'pago': return { icon: CheckCircle, color: 'text-green-400', label: 'Pago' };
      case 'parcialmente_pago': return { icon: DollarSign, color: 'text-blue-400', label: 'Parcial' };
      case 'pendente': return { icon: AlertCircle, color: 'text-yellow-400', label: 'Pendente' };
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 h-full">
      <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-1 capitalize">
        {format(date, "eeee, dd 'de' MMMM", { locale: ptBR })}
      </h3>
      <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-6">Horários do Dia</p>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {timeSlots.map((slot, index) => {
          const reserva = getReservationForSlot(slot);
          if (reserva) {
            if (slot !== reserva.start_time.slice(0, 5)) {
              return null;
            }
            
            let typeDetails = getReservationTypeDetails(reserva.type);
            if (reserva.status === 'aguardando_pagamento') {
              typeDetails = getReservationTypeDetails('aguardando_pagamento');
            }
            
            const paymentStatus = getPaymentStatus(reserva.payment_status);
            const startMinutes = timeStringToMinutes(reserva.start_time);
            const endMinutes = timeStringToMinutes(reserva.end_time);
            const durationInSlots = ((endMinutes > startMinutes ? endMinutes : endMinutes + 24 * 60) - startMinutes) / 30;
            const height = durationInSlots * 2.5;

            return (
              <div key={reserva.id} onClick={() => onReservationClick(reserva)} className={`p-3 rounded-lg text-white cursor-pointer ${typeDetails.bgColor}`} style={{ minHeight: `${height}rem` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{reserva.clientName || typeDetails.label}</p>
                    <p className="text-xs opacity-90">{getQuadraName(reserva.quadra_id)}</p>
                  </div>
                  <p className="text-xs font-medium bg-black/20 px-1.5 py-0.5 rounded-full">{reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold opacity-90 flex items-center gap-1">
                    {formatCurrency(reserva.total_price)}
                    {reserva.credit_used && reserva.credit_used > 0 && (
                      <CreditCard className="h-3 w-3 text-white/80" title={`Pago com ${formatCurrency(reserva.credit_used)} de crédito`} />
                    )}
                  </span>
                  {paymentStatus && (
                    <span className={`inline-flex items-center font-medium ${paymentStatus.color}`}>
                      <paymentStatus.icon className="h-3 w-3 mr-1" />
                      {paymentStatus.label}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div 
              key={index}
              onClick={() => onSlotClick(slot)}
              className="h-10 flex items-center justify-between p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-300 dark:hover:border-blue-500/30 cursor-pointer transition-colors"
            >
              <span className="text-xs font-medium text-brand-gray-400">{slot}</span>
              <Plus className="h-4 w-4 text-brand-gray-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayDetailView;
