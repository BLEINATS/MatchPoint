import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, FileText, Calendar, Tag, Hash } from 'lucide-react';
import { PlanoAula } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';

interface PlanoAulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plano: Omit<PlanoAula, 'id' | 'arena_id' | 'created_at'> | PlanoAula) => void;
  initialData: PlanoAula | null;
}

const PlanoAulaModal: React.FC<PlanoAulaModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    duration_type: 'mensal' as PlanoAula['duration_type'],
    price: '',
    num_aulas: '' as string | number,
    description: '',
    is_active: true,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        duration_type: initialData.duration_type,
        price: String(initialData.price).replace('.', ','),
        num_aulas: initialData.num_aulas === null ? '' : String(initialData.num_aulas),
        description: initialData.description,
        is_active: initialData.is_active,
      });
    } else {
      setFormData({
        name: '',
        duration_type: 'mensal',
        price: '',
        num_aulas: '',
        description: '',
        is_active: true,
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      price: parseFloat(formData.price.replace(',', '.')) || 0,
      num_aulas: formData.num_aulas === '' ? null : Number(formData.num_aulas),
    };
    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">{isEditing ? 'Editar Plano de Aula' : 'Novo Plano de Aula'}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Nome do Plano" name="name" value={formData.name} onChange={handleChange} icon={<Tag className="h-4 w-4 text-brand-gray-400"/>} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-brand-gray-400"/>
                    Duração
                  </label>
                  <select name="duration_type" value={formData.duration_type} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white">
                    <option value="avulso">Avulso</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <Input label="Preço (R$)" name="price" type="text" inputMode="decimal" value={formData.price} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />
              </div>
              <Input label="Número de Aulas (créditos)" name="num_aulas" type="number" value={formData.num_aulas} onChange={handleChange} icon={<Hash className="h-4 w-4 text-brand-gray-400"/>} placeholder="Deixe em branco para ilimitado" />
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-brand-gray-400"/>
                    Descrição
                </label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white" placeholder="Ex: 8 aulas no mês, válidas por 30 dias."></textarea>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                <span className="text-sm font-medium">Plano Ativo</span>
                <ToggleSwitch enabled={formData.is_active} setEnabled={(val) => setFormData(p => ({...p, is_active: val}))} />
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

export default PlanoAulaModal;
