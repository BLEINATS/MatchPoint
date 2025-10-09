import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, Sparkles, Trash2 } from 'lucide-react';
import { Professor } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { maskPhone } from '../../utils/masks';

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (professor: Omit<Professor, 'id' | 'arena_id' | 'created_at'> | Professor) => void;
  onDelete: (id: string) => void;
  initialData: Professor | null;
}

const ProfessorModal: React.FC<ProfessorModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || '',
        specialties: initialData.specialties || [],
      });
    } else {
      setFormData({ name: '', email: '', phone: '', specialties: [] });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (isEditing && initialData) {
      onSave({ ...initialData, ...formData });
    } else {
      onSave(formData);
    }
  };
  
  const handleDelete = () => {
    if (initialData) {
      onDelete(initialData.id);
    }
  };

  const handleSpecialtiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const specialtiesArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, specialties: specialtiesArray }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') {
      finalValue = maskPhone(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isEditing ? 'Editar Professor' : 'Adicionar Novo Professor'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} required />
                <Input label="Telefone" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
              </div>
              <Input 
                label="Especialidades" 
                name="specialties" 
                value={formData.specialties.join(', ')} 
                onChange={handleSpecialtiesChange} 
                icon={<Sparkles className="h-4 w-4 text-brand-gray-400"/>}
                placeholder="Ex: Beach Tennis, Futevôlei, Funcional"
                />
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div>
                {isEditing && (
                  <Button variant="outline" onClick={handleDelete} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Adicionar Professor'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfessorModal;
