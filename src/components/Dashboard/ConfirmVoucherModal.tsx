import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { RedeemedVoucher } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';

interface ConfirmVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (voucher: RedeemedVoucher) => void;
  voucher: RedeemedVoucher | null;
  getItemName: (voucher: RedeemedVoucher) => string;
}

const ConfirmVoucherModal: React.FC<ConfirmVoucherModalProps> = ({ isOpen, onClose, onConfirm, voucher, getItemName }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInputCode('');
      setError('');
    }
  }, [isOpen]);

  if (!voucher) return null;

  const handleValidation = () => {
    if (voucher.code && inputCode.trim().toUpperCase() === voucher.code.toUpperCase()) {
      onConfirm(voucher);
    } else {
      setError('Código inválido. Por favor, verifique e tente novamente.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Confirmar Entrega</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Para confirmar a entrega do item <strong className="text-brand-gray-800 dark:text-white">{getItemName(voucher)}</strong>, por favor, digite o código do voucher fornecido pelo cliente.
              </p>
              
              <Input
                label="Código de Confirmação"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setError('');
                }}
                placeholder="Digite o código aqui"
                autoFocus
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleValidation} disabled={!inputCode.trim()}>
                <CheckCircle className="h-4 w-4 mr-2"/> Validar e Entregar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmVoucherModal;
