import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, Check } from 'lucide-react';
import { Reserva } from '../../types';
import Button from '../Forms/Button';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reservaId: string, creditAmount: number, reason: string) => void;
  reserva: Reserva | null;
}

const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, onConfirm, reserva }) => {
  const [isBadWeather, setIsBadWeather] = useState(false);

  const cancellationInfo = useMemo(() => {
    if (!reserva) return null;

    const reservaDate = parseDateStringAsLocal(reserva.date);
    const [hours, minutes] = reserva.start_time.split(':').map(Number);
    reservaDate.setHours(hours, minutes, 0, 0);
    const reservaStartDateTime = reservaDate;
    
    const hoursUntilReservation = differenceInHours(reservaStartDateTime, new Date());
    const originalPrice = reserva.total_price || 0;

    if (isBadWeather) {
      return {
        policy: 'Mau tempo',
        creditPercentage: 100,
        creditAmount: originalPrice,
        message: 'Reagendamento ou crédito integral será concedido devido ao mau tempo.',
        color: 'text-blue-500',
      };
    }
    
    if (hoursUntilReservation >= 24) {
      return {
        policy: 'Cancelamento com +24h de antecedência',
        creditPercentage: 100,
        creditAmount: originalPrice,
        message: 'Você receberá 100% do valor pago como crédito para futuras reservas.',
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
      policy: 'Cancelamento com -12h de antecedência',
      creditPercentage: 0,
      creditAmount: 0,
      message: 'Nenhum crédito será concedido para cancelamentos com menos de 12 horas de antecedência.',
      color: 'text-red-500',
    };
  }, [reserva, isBadWeather]);

  if (!reserva) return null;

  const handleConfirm = () => {
    if (cancellationInfo) {
      onConfirm(reserva.id, cancellationInfo.creditAmount, cancellationInfo.policy);
    }
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
                Confirmar Cancelamento
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-brand-gray-600 dark:text-brand-gray-400">
                Você está prestes a cancelar a reserva de <strong className="text-brand-gray-800 dark:text-white">{reserva.clientName}</strong> para o dia <strong className="text-brand-gray-800 dark:text-white">{format(parseDateStringAsLocal(reserva.date), 'dd/MM/yyyy', { locale: ptBR })}</strong> às <strong className="text-brand-gray-800 dark:text-white">{reserva.start_time}</strong>.
              </p>
              
              <div className={`p-4 rounded-lg border-l-4 ${cancellationInfo?.color.replace('text-', 'border-')} ${cancellationInfo?.color.replace('text-', 'bg-').replace('-500', '-50')} dark:${cancellationInfo?.color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
                <h4 className={`font-bold ${cancellationInfo?.color}`}>{cancellationInfo?.policy}</h4>
                <p className="text-sm text-brand-gray-700 dark:text-brand-gray-300 mt-1">{cancellationInfo?.message}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Crédito a ser gerado:</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {(cancellationInfo?.creditAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="flex items-center justify-center pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isBadWeather ? 'bg-blue-500 border-blue-500' : 'border-brand-gray-300 dark:border-brand-gray-600'}`}>
                    {isBadWeather && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <input type="checkbox" checked={isBadWeather} onChange={e => setIsBadWeather(e.target.checked)} className="hidden" />
                  <span className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 flex items-center"><Shield className="h-4 w-4 mr-1.5 text-blue-500" /> Cancelamento por mau tempo (crédito integral)</span>
                </label>
              </div>
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

export default CancellationModal;
