import React, { useState, useEffect } from 'react';
import { LayoutGrid, Settings, DollarSign, Image as ImageIcon, X, Save, Users } from 'lucide-react';
import { Quadra, PricingRule } from '../../types';
import Input from './Input';
import Button from './Button';
import { v4 as uuidv4 } from 'uuid';
import PricingRulesEditor from './PricingRulesEditor';

interface QuadraFormTabsProps {
  initialData: Quadra | null;
  onSave: (quadraData: Omit<Quadra, 'id' | 'created_at' | 'arena_id'>, photosToUpload: File[], photosToDelete: string[], pricingRules: PricingRule[]) => void;
  onClose: () => void;
  addToast: (toast: { message: string, type: 'success' | 'error' | 'info' }) => void;
}

const TABS = [
  { name: 'Básico', icon: LayoutGrid },
  { name: 'Detalhes', icon: Settings },
  { name: 'Precificação', icon: DollarSign },
  { name: 'Fotos', icon: ImageIcon },
];

const AMENITIES_LIST = [
  'Wi-Fi', 'Vestiário', 'Churrasqueira', 'Lanchonete', 'Estacionamento', 
  'Iluminação', 'Quadra Coberta', 'Som Ambiente', 'Ar Condicionado', 'Arquibancada', 'Chuveiro'
];

const defaultOperatingHours = {
  weekday: { start: '08:00', end: '22:00' },
  saturday: { start: '09:00', end: '20:00' },
  sunday: { start: '09:00', end: '18:00' },
};

const QuadraFormTabs: React.FC<QuadraFormTabsProps> = ({ initialData, onSave, onClose, addToast }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Omit<Quadra, 'created_at' | 'arena_id'>>({
    id: initialData?.id || '',
    name: initialData?.name || '',
    court_type: initialData?.court_type || 'Areia',
    sports: initialData?.sports || ['Beach Tennis'],
    status: initialData?.status || 'ativa',
    description: initialData?.description || '',
    rules: initialData?.rules || '',
    amenities: initialData?.amenities || [],
    horarios: initialData?.horarios || defaultOperatingHours,
    booking_duration_minutes: initialData?.booking_duration_minutes || 60,
    capacity: initialData?.capacity || 4,
    photos: initialData?.photos || [],
    cover_photo: initialData?.cover_photo || null,
  });
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [photosToUpload, setPhotosToUpload] = useState<File[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [localPhotoPreviews, setLocalPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name,
        court_type: initialData.court_type,
        sports: initialData.sports || ['Beach Tennis'],
        status: initialData.status,
        description: initialData.description || '',
        rules: initialData.rules || '',
        amenities: initialData.amenities || [],
        horarios: initialData.horarios || defaultOperatingHours,
        booking_duration_minutes: initialData.booking_duration_minutes || 60,
        capacity: initialData.capacity || 4,
        photos: initialData.photos,
        cover_photo: initialData.cover_photo,
      });
      setPricingRules((initialData.pricing_rules || []).map(r => ({...r, client_id: r.id || uuidv4() })));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOperatingHoursChange = (day: 'weekday' | 'saturday' | 'sunday', type: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [day]: { ...(prev.horarios?.[day] || {}), [type]: value },
      },
    }));
  };
  
  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const MAX_SIZE_MB = 5;
      const validFiles: File[] = [];
      const previews: string[] = [];

      for (const file of files) {
          if (file.size > MAX_SIZE_MB * 1024 * 1024) {
              addToast({
                  message: `O arquivo "${file.name}" excede o limite de ${MAX_SIZE_MB}MB e não foi adicionado.`,
                  type: 'error',
              });
          } else {
              validFiles.push(file);
              previews.push(URL.createObjectURL(file));
          }
      }

      setPhotosToUpload(prev => [...prev, ...validFiles]);
      setLocalPhotoPreviews(prev => [...prev, ...previews]);
    }
  };

  const removePhoto = (url: string, isLocal: boolean) => {
    if (isLocal) {
      const previewIndex = localPhotoPreviews.indexOf(url);
      if (previewIndex > -1) {
        setLocalPhotoPreviews(p => p.filter((_, i) => i !== previewIndex));
        setPhotosToUpload(p => p.filter((_, i) => i !== previewIndex));
        URL.revokeObjectURL(url);
      }
    } else {
      setFormData(p => ({ ...p, photos: p.photos.filter(photoUrl => photoUrl !== url) }));
      if (!url.startsWith('data:image')) {
        setPhotosToDelete(p => [...p, url]);
      }
    }
  };

  const setAsCover = (url: string) => {
    setFormData(p => ({ ...p, cover_photo: url }));
  };

  const handleSaveClick = async () => {
    // We don't convert photos to Base64 anymore.
    // We pass the File objects to the parent component, which will handle them (or ignore them for local storage).
    onSave(formData, photosToUpload, photosToDelete, pricingRules);
  };

  return (
    <>
      <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
          {initialData ? 'Editar Quadra' : 'Adicionar Nova Quadra'}
        </h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <X className="h-5 w-5 text-brand-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700">
          <nav className="flex -mb-px p-4 sm:px-6 space-x-2 sm:space-x-4 overflow-x-auto">
            {TABS.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`flex items-center whitespace-nowrap py-3 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === index
                    ? 'bg-blue-50 text-brand-blue-600 dark:bg-brand-gray-700 dark:text-white'
                    : 'text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400 dark:hover:text-white'
                }`}
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 0 && (
            <div className="space-y-4">
              <Input label="Nome da Quadra" name="name" value={formData.name} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo de Piso</label>
                <select name="court_type" value={formData.court_type} onChange={handleChange} className="form-select w-full rounded-md text-brand-gray-900 dark:text-white bg-white dark:bg-brand-gray-800 border-brand-gray-300 dark:border-brand-gray-600">
                    <option>Areia</option>
                    <option>Grama Sintética</option>
                    <option>Cimento</option>
                    <option>Saibro</option>
                    <option>Piso Rápido (Hard)</option>
                </select>
              </div>
            </div>
          )}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte Principal</label>
                  <select name="sports" value={formData.sports?.[0] || 'Beach Tennis'} onChange={(e) => setFormData(p => ({ ...p, sports: [e.target.value] }))} className="form-select w-full rounded-md text-brand-gray-900 dark:text-white bg-white dark:bg-brand-gray-800 border-brand-gray-300 dark:border-brand-gray-600">
                      <option>Beach Tennis</option>
                      <option>Futevôlei</option>
                      <option>Vôlei de Praia</option>
                      <option>Tênis</option>
                      <option>Padel</option>
                      <option>Futebol Society</option>
                  </select>
                </div>
                <Input label="Duração Padrão da Reserva (minutos)" name="booking_duration_minutes" type="number" value={formData.booking_duration_minutes} onChange={handleChange} />
              </div>
              <Input label="Capacidade de Jogadores" name="capacity" type="number" value={formData.capacity || ''} onChange={e => setFormData(p => ({...p, capacity: parseInt(e.target.value, 10) || undefined}))} icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <fieldset className="border p-4 rounded-md dark:border-brand-gray-700">
                  <legend className="text-sm font-medium px-1 dark:text-brand-gray-300">Segunda a Sexta</legend>
                  <div className="flex items-center gap-2">
                    <Input label="Início" type="time" value={formData.horarios?.weekday?.start || ''} onChange={(e) => handleOperatingHoursChange('weekday', 'start', e.target.value)} />
                    <Input label="Fim" type="time" value={formData.horarios?.weekday?.end || ''} onChange={(e) => handleOperatingHoursChange('weekday', 'end', e.target.value)} />
                  </div>
                </fieldset>
                <fieldset className="border p-4 rounded-md dark:border-brand-gray-700">
                  <legend className="text-sm font-medium px-1 dark:text-brand-gray-300">Sábado</legend>
                  <div className="flex items-center gap-2">
                    <Input label="Início" type="time" value={formData.horarios?.saturday?.start || ''} onChange={(e) => handleOperatingHoursChange('saturday', 'start', e.target.value)} />
                    <Input label="Fim" type="time" value={formData.horarios?.saturday?.end || ''} onChange={(e) => handleOperatingHoursChange('saturday', 'end', e.target.value)} />
                  </div>
                </fieldset>
                <fieldset className="border p-4 rounded-md dark:border-brand-gray-700">
                  <legend className="text-sm font-medium px-1 dark:text-brand-gray-300">Domingo</legend>
                  <div className="flex items-center gap-2">
                    <Input label="Início" type="time" value={formData.horarios?.sunday?.start || ''} onChange={(e) => handleOperatingHoursChange('sunday', 'start', e.target.value)} />
                    <Input label="Fim" type="time" value={formData.horarios?.sunday?.end || ''} onChange={(e) => handleOperatingHoursChange('sunday', 'end', e.target.value)} />
                  </div>
                </fieldset>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Comodidades</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AMENITIES_LIST.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded text-brand-blue-600 focus:ring-brand-blue-500"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                      />
                      <span className="text-sm text-brand-gray-800 dark:text-brand-gray-200">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Descrição da Quadra</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full form-textarea rounded-md text-brand-gray-900 dark:text-white bg-white dark:bg-brand-gray-800 border-brand-gray-300 dark:border-brand-gray-600"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Regras da Quadra</label>
                <textarea name="rules" value={formData.rules} onChange={handleChange} rows={3} className="w-full form-textarea rounded-md text-brand-gray-900 dark:text-white bg-white dark:bg-brand-gray-800 border-brand-gray-300 dark:border-brand-gray-600"></textarea>
              </div>
            </div>
          )}
          {activeTab === 2 && (
             <PricingRulesEditor rules={pricingRules} setRules={setPricingRules} />
          )}
          {activeTab === 3 && (
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Fotos da Quadra</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...formData.photos, ...localPhotoPreviews].map((url, index) => {
                  const isLocal = index >= formData.photos.length;
                  return (
                    <div key={url} className="relative group aspect-video">
                      <img src={url} alt={`Foto da quadra ${index + 1}`} className="rounded-md object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1">
                        <button onClick={() => removePhoto(url, isLocal)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                        <button onClick={() => setAsCover(url)} className="text-xs text-white bg-brand-blue-500 px-2 py-1 rounded-full">
                          {formData.cover_photo === url ? 'Capa' : 'Definir Capa'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <label className="cursor-pointer aspect-video flex flex-col items-center justify-center border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 rounded-md hover:bg-brand-gray-50 dark:hover:bg-brand-gray-800">
                  <ImageIcon className="h-8 w-8 text-brand-gray-400" />
                  <span className="mt-1 text-xs text-brand-gray-500">Adicionar fotos</span>
                  <input type="file" multiple className="hidden" onChange={handlePhotoChange} accept="image/*" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSaveClick}>
          <Save className="h-4 w-4 mr-2"/> {initialData ? 'Salvar Alterações' : 'Salvar Quadra'}
        </Button>
      </div>
    </>
  );
};

export default QuadraFormTabs;
