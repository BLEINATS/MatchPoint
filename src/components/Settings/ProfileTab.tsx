import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Arena } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Input from '../Forms/Input';
import Button from '../Forms/Button';
import { Building, User, Phone, Mail, Hash, Map, MapPin, Link as LinkIcon, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { maskCEP, maskPhone, maskCPFOrCNPJ } from '../../utils/masks';
import { localUploadPhoto, localDeletePhoto } from '../../lib/localApi';

// Define types for IBGE API response
interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

interface ProfileTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ formData, setFormData }) => {
  const { arena, updateArena } = useAuth();
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCities, setIsFetchingCities] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch states from IBGE API on component mount
  useEffect(() => {
    axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        setStates(response.data);
      })
      .catch(error => console.error("Erro ao buscar estados:", error));
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.state) {
      const selectedState = states.find(s => s.sigla === formData.state);
      if (selectedState) {
        setIsFetchingCities(true);
        setCities([]); // Clear previous cities
        axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState.id}/municipios?orderBy=nome`)
          .then(response => {
            setCities(response.data);
          })
          .catch(error => console.error("Erro ao buscar cidades:", error))
          .finally(() => setIsFetchingCities(false));
      }
    } else {
      setCities([]);
    }
  }, [formData.state, states]);

  // Auto-generate Google Maps link when address fields change
  useEffect(() => {
    const { address, number, neighborhood, city, state } = formData;
    if (address && city && state) {
      const fullAddress = [
        address,
        number,
        neighborhood,
        city,
        state,
        'Brasil'
      ].filter(Boolean).join(', ');
      
      const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
      
      // Only update if the link has changed
      if (formData.google_maps_link !== googleMapsLink) {
        setFormData(prev => ({ ...prev, google_maps_link: googleMapsLink }));
      }
    }
  }, [formData.address, formData.number, formData.neighborhood, formData.city, formData.state, formData.google_maps_link, setFormData]);

  const handleCepBlur = async () => {
    if (!formData.cep) return;
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsFetchingCep(true);
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'cnpj_cpf') {
      processedValue = maskCPFOrCNPJ(value);
    } else if (name === 'contact_phone') {
      processedValue = maskPhone(value);
    } else if (name === 'cep') {
      processedValue = maskCEP(value);
    } else if (name === 'slug') {
      processedValue = value
        .toLowerCase()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/[^\w-]+/g, '') // remove all non-word chars
        .replace(/--+/g, '-') // replace multiple - with single -
        .replace(/^-+/, '') // trim - from start of text
        .replace(/-+$/, ''); // trim - from end of text
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!arena) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (formData.logo_url) {
        await localDeletePhoto(formData.logo_url);
      }
      const { publicUrl } = await localUploadPhoto(file);
      await updateArena({ logo_url: publicUrl });
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));

    } catch (error: any) {
      alert(error.message || 'Falha no upload do logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!arena || !formData.logo_url) return;
    
    setIsUploading(true);
    try {
      await localDeletePhoto(formData.logo_url);
      await updateArena({ logo_url: '' });
      setFormData(prev => ({ ...prev, logo_url: '' }));
    } catch (error: any) {
      alert(error.message || 'Falha ao remover o logo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Section title="Perfil da Arena" icon={Building}>
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md">
                {isUploading ? (
                    <Loader2 className="w-10 h-10 text-brand-gray-400 animate-spin" />
                ) : formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo da Arena" className="w-full h-full object-contain" />
                ) : (
                    <ImageIcon className="w-10 h-10 text-brand-gray-400" />
                )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button type="button" size="sm" onClick={() => logoInputRef.current?.click()} className="mb-1">Alterar</Button>
                {formData.logo_url && <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="!text-white hover:!bg-white/10"><Trash2 className="h-4 w-4" /></Button>}
            </div>
            <input
              type="file"
              ref={logoInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleLogoUpload}
              disabled={isUploading}
            />
          </div>
          <div className="flex-1 w-full text-center sm:text-left">
            <Input 
              label="Nome da Arena"
              name="name" 
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Arena Beira Rio" 
              className="text-xl font-bold !p-0 !border-0 !bg-transparent !shadow-none focus:!ring-0 dark:!text-white"
            />
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-brand-gray-500 sm:text-sm">matchplay.com/</span>
              </div>
              <input
                  name="slug"
                  value={formData.slug || ''}
                  onChange={handleChange}
                  className="w-full form-input rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:border-brand-blue-500 focus:ring-brand-blue-500 shadow-sm pl-[125px]"
                  placeholder="arena-beira-rio"
              />
            </div>
          </div>
        </div>
        
        <h4 className="text-md font-semibold text-brand-gray-800 dark:text-white pt-4">Dados de Contato e Fiscais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="CNPJ / CPF" 
            name="cnpj_cpf" 
            value={formData.cnpj_cpf || ''}
            onChange={handleChange}
            placeholder="00.000.000/0001-00" 
            icon={<Hash className="h-4 w-4 text-brand-gray-400" />} 
          />
          <Input 
            label="Nome do Responsável" 
            name="responsible_name" 
            value={formData.responsible_name || ''} 
            onChange={handleChange} 
            placeholder="Nome completo" 
            icon={<User className="h-4 w-4 text-brand-gray-400" />} 
          />
          <Input 
            label="Telefone de Contato" 
            name="contact_phone" 
            value={formData.contact_phone || ''}
            onChange={handleChange}
            placeholder="(00) 90000-0000" 
            icon={<Phone className="h-4 w-4 text-brand-gray-400" />} 
          />
          <Input 
            label="E-mail Público" 
            name="public_email" 
            type="email" 
            value={formData.public_email || ''} 
            onChange={handleChange} 
            placeholder="contato@suaarena.com" 
            icon={<Mail className="h-4 w-4 text-brand-gray-400" />} 
          />
        </div>
      </Section>

      <Section title="Endereço e Localização" icon={Map}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <Input 
              label="CEP" 
              name="cep" 
              value={formData.cep || ''}
              onChange={handleChange}
              onBlur={handleCepBlur}
              placeholder="00000-000" 
              icon={<MapPin className="h-4 w-4 text-brand-gray-400" />} 
            />
            {isFetchingCep && <Loader2 className="absolute right-3 top-9 h-5 w-5 text-brand-gray-400 animate-spin" />}
          </div>
          
          <FormSelect 
            label="Estado" 
            name="state" 
            value={formData.state || ''} 
            onChange={handleChange}
            disabled={states.length === 0}
          >
            <option value="">Selecione...</option>
            {states.map(s => <option key={s.id} value={s.sigla}>{s.nome}</option>)}
          </FormSelect>
          
          <div className="relative">
            <FormSelect 
              label="Cidade" 
              name="city" 
              value={formData.city || ''} 
              onChange={handleChange}
              disabled={!formData.state || isFetchingCities || cities.length === 0}
            >
              <option value="">{isFetchingCities ? 'Carregando...' : 'Selecione...'}</option>
              {cities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </FormSelect>
            {isFetchingCities && <Loader2 className="absolute right-10 top-9 h-5 w-5 text-brand-gray-400 animate-spin" />}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <Input label="Endereço" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Rua, Avenida..." />
          </div>
          <Input label="Número" name="number" value={formData.number || ''} onChange={handleChange} placeholder="123" />
        </div>
        <div className="mt-6">
          <Input label="Bairro" name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} placeholder="Seu Bairro" />
        </div>
        <div className="mt-6">
          <Input label="Link do Google Maps" name="google_maps_link" value={formData.google_maps_link || ''} onChange={handleChange} placeholder="https://maps.app.goo.gl/..." icon={<LinkIcon className="h-4 w-4 text-brand-gray-400" />} />
        </div>
      </Section>
    </div>
  );
};

// Helper components for the form
const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{label}</label>
    <select className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500 disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-700" {...props}>
      {children}
    </select>
  </div>
);

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4 flex items-center">
      <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export default ProfileTab;
