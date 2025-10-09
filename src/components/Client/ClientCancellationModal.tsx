import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Reserva } from '../../types';
import Button from '../Forms/Button';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface ClientCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reservaId: string) => void;
  reserva: Reserva;
  policyText?: string | null;
}

const ClientCancellationModal: React.FC<ClientCancellationModalProps> = ({ isOpen, onClose, onConfirm, reserva, policyText }) => {

  const cancellationInfo = useMemo(() => {
    const reservaDate = parseDateStringAsLocal(reserva.date);
    const [hours, minutes] = reserva.start_time.split(':').map(Number);
    reservaDate.setHours(hours, minutes, 0, 0);
    const reservaStartDateTime = reservaDate;
    
    const hoursUntilReservation = differenceInHours(reservaStartDateTime, new Date());
    const originalPrice = reserva.total_price || 0;

    if (hoursUntilReservation >= 24) {
      return {
        policy: 'Cancelamento com +24h',
        creditPercentage: 100,
        creditAmount: originalPrice,
        message: 'Você receberá 100% do valor pago como crédito.',
        color: 'text-green-500',
      };
    }
    
    if (hoursUntilReservation >= 12) {
      return {
        policy: 'Cancelamento entre 12h e 24h',
        creditPercentage: 50,
        creditAmount: originalPrice * 0.5,
        message: 'Você receberá 50% do valor pago como crédito.',
        color: 'text-yellow-500',
      };
    }

    return {
      policy: 'Cancelamento com -12h',
      creditPercentage: 0,
      creditAmount: 0,
      message: 'Nenhum crédito será concedido para cancelamentos com menos de 12 horas de antecedência.',
      color: 'text-red-500',
    };
  }, [reserva]);

  const handleConfirm = () => {
    onConfirm(reserva.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3 text-yellow-500" />
                Cancelar Reserva
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-brand-gray-600 dark:text-brand-gray-400">
                Você está cancelando sua reserva para o dia <strong className="text-brand-gray-800 dark:text-white">{format(parseDateStringAsLocal(reserva.date), 'dd/MM/yyyy', { locale: ptBR })}</strong> às <strong className="text-brand-gray-800 dark:text-white">{reserva.start_time.slice(0,5)}</strong>.
              </p>
              
              <div className={`p-4 rounded-lg border-l-4 ${cancellationInfo.color.replace('text-', 'border-')} ${cancellationInfo.color.replace('text-', 'bg-').replace('-500', '-50')} dark:${cancellationInfo.color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
                <h4 className={`font-bold ${cancellationInfo.color}`}>{cancellationInfo.policy}</h4>
                <p className="text-sm text-brand-gray-700 dark:text-brand-gray-300 mt-1">{cancellationInfo.message}</p>
              </div>

              <div className="text-center py-4">
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Crédito a ser gerado em sua conta:</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(cancellationInfo.creditAmount)}
                </p>
              </div>

              {policyText && (
                <div className="p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800 border border-brand-gray-200 dark:border-brand-gray-700">
                    <h5 className="font-semibold text-sm mb-2 flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-brand-gray-500" /> Política Completa da Arena</h5>
                    <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {policyText}
                    </div>
                </div>
              )}
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Voltar</Button>
              <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500">
                Confirmar Cancelamento
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClientCancellationModal;
