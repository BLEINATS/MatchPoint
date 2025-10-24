import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { Plan } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';
import { v4 as uuidv4 } from 'uuid';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Plan) => void;
  initialData: Plan | null;
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    features: [''],
    is_active: true,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          price: String(initialData.price),
          features: initialData.features.length > 0 ? initialData.features : [''],
          is_active: initialData.is_active,
        });
      } else {
        setFormData({ name: '', price: '', features: [''], is_active: true });
      }
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave: Plan = {
      id: initialData?.id || `plan_${uuidv4()}`,
      name: formData.name,
      price: parseFloat(formData.price.replace(',', '.')) || 0,
      features: formData.features.filter(f => f.trim() !== ''),
      is_active: formData.is_active,
    };
    onSave(dataToSave);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
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
              <h3 className="text-xl font-semibold">{isEditing ? 'Editar Plano' : 'Novo Plano de Assinatura'}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <Input label="Nome do Plano" name="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
              <Input label="Preço Mensal (R$)" name="price" type="text" inputMode="decimal" value={formData.price} onChange={e => setFormData(p => ({...p, price: e.target.value}))} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />
              
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Recursos do Plano</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder={`Recurso ${index + 1}`}
                        icon={<CheckSquare className="h-4 w-4 text-brand-gray-400"/>}
                        className="flex-grow"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)} disabled={formData.features.length <= 1} className="text-red-500 disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-3">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Recurso
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                <span className="text-sm font-medium">Plano Ativo</span>
                <ToggleSwitch enabled={formData.is_active} setEnabled={(val) => setFormData(p => ({...p, is_active: val}))} />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/> Salvar Plano</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PlanModal;
