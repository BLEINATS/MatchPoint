import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck, X } from 'lucide-react';
import Button from '../Forms/Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, email }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-brand-gray-900 rounded-2xl w-full max-w-md shadow-2xl text-center p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
              <X className="h-5 w-5 text-brand-gray-500" />
            </button>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/50 mb-6">
              <MailCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white">
              Confirme seu e-mail
            </h3>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-4">
              Enviamos um link de confirmação para <strong className="text-brand-gray-800 dark:text-brand-gray-200">{email}</strong>. Por favor, verifique sua caixa de entrada (e spam) para ativar sua conta.
            </p>
            <div className="mt-8">
              <Button onClick={onClose} className="w-full" size="lg">
                Entendi
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
