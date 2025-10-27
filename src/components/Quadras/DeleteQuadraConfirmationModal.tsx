import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Quadra } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';

interface DeleteQuadraConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quadra: Quadra | null;
}

const DeleteQuadraConfirmationModal: React.FC<DeleteQuadraConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quadra,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
    }
  }, [isOpen]);

  if (!quadra) return null;

  const isMatch = confirmationInput === quadra.name;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-brand-gray-900 rounded-2xl w-full max-w-lg shadow-2xl p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
              <X className="h-5 w-5 text-brand-gray-500" />
            </button>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/50 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-center text-brand-gray-900 dark:text-white">
              Ação Irreversível
            </h3>
            <div className="text-brand-gray-600 dark:text-brand-gray-400 mt-4 text-sm space-y-3 text-center">
              <p>Você está prestes a excluir permanentemente a quadra <strong>"{quadra.name}"</strong>.</p>
              <p className="font-bold text-red-600 dark:text-red-400">
                Esta ação NÃO PODE ser desfeita e resultará na perda de todo o histórico associado a esta quadra, incluindo reservas, aulas e dados financeiros.
              </p>
              <p>Para confirmar, por favor, digite o nome exato da quadra no campo abaixo.</p>
            </div>
            <div className="mt-6">
              <Input
                label={`Digite "${quadra.name}" para confirmar`}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Button 
                onClick={onConfirm} 
                disabled={!isMatch}
                className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 disabled:bg-brand-gray-300 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed" 
                size="lg"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Eu entendo, excluir permanentemente
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full" size="lg">
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteQuadraConfirmationModal;
