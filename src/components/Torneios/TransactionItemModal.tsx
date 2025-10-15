import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign } from 'lucide-react';
import Button from '../Forms/Button';
import Input from '../Forms/Input';

interface TransactionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { description: string; amount: number }) => void;
  initialData: { id: string; description: string; amount: number; } | null;
  type: 'expense' | 'sponsor';
}

const TransactionItemModal: React.FC<TransactionItemModalProps> = ({ isOpen, onClose, onSave, initialData, type }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const isEditing = !!initialData;
  const title = `${isEditing ? 'Editar' : 'Nova'} ${type === 'expense' ? 'Despesa' : 'Receita'}`;

  useEffect(() => {
    if (isOpen) {
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount ? String(initialData.amount).replace('.', ',') : '');
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (description.trim() && numericAmount > 0) {
      onSave({ description, amount: numericAmount });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">{title}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'Ex: Troféus, Bolas' : 'Ex: Patrocínio Loja X'}
                required
              />
              <Input
                label="Valor (R$)"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                icon={<DollarSign className="h-4 w-4 text-brand-gray-400" />}
                required
              />
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Salvar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionItemModal;
