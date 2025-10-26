import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, CheckSquare, Plus, Trash2, Calendar, Users } from 'lucide-react';
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
    billing_cycle: 'monthly' as Plan['billing_cycle'],
    duration_days: '' as string | number,
    trial_days: '' as string | number,
    features: [''],
    is_active: true,
    max_quadras: '' as string | number,
    max_team_members: '' as string | number,
  });

  const isEditing = !!initialData;

  const handleFormValueChange = (name: keyof typeof formData, value: any) => {
    setFormData(prev => {
        const newState = { ...prev, [name]: value };

        if (name === 'trial_days' && Number(value) > 0) {
            newState.duration_days = '';
            newState.price = '0';
        }

        if (name === 'duration_days' && Number(value) > 0) {
            newState.trial_days = '';
        }
        
        if (name === 'price' && parseFloat(String(value).replace(',', '.')) > 0) {
            newState.trial_days = '';
        }

        return newState;
    });
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          price: String(initialData.price),
          billing_cycle: initialData.billing_cycle || 'monthly',
          duration_days: initialData.duration_days || '',
          trial_days: initialData.trial_days || '',
          features: initialData.features.length > 0 ? initialData.features : [''],
          is_active: initialData.is_active,
          max_quadras: initialData.max_quadras || '',
          max_team_members: initialData.max_team_members || '',
        });
      } else {
        setFormData({ name: '', price: '', billing_cycle: 'monthly', duration_days: '', trial_days: '', features: [''], is_active: true, max_quadras: '', max_team_members: '' });
      }
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave: Plan = {
      id: initialData?.id || `plan_${uuidv4()}`,
      name: formData.name,
      price: parseFloat(formData.price.replace(',', '.')) || 0,
      billing_cycle: formData.billing_cycle,
      duration_days: Number(formData.duration_days) || null,
      trial_days: Number(formData.trial_days) || null,
      features: formData.features.filter(f => f.trim() !== ''),
      is_active: formData.is_active,
      max_quadras: Number(formData.max_quadras) || null,
      max_team_members: Number(formData.max_team_members) || null,
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
              <Input label="Nome do Plano" name="name" value={formData.name} onChange={e => handleFormValueChange('name', e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Preço (R$)" name="price" type="text" inputMode="decimal" value={formData.price} onChange={e => handleFormValueChange('price', e.target.value)} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required disabled={!!formData.trial_days && Number(formData.trial_days) > 0} />
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Ciclo de Cobrança</label>
                  <select
                    name="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={e => handleFormValueChange('billing_cycle', e.target.value)}
                    disabled={!!formData.duration_days || (!!formData.trial_days && Number(formData.trial_days) > 0)}
                    className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-700"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Duração (dias)" name="duration_days" type="number" value={String(formData.duration_days)} onChange={e => handleFormValueChange('duration_days', e.target.value)} placeholder="Ex: 30 (plano com fim)" disabled={!!formData.trial_days && Number(formData.trial_days) > 0} />
                <Input label="Dias de Trial Grátis" name="trial_days" type="number" value={String(formData.trial_days)} onChange={e => handleFormValueChange('trial_days', e.target.value)} placeholder="Ex: 7 (plano gratuito)" />
              </div>
              <p className="text-xs text-brand-gray-500 -mt-2">Preencha Duração ou Dias de Trial. Um anula o outro. Trial define o preço como R$0.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Máximo de Quadras" name="max_quadras" type="number" value={String(formData.max_quadras)} onChange={e => handleFormValueChange('max_quadras', e.target.value)} placeholder="Deixe em branco para ilimitado" icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Máximo de Funcionários" name="max_team_members" type="number" value={String(formData.max_team_members)} onChange={e => handleFormValueChange('max_team_members', e.target.value)} placeholder="Deixe em branco para ilimitado" icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />
              </div>

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
                <ToggleSwitch enabled={formData.is_active} setEnabled={(val) => handleFormValueChange('is_active', val)} />
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
