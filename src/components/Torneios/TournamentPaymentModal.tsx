import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, CreditCard } from 'lucide-react';
import Button from '../Forms/Button';
import { Torneio, Participant, Profile } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TournamentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'pix' | 'cartao' | 'dinheiro') => void;
  torneio: Torneio;
  participant: Participant;
  playerProfile: Profile;
  isProcessing: boolean;
}

const TournamentPaymentModal: React.FC<TournamentPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  torneio,
  participant,
  playerProfile,
  isProcessing,
}) => {
  if (!participant) return null;

  const category = torneio.categories.find(c => c.id === participant.categoryId);
  const amountToPay = category?.registration_fee || torneio.registration_fee || 0;

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
              <h3 className="text-xl font-semibold">Pagamento da Inscrição</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-brand-gray-600 dark:text-brand-gray-400">
                Confirmar o pagamento de{' '}
                <strong className="text-green-600 dark:text-green-400">{formatCurrency(amountToPay)}</strong> para a inscrição de{' '}
                <strong>{playerProfile.name}</strong> no torneio <strong>"{torneio.name}"</strong>.
              </p>
              <p className="text-sm font-medium mt-4">Selecione o método de pagamento (simulação):</p>
              <div className="flex justify-center gap-4 pt-2">
                <Button onClick={() => onConfirm('pix')} isLoading={isProcessing} className="bg-sky-500 hover:bg-sky-600">
                  <DollarSign className="h-4 w-4 mr-2" /> Pagar com PIX
                </Button>
                <Button onClick={() => onConfirm('cartao')} isLoading={isProcessing} className="bg-indigo-500 hover:bg-indigo-600">
                  <CreditCard className="h-4 w-4 mr-2" /> Pagar com Cartão
                </Button>
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TournamentPaymentModal;
