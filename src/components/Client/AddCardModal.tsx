import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, CreditCard, User, Calendar, Lock } from 'lucide-react';
import { CreditCardInfo } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { maskCardNumber, maskExpiryDate } from '../../utils/masks';
import { useToast } from '../../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: CreditCardInfo) => void;
}

const getCardBrand = (cardNumber: string): string => {
  const firstDigit = cardNumber.charAt(0);
  if (firstDigit === '4') return 'Visa';
  if (firstDigit === '5') return 'Mastercard';
  if (firstDigit === '3') return 'American Express';
  return 'Desconhecido';
};

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cardholder_name: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const { addToast } = useToast();

  const handleSave = () => {
    if (formData.cardNumber.replace(/\s/g, '').length < 16) {
      addToast({ message: 'Número do cartão inválido.', type: 'error' });
      return;
    }
    if (formData.expiryDate.length < 5) {
      addToast({ message: 'Data de validade inválida.', type: 'error' });
      return;
    }
    if (formData.cvv.length < 3) {
      addToast({ message: 'CVV inválido.', type: 'error' });
      return;
    }

    const newCard: CreditCardInfo = {
      id: `card_${uuidv4()}`,
      cardholder_name: formData.cardholder_name,
      last4: formData.cardNumber.slice(-4),
      brand: getCardBrand(formData.cardNumber),
    };
    onSave(newCard);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cardNumber') value = maskCardNumber(value);
    if (name === 'expiryDate') value = maskExpiryDate(value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-brand-blue-500" />
                Adicionar Cartão
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Nome no Cartão" name="cardholder_name" value={formData.cardholder_name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label="Número do Cartão" name="cardNumber" value={formData.cardNumber} onChange={handleChange} icon={<CreditCard className="h-4 w-4 text-brand-gray-400"/>} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Validade (MM/AA)" name="expiryDate" value={formData.expiryDate} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} required />
                <Input label="CVV" name="cvv" type="password" value={formData.cvv} onChange={handleChange} icon={<Lock className="h-4 w-4 text-brand-gray-400"/>} required maxLength={4} />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2"/> Adicionar Cartão
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddCardModal;
