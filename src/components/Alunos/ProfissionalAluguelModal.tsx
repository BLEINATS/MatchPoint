import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Phone, Sparkles, Trash2, DollarSign, Percent, Mail, MapPin, Star, Briefcase, FileText, Hash, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ProfissionalAluguel, Aluno } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { maskPhone } from '../../utils/masks';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';
import { useToast } from '../../context/ToastContext';

interface ProfissionalAluguelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prof: Omit<ProfissionalAluguel, 'id' | 'arena_id' | 'created_at'> | ProfissionalAluguel, photoFile?: File | null) => void;
  onDelete: (id: string) => void;
  initialData: ProfissionalAluguel | null;
  alunos: Aluno[];
}

const ALL_SPORTS = ['Futevôlei', 'Beach Tennis', 'Futebol', 'Futsal', 'Futsal Society', 'Vôlei', 'Basquete', 'Squash', 'Badminton', 'Ping Pong', 'Padel', 'Multiuso'];
const NIVEIS_TECNICOS = ['Iniciante', 'Intermediário', 'Avançado', 'Profissional'];

const ProfissionalAluguelModal: React.FC<ProfissionalAluguelModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, alunos }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: null as string | null,
    profile_id: null as string | null,
    esportes: [] as { sport: string; position: string }[],
    nivel_tecnico: null as ProfissionalAluguel['nivel_tecnico'],
    experiencia_anos: 0,
    raio_atuacao: 0,
    taxa_hora: 0,
    comissao_arena: 10,
    biografia: '',
    certificacoes: '',
    palavras_chave: [] as string[],
    status: 'disponivel' as ProfissionalAluguel['status'],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      let initialEsportes: { sport: string; position: string }[] = [];
      if (initialData.esportes) {
        if (initialData.esportes.length > 0 && typeof initialData.esportes[0] === 'string') {
          initialEsportes = (initialData.esportes as any as string[]).map(sport => ({ sport, position: '' }));
        } else {
          initialEsportes = initialData.esportes;
        }
      }
      
      setFormData({
        name: initialData.name,
        email: initialData.email || '',
        phone: initialData.phone || '',
        avatar_url: initialData.avatar_url || null,
        profile_id: initialData.profile_id || null,
        esportes: initialEsportes,
        nivel_tecnico: initialData.nivel_tecnico || null,
        experiencia_anos: initialData.experiencia_anos || 0,
        raio_atuacao: initialData.raio_atuacao || 0,
        taxa_hora: initialData.taxa_hora || 0,
        comissao_arena: initialData.comissao_arena || 10,
        biografia: initialData.biografia || '',
        certificacoes: initialData.certificacoes || '',
        palavras_chave: initialData.palavras_chave || [],
        status: initialData.status || 'disponivel',
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', avatar_url: null, profile_id: null,
        esportes: [], nivel_tecnico: null, experiencia_anos: 0, raio_atuacao: 0,
        taxa_hora: 0, comissao_arena: 10, biografia: '', certificacoes: '',
        palavras_chave: [], status: 'disponivel',
      });
    }
    setPhotoFile(null);
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!formData.esportes.length) {
      addToast({ message: 'Selecione pelo menos um esporte para continuar.', type: 'error' });
      return;
    }
    if (isEditing && initialData) {
      onSave({ ...initialData, ...formData }, photoFile);
    } else {
      onSave(formData, photoFile);
    }
  };
  
  const handleDelete = () => initialData && onDelete(initialData.id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | string[] = value;

    if (name === 'phone') processedValue = maskPhone(value);
    else if (['experiencia_anos', 'raio_atuacao', 'taxa_hora', 'comissao_arena'].includes(name)) processedValue = Number(value);
    else if (name === 'palavras_chave') processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleSportToggle = (sport: string) => {
    setFormData(prev => {
      const isSelected = prev.esportes.some(e => e.sport === sport);
      if (isSelected) {
        return { ...prev, esportes: prev.esportes.filter(e => e.sport !== sport) };
      } else {
        return { ...prev, esportes: [...prev.esportes, { sport: sport, position: '' }] };
      }
    });
  };

  const handlePositionChange = (sport: string, position: string) => {
    setFormData(prev => ({
      ...prev,
      esportes: prev.esportes.map(e => e.sport === sport ? { ...e, position } : e)
    }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      addToast({ message: 'A foto excede o limite de 10MB.', type: 'error' });
      return;
    }
    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar_url: previewUrl }));
  };

  const removeAvatar = () => {
    if (formData.avatar_url && formData.avatar_url.startsWith('blob:')) {
      URL.revokeObjectURL(formData.avatar_url);
    }
    setPhotoFile(null);
    setFormData(prev => ({ ...prev, avatar_url: null }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isEditing ? 'Editar Profissional' : 'Cadastrar Novo Jogador de Aluguel'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <Section title="Informações Pessoais">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700 flex items-center justify-center overflow-hidden shadow-md">
                            {isUploading ? <Loader2 className="w-10 h-10 text-brand-gray-400 animate-spin" /> : formData.avatar_url ? <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-brand-gray-400" />}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" size="sm" onClick={() => avatarInputRef.current?.click()} className="mb-1">Alterar</Button>
                            {formData.avatar_url && <Button type="button" variant="ghost" size="sm" onClick={removeAvatar} className="!text-white hover:!bg-white/10"><Trash2 className="h-4 w-4" /></Button>}
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarUpload} disabled={isUploading} />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} />
                            <Input label="Telefone" name="phone" value={formData.phone || ''} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
                        </div>
                    </div>
                </div>
              </Section>

              <Section title="Esportes e Posições">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Esportes Praticados *</label>
                  <div className="space-y-4">
                    {ALL_SPORTS.map(sport => {
                      const isSelected = formData.esportes.some(e => e.sport === sport);
                      const currentPosition = formData.esportes.find(e => e.sport === sport)?.position || '';
                      return (
                        <div key={sport}>
                          <label className="flex items-center">
                            <input type="checkbox" checked={isSelected} onChange={() => handleSportToggle(sport)} className="h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500" />
                            <span className="ml-3 text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{sport}</span>
                          </label>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="pl-8">
                                <Input label={`Posição em ${sport}`} value={currentPosition} onChange={(e) => handlePositionChange(sport, e.target.value)} placeholder="Ex: Goleiro, Atacante, Esquerdo" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Section>
              
              <Section title="Informações Profissionais">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Nível Técnico</label>
                        <select name="nivel_tecnico" value={formData.nivel_tecnico || ''} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                            <option value="">Selecione o nível</option>
                            {NIVEIS_TECNICOS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <Input label="Experiência (anos)" name="experiencia_anos" type="number" value={formData.experiencia_anos.toString()} onChange={handleChange} icon={<Briefcase className="h-4 w-4 text-brand-gray-400"/>} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Taxa por Hora (R$)" name="taxa_hora" type="number" value={formData.taxa_hora.toString()} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />
                    <Input label="Comissão da Arena (%)" name="comissao_arena" type="number" value={formData.comissao_arena.toString()} onChange={handleChange} icon={<Percent className="h-4 w-4 text-brand-gray-400"/>} />
                    <Input label="Raio de Atuação (KM)" name="raio_atuacao" type="number" value={formData.raio_atuacao.toString()} onChange={handleChange} icon={<MapPin className="h-4 w-4 text-brand-gray-400"/>} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Biografia</label>
                    <textarea name="biografia" value={formData.biografia} onChange={handleChange} rows={3} className="w-full form-textarea rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" placeholder="Descreva a experiência e especialidades do jogador..."></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Certificações</label>
                    <textarea name="certificacoes" value={formData.certificacoes} onChange={handleChange} rows={2} className="w-full form-textarea rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" placeholder="Liste certificações, cursos e qualificações..."></textarea>
                </div>
                <Input label="Palavras-chave (separadas por vírgula)" name="palavras_chave" value={formData.palavras_chave.join(', ')} onChange={handleChange} placeholder="ex: experiente, dedicado, pontual" icon={<Hash className="h-4 w-4 text-brand-gray-400"/>} />
              </Section>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ToggleSwitch enabled={formData.status === 'disponivel'} setEnabled={(val) => setFormData(p => ({ ...p, status: val ? 'disponivel' : 'indisponivel' }))} />
                <span className="text-sm font-medium">Jogador ativo</span>
              </div>
              <div className="flex justify-end gap-3">
                {isEditing && <Button type="button" variant="outline" onClick={handleDelete} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4 mr-2" /> Excluir</Button>}
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Cadastrar Jogador'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-6">
      <h4 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
);

export default ProfissionalAluguelModal;
