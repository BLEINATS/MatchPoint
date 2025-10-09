import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, Package } from 'lucide-react';
import { RentalItem } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';

interface RentalItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<RentalItem, 'id' | 'arena_id' | 'created_at'> | RentalItem) => void;
  initialData: RentalItem | null;
}

const RentalItemModal: React.FC<RentalItemModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        price: initialData.price.toString().replace('.', ','),
        stock: initialData.stock.toString(),
      });
    } else {
      setFormData({ name: '', price: '', stock: '' });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave = {
      name: formData.name,
      price: parseFloat(formData.price.replace(',', '.')) || 0,
      stock: parseInt(formData.stock, 10) || 0,
    };
    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">{isEditing ? 'Editar Item' : 'Novo Item para Aluguel'}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Nome do Item" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Preço (R$)" name="price" type="text" inputMode="decimal" value={formData.price} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label="Quantidade em Estoque" name="stock" type="number" value={formData.stock} onChange={handleChange} icon={<Package className="h-4 w-4 text-brand-gray-400"/>} required />
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

export default RentalItemModal;
