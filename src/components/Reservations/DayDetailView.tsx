import React, { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quadra, Reserva } from '../../types';
import { Calendar, DollarSign, AlertCircle, CheckCircle, CreditCard, ShoppingBag } from 'lucide-react';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface DayDetailViewProps {
  date: Date;
  reservas: Reserva[];
  quadras: Quadra[];
  onReservationClick: (reserva: Reserva) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({ date, reservas, quadras, onReservationClick }) => {
  
  const reservationsByCourt = useMemo(() => {
    const dailyReservas = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), date) && r.status !== 'cancelada');
    
    const grouped: { [quadraId: string]: Reserva[] } = {};

    dailyReservas.forEach(reserva => {
      if (!grouped[reserva.quadra_id]) {
        grouped[reserva.quadra_id] = [];
      }
      grouped[reserva.quadra_id].push(reserva);
    });

    for (const quadraId in grouped) {
      grouped[quadraId].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    
    return Object.keys(grouped)
      .sort((a, b) => {
        const quadraA = quadras.find(q => q.id === a)?.name || '';
        const quadraB = quadras.find(q => q.id === b)?.name || '';
        return quadraA.localeCompare(quadraB);
      })
      .map(quadraId => ({
        quadra: quadras.find(q => q.id === quadraId),
        reservas: grouped[quadraId],
      }));

  }, [reservas, date, quadras]);

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
      <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-6">Reservas do Dia</p>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {reservationsByCourt.length > 0 ? (
          reservationsByCourt.map(({ quadra, reservas: courtReservas }) => (
            <div key={quadra?.id}>
              <h4 className="font-semibold text-brand-blue-600 dark:text-brand-blue-400 mb-2 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-1">
                {quadra?.name || 'Quadra Desconhecida'}
              </h4>
              <div className="space-y-2">
                {courtReservas.map(reserva => {
                  let typeDetails = getReservationTypeDetails(reserva.type, reserva.isRecurring);
                  if (reserva.status === 'aguardando_pagamento') {
                    typeDetails = getReservationTypeDetails('aguardando_pagamento');
                  }
                  const paymentStatus = getPaymentStatus(reserva.payment_status);
                  const rentedItemsTitle = reserva.rented_items && reserva.rented_items.length > 0 
                    ? `Itens: ${reserva.rented_items.map(i => `${i.quantity}x ${i.name}`).join(', ')}` 
                    : undefined;

                  return (
                    <div key={reserva.id} onClick={() => onReservationClick(reserva)} className={`p-3 rounded-lg text-white cursor-pointer ${typeDetails.bgColor}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm">{reserva.clientName || typeDetails.label}</p>
                          <p className="text-xs opacity-90">
                            {reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}
                            {reserva.sport_type && ` • ${reserva.sport_type}`}
                          </p>
                        </div>
                        {paymentStatus && (
                          <span className={`inline-flex items-center text-xs font-medium ${paymentStatus.color}`}>
                            <paymentStatus.icon className="h-3 w-3 mr-1" />
                            {paymentStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold opacity-90 flex items-center gap-1.5">
                          {formatCurrency(reserva.total_price)}
                          {reserva.credit_used && reserva.credit_used > 0 && (
                            <CreditCard className="h-3 w-3 text-white/80" title={`Pago com ${formatCurrency(reserva.credit_used)} de crédito`} />
                          )}
                          {rentedItemsTitle && (
                            <ShoppingBag className="h-3 w-3 text-white/80" title={rentedItemsTitle} />
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <Calendar className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
            <p className="text-brand-gray-500">Nenhuma reserva para este dia.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayDetailView;
