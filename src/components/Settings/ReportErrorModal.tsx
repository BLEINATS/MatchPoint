import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle } from 'lucide-react';
import Button from '../Forms/Button';
import { useToast } from '../../context/ToastContext';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportErrorModal: React.FC<ReportErrorModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { addToast } = useToast();

  const handleConfirm = () => {
    if (!message.trim()) {
      addToast({ message: 'Por favor, descreva o erro que você encontrou.', type: 'error' });
      return;
    }
    setIsSending(true);
    // Simulate sending the report
    setTimeout(() => {
      setIsSending(false);
      addToast({ message: 'Relatório de erro enviado com sucesso. Agradecemos seu feedback!', type: 'success' });
      setMessage('');
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Reportar um Erro
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Descreva o problema que você encontrou com o máximo de detalhes possível. Se possível, inclua os passos para reproduzir o erro.
              </p>
              <div>
                <label htmlFor="error-message" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Descrição do Erro:</label>
                <textarea
                  id="error-message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                  placeholder="Ex: Ao tentar criar uma reserva recorrente, o sistema não salvou a data final..."
                />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSending}>Cancelar</Button>
              <Button onClick={handleConfirm} isLoading={isSending} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-2" /> Enviar Relatório
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportErrorModal;
