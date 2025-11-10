import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, Sparkles, Trash2, Link as LinkIcon, Briefcase, FileText, Percent, Image as ImageIcon, Loader2, DollarSign, Banknote } from 'lucide-react';
import { Professor, Aluno } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { maskPhone } from '../../utils/masks';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';
import { useToast } from '../../context/ToastContext';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-6">
      <h4 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
);

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (professor: Omit<Professor, 'id' | 'arena_id' | 'created_at'> | Professor, photoFile?: File | null) => void;
  onDelete: (id: string) => void;
  initialData: Professor | null;
  alunos: Aluno[];
}

const ALL_SPORTS = ['Tênis', 'Futsal', 'Vôlei', 'Futvolei', 'Basquete', 'Beach Tennis', 'Padel', 'Squash', 'Badminton', 'Ping Pong', 'Multiuso'];
const NIVEIS_EXPERIENCIA = ['Júnior', 'Pleno', 'Sênior'];

const ProfessorModal: React.FC<ProfessorModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, alunos }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', specialties: [] as string[], profile_id: null as string | null,
    avatar_url: null as string | null, status: 'ativo' as 'ativo' | 'inativo',
    nivel_experiencia: null as Professor['nivel_experiencia'], metodologia: '', portfolio_url: '',
    pix_key: '',
    payment_type: 'por_hora' as Professor['payment_type'],
    valor_hora_aula: 0 as number | null,
    salario_mensal: 0 as number | null,
    valor_por_aula: 0 as number | null,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name, email: initialData.email, phone: initialData.phone || '',
        specialties: initialData.specialties || [], profile_id: initialData.profile_id || null,
        avatar_url: initialData.avatar_url || null, status: initialData.status || 'ativo',
        nivel_experiencia: initialData.nivel_experiencia || null, 
        metodologia: initialData.metodologia || '', portfolio_url: initialData.portfolio_url || '',
        pix_key: initialData.pix_key || '',
        payment_type: initialData.payment_type || 'por_hora',
        valor_hora_aula: initialData.valor_hora_aula || 0,
        salario_mensal: initialData.salario_mensal || 0,
        valor_por_aula: initialData.valor_por_aula || 0,
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', specialties: [], profile_id: null, avatar_url: null, status: 'ativo',
        nivel_experiencia: null, metodologia: '', portfolio_url: '', pix_key: '',
        payment_type: 'por_hora', valor_hora_aula: 0, salario_mensal: 0, valor_por_aula: 0,
      });
    }
    setPhotoFile(null);
  }, [initialData, isOpen]);

  const handleSave = () => {
    let dataToSave: Partial<Professor> = { ...formData };
    
    // Nullify unused payment fields
    if (formData.payment_type === 'por_hora') {
      dataToSave.salario_mensal = null;
      dataToSave.valor_por_aula = null;
    } else if (formData.payment_type === 'mensal') {
      dataToSave.valor_hora_aula = null;
      dataToSave.valor_por_aula = null;
    } else if (formData.payment_type === 'por_aula') {
      dataToSave.valor_hora_aula = null;
      dataToSave.salario_mensal = null;
    }

    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave }, photoFile);
    } else {
      onSave(dataToSave as any, photoFile);
    }
  };
  
  const handleDelete = () => initialData && onDelete(initialData.id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number | null = value;
    if (name === 'phone') finalValue = maskPhone(value);
    if (['valor_hora_aula', 'salario_mensal', 'valor_por_aula'].includes(name)) {
        finalValue = value === '' ? null : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };
  
  const handleProfileLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProfileId = e.target.value || null;
    const selectedAluno = alunos.find(a => a.profile_id === selectedProfileId);
    
    setFormData(prev => ({
      ...prev,
      profile_id: selectedProfileId,
      name: selectedAluno ? selectedAluno.name : prev.name,
      email: selectedAluno ? selectedAluno.email || '' : prev.email,
      phone: selectedAluno ? selectedAluno.phone || '' : prev.phone,
      avatar_url: selectedAluno ? selectedAluno.avatar_url || null : prev.avatar_url,
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
                {isEditing ? 'Editar Professor' : 'Adicionar Novo Professor'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <Section title="Conta de Usuário (Opcional)">
                <p className="text-sm -mt-2 text-brand-gray-500 dark:text-brand-gray-400">Vincule este perfil a uma conta de usuário existente para que ele possa acessar o painel de professor.</p>
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1 flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2 text-brand-gray-400"/>
                    Vincular Conta de Usuário
                  </label>
                  <select name="profile_id" value={formData.profile_id || ''} onChange={handleProfileLinkChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                    <option value="">Nenhum (Cadastro Manual)</option>
                    {alunos.map(aluno => (<option key={aluno.profile_id} value={aluno.profile_id!}>{aluno.name}</option>))}
                  </select>
                </div>
              </Section>
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
                        <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required disabled={!!formData.profile_id} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} disabled={!!formData.profile_id} />
                            <Input label="Telefone" name="phone" value={formData.phone || ''} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} disabled={!!formData.profile_id} />
                        </div>
                    </div>
                </div>
              </Section>
              <Section title="Remuneração">
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Forma de Pagamento</label>
                    <select name="payment_type" value={formData.payment_type} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                        <option value="por_hora">Por Hora/Aula</option>
                        <option value="mensal">Salário Fixo Mensal</option>
                        <option value="por_aula">Valor Fixo por Aula</option>
                    </select>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={formData.payment_type}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {formData.payment_type === 'por_hora' && (
                      <Input label="Valor por Hora/Aula (R$)" name="valor_hora_aula" type="number" value={String(formData.valor_hora_aula ?? '')} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} />
                    )}
                    {formData.payment_type === 'mensal' && (
                      <Input label="Salário Fixo Mensal (R$)" name="salario_mensal" type="number" value={String(formData.salario_mensal ?? '')} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} />
                    )}
                    {formData.payment_type === 'por_aula' && (
                      <Input label="Valor Fixo por Aula (R$)" name="valor_por_aula" type="number" value={String(formData.valor_por_aula ?? '')} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} />
                    )}
                  </motion.div>
                </AnimatePresence>
                <Input label="Chave PIX" name="pix_key" value={formData.pix_key || ''} onChange={handleChange} icon={<Banknote className="h-4 w-4 text-brand-gray-400"/>} placeholder="Chave PIX para pagamentos" />
              </Section>
              <Section title="Informações Profissionais">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Nível de Experiência</label>
                        <select name="nivel_experiencia" value={formData.nivel_experiencia || ''} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                            <option value="">Selecione o nível</option>
                            {NIVEIS_EXPERIENCIA.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Especialidades</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {ALL_SPORTS.map(sport => (
                            <label key={sport} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.specialties.includes(sport)} onChange={() => handleSpecialtyToggle(sport)} className="form-checkbox h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500" />
                                <span className="text-sm">{sport}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Metodologia</label>
                    <textarea name="metodologia" value={formData.metodologia || ''} onChange={handleChange} rows={3} className="w-full form-textarea rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600" placeholder="Breve descrição sobre o professor..."></textarea>
                </div>
                <Input label="Portfólio (URL)" name="portfolio_url" value={formData.portfolio_url || ''} onChange={handleChange} icon={<LinkIcon className="h-4 w-4 text-brand-gray-400"/>} placeholder="Link para site ou rede social" />
              </Section>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ToggleSwitch enabled={formData.status === 'ativo'} setEnabled={(val) => setFormData(p => ({ ...p, status: val ? 'ativo' : 'inativo' }))} />
                <span className="text-sm font-medium">Professor ativo</span>
              </div>
              <div className="flex justify-end gap-3">
                {isEditing && <Button type="button" variant="outline" onClick={handleDelete} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4 mr-2" /> Excluir</Button>}
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Adicionar Professor'}</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfessorModal;
