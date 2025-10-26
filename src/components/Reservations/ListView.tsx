import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reserva, Quadra } from '../../types';
import { Calendar, Clock, Phone, DollarSign, AlertCircle, CheckCircle, CreditCard, MapPin, ShoppingBag } from 'lucide-react';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface ListViewProps {
  allReservations: Reserva[];
  quadras: Quadra[];
  onReservationClick: (reserva: Reserva) => void;
  filters: {
    startDate: string;
    endDate: string;
  };
  sortOrder: 'asc' | 'desc';
}

const ListView: React.FC<ListViewProps> = ({ allReservations, quadras, onReservationClick, filters, sortOrder }) => {
  const filteredAndSortedReservas = useMemo(() => {
    let filtered = allReservations;
    if (filters.startDate && filters.endDate) {
      const rangeStart = startOfDay(parseDateStringAsLocal(filters.startDate));
      const rangeEnd = endOfDay(parseDateStringAsLocal(filters.endDate));
      filtered = filtered.filter(r => {
        const rDate = parseDateStringAsLocal(r.date);
        return isWithinInterval(rDate, { start: rangeStart, end: rangeEnd });
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.start_time}`);
      const dateTimeB = new Date(`${b.date}T${b.start_time}`);
      return sortOrder === 'desc' ? dateTimeB.getTime() - dateTimeA.getTime() : dateTimeA.getTime() - dateTimeB.getTime();
    });

    return sorted;
  }, [allReservations, filters, sortOrder]);

  const getStatusClasses = (status: Reserva['status']) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'realizada': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-brand-gray-100 text-brand-gray-800 dark:bg-brand-gray-700 dark:text-brand-gray-200';
    }
  };

  const getPaymentStatus = (status?: 'pago' | 'pendente' | 'parcialmente_pago') => {
    switch (status) {
      case 'pago': return { icon: CheckCircle, color: 'text-green-500', label: 'Pago' };
      case 'parcialmente_pago': return { icon: DollarSign, color: 'text-blue-500', label: 'Parcial' };
      case 'pendente': return { icon: AlertCircle, color: 'text-yellow-500', label: 'Pendente' };
      default: return { icon: AlertCircle, color: 'text-brand-gray-400', label: 'N/D' };
    }
  };
  
  const getQuadraName = (id: string) => quadras.find(q => q.id === id)?.name || 'Quadra não encontrada';

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      {/* Desktop View: Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Cliente / Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Data & Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Quadra</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Pagamento</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {filteredAndSortedReservas.map(reserva => {
              const typeDetails = getReservationTypeDetails(reserva.type, reserva.isRecurring);
              const paymentStatus = getPaymentStatus(reserva.payment_status);
              const rentedItemsTitle = reserva.rented_items && reserva.rented_items.length > 0 
                ? `Itens: ${reserva.rented_items.map(i => `${i.quantity}x ${i.name}`).join(', ')}` 
                : undefined;

              return (
                <tr key={reserva.id} onClick={() => onReservationClick(reserva)} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 ${typeDetails.bgColor}`}></div>
                      <div>
                        <div className="text-sm font-medium text-brand-gray-900 dark:text-white flex items-center">
                          {reserva.clientName || typeDetails.label}
                        </div>
                        <div className="text-xs text-brand-gray-500">
                          {typeDetails.label}{reserva.sport_type && ` • ${reserva.sport_type}`}
                        </div>
                        {reserva.clientPhone && <div className="text-xs text-brand-gray-500 flex items-center mt-1"><Phone className="h-3 w-3 mr-1" />{reserva.clientPhone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-brand-gray-400" />
                      {format(parseDateStringAsLocal(reserva.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{getQuadraName(reserva.quadra_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-gray-800 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>
                        {formatCurrency(reserva.total_price)}
                      </span>
                      {reserva.credit_used && reserva.credit_used > 0 && (
                        <CreditCard className="h-4 w-4 text-blue-500" title={`Pago com ${formatCurrency(reserva.credit_used)} de crédito`} />
                      )}
                      {rentedItemsTitle && (
                        <ShoppingBag className="h-4 w-4 text-purple-500" title={rentedItemsTitle} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center text-xs font-medium ${paymentStatus.color}`}>
                      <paymentStatus.icon className="h-4 w-4 mr-1" />
                      {paymentStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(reserva.status)}`}>
                      {reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}
                    </span>
                  </td>
                </tr>
              )
            })}
             {filteredAndSortedReservas.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-brand-gray-500">
                        Nenhuma reserva encontrada para os filtros selecionados.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden p-4 space-y-4">
        {filteredAndSortedReservas.map(reserva => {
          const typeDetails = getReservationTypeDetails(reserva.type, reserva.isRecurring);
          const paymentStatus = getPaymentStatus(reserva.payment_status);
          const rentedItemsTitle = reserva.rented_items && reserva.rented_items.length > 0 
            ? `Itens: ${reserva.rented_items.map(i => `${i.quantity}x ${i.name}`).join(', ')}` 
            : undefined;

          return (
            <div key={reserva.id} onClick={() => onReservationClick(reserva)} className="bg-white dark:bg-brand-gray-800 p-4 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-brand-gray-900 dark:text-white">{reserva.clientName || typeDetails.label}</p>
                  <p className="text-xs text-brand-gray-500">{typeDetails.label}{reserva.sport_type && ` • ${reserva.sport_type}`}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(reserva.status)}`}>
                  {reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-brand-gray-400" />
                  <span className="text-brand-gray-700 dark:text-brand-gray-300">{format(parseDateStringAsLocal(reserva.date), 'dd/MM/yy', { locale: ptBR })}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-brand-gray-400" />
                  <span className="text-brand-gray-700 dark:text-brand-gray-300">{reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}</span>
                </div>
                <div className="flex items-center col-span-2">
                  <MapPin className="h-4 w-4 mr-2 text-brand-gray-400" />
                  <span className="text-brand-gray-700 dark:text-brand-gray-300">{getQuadraName(reserva.quadra_id)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-gray-800 dark:text-white">
                  {formatCurrency(reserva.total_price)}
                  {reserva.credit_used && reserva.credit_used > 0 && (
                    <CreditCard className="h-4 w-4 text-blue-500" title={`Pago com ${formatCurrency(reserva.credit_used)} de crédito`} />
                  )}
                  {rentedItemsTitle && (
                    <ShoppingBag className="h-4 w-4 text-purple-500" title={rentedItemsTitle} />
                  )}
                </div>
                <span className={`inline-flex items-center text-xs font-medium ${paymentStatus.color}`}>
                  <paymentStatus.icon className="h-4 w-4 mr-1" />
                  {paymentStatus.label}
                </span>
              </div>
            </div>
          );
        })}
        {filteredAndSortedReservas.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-brand-gray-500">
                Nenhuma reserva encontrada para os filtros selecionados.
            </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
