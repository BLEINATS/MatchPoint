import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Profile } from '../../types';
import Button from '../Forms/Button';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  friend: Profile | null;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({ isOpen, onClose, onConfirm, friend }) => {
  const [message, setMessage] = useState('');

  if (!friend) return null;

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message.trim());
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
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <Send className="h-5 w-5 text-brand-blue-500" />
                Enviar Mensagem para {friend.name}
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Mensagem:</label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                  placeholder="Digite sua mensagem aqui..."
                />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-2" /> Enviar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SendMessageModal;
