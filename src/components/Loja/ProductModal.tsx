import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, DollarSign, Package, FileText, Image as ImageIcon, Loader2, Trash2, Plus, Layers } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';
import { useToast } from '../../context/ToastContext';
import { localUploadPhoto } from '../../lib/localApi';
import { v4 as uuidv4 } from 'uuid';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'arena_id' | 'created_at'> | Product) => void;
  initialData: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    photo_urls: [] as string[],
    variants: [] as ProductVariant[],
    is_active: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [photosToUpload, setPhotosToUpload] = useState<File[]>([]);
  const [localPhotoPreviews, setLocalPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const isEditing = !!initialData;
  const hasVariants = formData.variants && formData.variants.length > 0;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description,
          price: String(initialData.price).replace('.', ','),
          stock: String(initialData.stock || ''),
          photo_urls: initialData.photo_urls || [],
          variants: initialData.variants || [],
          is_active: initialData.is_active,
        });
      } else {
        setFormData({ name: '', description: '', price: '', stock: '', photo_urls: [], variants: [], is_active: true });
      }
      setPhotosToUpload([]);
      setLocalPhotoPreviews([]);
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of photosToUpload) {
        const { publicUrl } = await localUploadPhoto(file);
        uploadedUrls.push(publicUrl);
      }

      const finalPhotoUrls = [...formData.photo_urls, ...uploadedUrls];
      
      const totalStock = hasVariants 
        ? formData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : parseInt(formData.stock, 10) || 0;

      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price.replace(',', '.')) || 0,
        stock: totalStock,
        photo_urls: finalPhotoUrls,
      };

      if (isEditing && initialData) {
        onSave({ ...initialData, ...dataToSave });
      } else {
        onSave(dataToSave);
      }
    } catch (error: any) {
      addToast({ message: `Erro no upload da foto: ${error.message}`, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPhotosToUpload(prev => [...prev, ...files]);
      setLocalPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };
  
  const removePhoto = (url: string, index: number) => {
    if (url.startsWith('blob:')) {
      const localIndex = index - formData.photo_urls.length;
      setLocalPhotoPreviews(p => p.filter((_, i) => i !== localIndex));
      setPhotosToUpload(p => p.filter((_, i) => i !== localIndex));
      URL.revokeObjectURL(url);
    } else {
      setFormData(p => ({ ...p, photo_urls: p.photo_urls.filter((photoUrl) => photoUrl !== url) }));
    }
  };
  
  const handleVariantChange = (id: string, field: 'name' | 'stock', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: uuidv4(), name: '', stock: 0 }]
    }));
  };

  const removeVariant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id)
    }));
  };

  const allPhotos = [...formData.photo_urls, ...localPhotoPreviews];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Fotos do Produto</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {allPhotos.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={url} alt={`Pré-visualização ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => removePhoto(url, index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                   <label className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 rounded-lg hover:bg-brand-gray-50 dark:hover:bg-brand-gray-800">
                    <ImageIcon className="h-8 w-8 text-brand-gray-400" />
                    <span className="mt-1 text-xs text-brand-gray-500">Adicionar</span>
                    <input type="file" multiple ref={photoInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} />
                  </label>
                </div>
              </div>
              
              {/* Basic Info */}
              <Input label="Nome do Produto" name="name" value={formData.name} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full form-textarea rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" />
              </div>
              <Input label="Preço (R$)" name="price" type="text" inputMode="decimal" value={formData.price} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />

              {/* Variants and Stock */}
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-brand-gray-800 dark:text-white mb-2 flex items-center"><Layers className="h-5 w-5 mr-2"/> Variações e Estoque</h4>
                {hasVariants ? (
                  <div className="space-y-3">
                    {formData.variants.map(variant => (
                      <div key={variant.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-7">
                          <Input placeholder="Nome da variação (Ex: Tamanho P)" value={variant.name} onChange={e => handleVariantChange(variant.id, 'name', e.target.value)} />
                        </div>
                        <div className="col-span-3">
                          <Input type="number" placeholder="Estoque" value={variant.stock} onChange={e => handleVariantChange(variant.id, 'stock', Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)} className="text-red-500 w-full"><Trash2 className="h-4 w-4 mx-auto" /></Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus className="h-4 w-4 mr-2"/>Adicionar Variação</Button>
                  </div>
                ) : (
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Input label="Estoque Total" name="stock" type="number" value={formData.stock} onChange={handleChange} icon={<Package className="h-4 w-4 text-brand-gray-400"/>} required />
                    </div>
                    <Button type="button" variant="outline" onClick={addVariant}><Plus className="h-4 w-4 mr-2"/>Adicionar Variações</Button>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                <span className="text-sm font-medium">Produto Ativo</span>
                <ToggleSwitch enabled={formData.is_active} setEnabled={(val) => setFormData(p => ({...p, is_active: val}))} />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} isLoading={isUploading}><Save className="h-4 w-4 mr-2"/> Salvar Produto</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
