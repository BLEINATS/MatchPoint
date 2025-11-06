import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import Button from '../Forms/Button';
import { AtletaAluguel } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PayAtletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  atleta: AtletaAluguel | null;
  isProcessing: boolean;
}

const PayAtletaModal: React.FC<PayAtletaModalProps> = ({ isOpen, onClose, onConfirm, atleta, isProcessing }) => {
  if (!atleta) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Pagar Taxa do Atleta</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-brand-gray-600 dark:text-brand-gray-400">
                Confirmar o pagamento de{' '}
                <strong className="text-green-600 dark:text-green-400">{formatCurrency(atleta.taxa_hora)}</strong> para a arena,
                referente à contratação de <strong>{atleta.name}</strong>.
              </p>
              <p className="text-xs text-brand-gray-500">
                O valor será repassado ao atleta pelo administrador da arena após a realização do jogo.
              </p>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
              <Button onClick={onConfirm} isLoading={isProcessing} className="bg-green-600 hover:bg-green-700">
                <DollarSign className="h-4 w-4 mr-2"/> Pagar Agora
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PayAtletaModal;
