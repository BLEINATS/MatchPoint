import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { Reserva } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservation: Reserva | null;
  amountToPay: number;
  isProcessing: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  amountToPay,
  isProcessing,
}) => {
  if (!reservation) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[80]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-brand-blue-500" />
                Confirmar Pagamento
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Resumo da Reserva</p>
                <div className="mt-2 p-4 bg-brand-gray-50 dark:bg-brand-gray-800 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Data:</span>
                    <span className="text-sm font-semibold">{format(parseDateStringAsLocal(reservation.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Horário:</span>
                    <span className="text-sm font-semibold">{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cliente:</span>
                    <span className="text-sm font-semibold">{reservation.clientName}</span>
                  </div>
                </div>
              </div>

              <div className="text-center py-4 border-y border-brand-gray-200 dark:border-brand-gray-700">
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Valor a Pagar</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(amountToPay)}
                </p>
              </div>

              <div className="text-center">
                <p className="font-semibold">Método de Pagamento</p>
                <p className="text-sm text-brand-gray-500">
                  A integração com o gateway de pagamento (Asaas) será implementada aqui.
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="p-2 border rounded-md">PIX</div>
                  <div className="p-2 border rounded-md">Cartão</div>
                </div>
              </div>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button onClick={onConfirm} isLoading={isProcessing} disabled={isProcessing}>
                {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
