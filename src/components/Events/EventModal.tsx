import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trophy, Calendar, Clock, LayoutGrid, Info, Users, DollarSign } from 'lucide-react';
import { Evento, Quadra, EventoTipo, EventoStatus } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evento: Omit<Evento, 'id' | 'arena_id' | 'created_at'> | Evento) => void;
  initialData: Evento | null;
  quadras: Quadra[];
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, initialData, quadras }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'torneio' as EventoTipo,
    status: 'planejado' as EventoStatus,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    quadras_ids: [] as string[],
    start_time: '08:00',
    end_time: '18:00',
    categories: '',
    max_participants: 8,
    registration_fee: 0,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        status: initialData.status,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        description: initialData.description,
        quadras_ids: initialData.quadras_ids,
        start_time: initialData.start_time,
        end_time: initialData.end_time,
        categories: initialData.categories.join(', '),
        max_participants: initialData.max_participants,
        registration_fee: initialData.registration_fee,
      });
    } else {
      setFormData({
        name: '', type: 'torneio', status: 'planejado',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        description: '', quadras_ids: [],
        start_time: '08:00', end_time: '18:00',
        categories: '', max_participants: 8, registration_fee: 0,
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      categories: formData.categories.split(',').map(c => c.trim()).filter(Boolean),
      max_participants: Number(formData.max_participants),
      registration_fee: Number(formData.registration_fee),
    };

    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuadraToggle = (quadraId: string) => {
    setFormData(prev => {
      const quadras_ids = prev.quadras_ids.includes(quadraId)
        ? prev.quadras_ids.filter(id => id !== quadraId)
        : [...prev.quadras_ids, quadraId];
      return { ...prev, quadras_ids };
    });
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
                {isEditing ? 'Editar Evento' : 'Criar Novo Evento'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Informações Básicas */}
              <Input label="Nome do Evento" name="name" value={formData.name} onChange={handleChange} icon={<Trophy className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Torneio de Verão" required />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo de Evento</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="torneio">Torneio</option>
                    <option value="campeonato">Campeonato</option>
                    <option value="clinica">Clínica</option>
                    <option value="evento_especial">Evento Especial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="planejado">Planejado</option>
                    <option value="inscricoes_abertas">Inscrições Abertas</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Inscrições */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Input label="Máx. de Inscritos" name="max_participants" type="number" value={formData.max_participants.toString()} onChange={handleChange} icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Taxa de Inscrição (R$)" name="registration_fee" type="number" value={formData.registration_fee.toString()} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Categorias" name="categories" value={formData.categories} onChange={handleChange} placeholder="Mista, Masculino A (separar por vírgula)" />
              </div>

              {/* Datas e Horários */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Data de Início" name="start_date" type="date" value={formData.start_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Data de Fim" name="end_date" type="date" value={formData.end_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Horário de Início" name="start_time" type="time" value={formData.start_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Horário de Fim" name="end_time" type="time" value={formData.end_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
              </div>

              {/* Quadras */}
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Quadras a serem utilizadas</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quadras.map(quadra => (
                    <label key={quadra.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${formData.quadras_ids.includes(quadra.id) ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={formData.quadras_ids.includes(quadra.id)}
                        onChange={() => handleQuadraToggle(quadra.id)}
                        className="h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{quadra.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
                <h5 className="font-medium mb-2 flex items-center text-blue-900 dark:text-blue-200"><Info className="h-4 w-4 mr-2" />Atenção</h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ao salvar, as quadras selecionadas serão bloqueadas no Hub de Reservas durante os dias e horários definidos para este evento.
                </p>
              </div>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
