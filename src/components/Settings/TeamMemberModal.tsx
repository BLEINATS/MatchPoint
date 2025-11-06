import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Key } from 'lucide-react';
import { Profile, PermissionLevel, ProfilePermissions } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { v4 as uuidv4 } from 'uuid';
import { PERMISSIONS_CONFIG } from '../../config/permissions';

type PermissionKey = keyof ProfilePermissions;

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Profile, 'id' | 'created_at'> | Profile) => void;
  initialData: Profile | null;
}

const defaultPermissions: ProfilePermissions = {
  reservas: 'view',
  quadras: 'none',
  gerenciamento_arena: 'none',
  torneios: 'none',
  eventos: 'none',
  financeiro: 'none',
  gamification: 'none',
  planos_aulas: 'none',
};

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: defaultPermissions
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        password: '', // Don't expose existing password
        permissions: {
          ...defaultPermissions,
          ...initialData.permissions,
        },
      });
    } else {
      setFormData({
        name: '', email: '', password: '',
        permissions: defaultPermissions
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      id: initialData?.id || `profile_${uuidv4()}`,
      role: 'funcionario' as 'funcionario',
    };
    if (!isEditing && !dataToSave.password) {
      alert("A senha é obrigatória para novos membros.");
      return;
    }
    onSave(dataToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (key: PermissionKey, value: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value,
      },
    }));
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
              <h3 className="text-xl font-semibold">{isEditing ? 'Editar Membro da Equipe' : 'Novo Membro da Equipe'}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label="E-mail de Acesso" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label={isEditing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso'} name="password" type="password" value={formData.password} onChange={handleChange} icon={<Key className="h-4 w-4 text-brand-gray-400"/>} required={!isEditing} />
              
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Permissões</label>
                <div className="space-y-4">
                  {Object.entries(PERMISSIONS_CONFIG).map(([key, config]) => (
                    <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50">
                      <span className="text-sm font-medium">{config.label}</span>
                      <select
                        value={formData.permissions[key as PermissionKey]}
                        onChange={(e) => handlePermissionChange(key as PermissionKey, e.target.value)}
                        className="form-select text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 w-full"
                      >
                        {Object.entries(config.levels).map(([levelValue, levelLabel]) => (
                          <option key={levelValue} value={levelValue}>{levelLabel}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
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

export default TeamMemberModal;
