import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import Button from '../Forms/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  icon = <AlertTriangle className="h-10 w-10 text-red-500" />,
}) => {
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
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/50 mb-6">
              {icon}
            </div>
            <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="text-brand-gray-600 dark:text-brand-gray-400 mt-4 text-sm">
              {message}
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={onClose} variant="outline" className="w-full" size="lg">
                {cancelText}
              </Button>
              <Button onClick={onConfirm} className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500" size="lg">
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
