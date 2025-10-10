import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, Tag, Calendar } from 'lucide-react';
import { FinanceTransaction } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'arena_id' | 'created_at'> | FinanceTransaction) => void;
  initialData: FinanceTransaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'receita' as 'receita' | 'despesa',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description,
        amount: String(initialData.amount).replace('.', ','),
        type: initialData.type,
        category: initialData.category,
        date: initialData.date,
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: 'receita',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      amount: parseFloat(formData.amount.replace(',', '.')) || 0,
    };
    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
              <h3 className="text-xl font-semibold">{isEditing ? 'Editar Transação' : 'Nova Transação Financeira'}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Descrição" name="description" value={formData.description} onChange={handleChange} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Valor (R$)" name="amount" type="text" inputMode="decimal" value={formData.amount} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white">
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Categoria" name="category" value={formData.category} onChange={handleChange} icon={<Tag className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Manutenção, Vendas" />
                <Input label="Data" name="date" type="date" value={formData.date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/> Salvar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;
