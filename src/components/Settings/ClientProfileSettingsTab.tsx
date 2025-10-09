import React, { useState, useRef } from 'react';
import { Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../Forms/Input';
import Button from '../Forms/Button';
import { User, Mail, Loader2, Image as ImageIcon, Trash2, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { maskPhone } from '../../utils/masks';

interface ClientProfileSettingsTabProps {
  formData: Partial<Profile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Profile>>>;
}

const ClientProfileSettingsTab: React.FC<ClientProfileSettingsTabProps> = ({ formData, setFormData }) => {
  const { profile, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'phone') {
      processedValue = maskPhone(value);
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (formData.avatar_url) {
        const oldAvatarPath = formData.avatar_url.split('/avatars/')[1];
        if (oldAvatarPath) {
          await supabase.storage.from('avatars').remove([oldAvatarPath]);
        }
      }

      const filePath = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!publicUrlData.publicUrl) throw new Error("Não foi possível obter a URL pública do avatar.");

      const newAvatarUrl = publicUrlData.publicUrl;
      await updateProfile({ avatar_url: newAvatarUrl });
      setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      addToast({ message: "Avatar atualizado com sucesso!", type: 'success' });

    } catch (error: any) {
      addToast({ message: error.message || 'Falha no upload do avatar.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!profile || !formData.avatar_url) return;
    
    setIsUploading(true);
    try {
      const oldAvatarPath = formData.avatar_url.split('/avatars/')[1];
      if (oldAvatarPath) {
        await supabase.storage.from('avatars').remove([oldAvatarPath]);
      }
      await updateProfile({ avatar_url: null });
      setFormData(prev => ({ ...prev, avatar_url: null }));
      addToast({ message: "Avatar removido.", type: 'info' });
    } catch (error: any) {
      addToast({ message: error.message || 'Falha ao remover o avatar.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700 flex items-center justify-center overflow-hidden shadow-md">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-brand-gray-400 animate-spin" />
            ) : formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-brand-gray-400" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button type="button" size="sm" onClick={() => avatarInputRef.current?.click()} className="mb-1">Alterar</Button>
            {formData.avatar_url && <Button type="button" variant="ghost" size="sm" onClick={removeAvatar} className="!text-white hover:!bg-white/10"><Trash2 className="h-4 w-4" /></Button>}
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleAvatarUpload}
            disabled={isUploading}
          />
        </div>
        <div className="flex-1 w-full text-center sm:text-left">
          <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-white">{formData.name}</h2>
          <p className="text-brand-gray-500 dark:text-brand-gray-400">{formData.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Nome Completo" 
          name="name" 
          value={formData.name || ''}
          onChange={handleChange}
          placeholder="Seu nome completo" 
          icon={<User className="h-4 w-4 text-brand-gray-400" />} 
        />
        <Input 
          label="E-mail" 
          name="email" 
          type="email" 
          value={formData.email || ''} 
          icon={<Mail className="h-4 w-4 text-brand-gray-400" />} 
          disabled
        />
        <Input 
          label="Telefone" 
          name="phone" 
          value={formData.phone || ''}
          onChange={handleChange}
          placeholder="(00) 90000-0000" 
          icon={<Phone className="h-4 w-4 text-brand-gray-400" />} 
        />
      </div>
    </div>
  );
};

export default ClientProfileSettingsTab;
