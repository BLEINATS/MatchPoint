import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, CreditCard, Banknote } from 'lucide-react';
import Button from '../Forms/Button';

type PaymentMethod = 'pix' | 'cartao' | 'dinheiro';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  participantName: string;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'pix', label: 'PIX', icon: DollarSign },
  { id: 'cartao', label: 'Cartão', icon: CreditCard },
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
];

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({ isOpen, onClose, onConfirm, participantName }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');

  const handleConfirm = () => {
    onConfirm(selectedMethod);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Confirmar Pagamento</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Selecione o método de pagamento para a inscrição de <strong>{participantName}</strong>.
              </p>
              <div className="space-y-3">
                {paymentMethods.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedMethod === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedMethod(id)}
                      className={`w-full p-4 border-2 rounded-lg text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'border-brand-blue-500 bg-white'
                          : 'border-transparent bg-brand-gray-50 dark:bg-brand-gray-800 hover:border-brand-gray-300 dark:hover:border-brand-gray-600'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-blue-500' : 'text-brand-gray-500'}`} />
                      <span className={`font-semibold ${isSelected ? 'text-brand-gray-900' : 'text-brand-gray-700 dark:text-brand-gray-300'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm}>Confirmar Pagamento</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentConfirmationModal;
