import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trophy, Info, AlertTriangle } from 'lucide-react';
import { Torneio, Quadra, TorneioTipo, TorneioStatus, TorneioModality, TorneioCategory, Reserva } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import CategoryManager from './CategoryManager';
import { v4 as uuidv4 } from 'uuid';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { eachDayOfInterval, isSameDay, isBefore, getDay, isAfter } from 'date-fns';
import { format } from 'date-fns';

interface TorneioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (torneio: Omit<Torneio, 'id' | 'arena_id' | 'created_at'> | Torneio) => void;
  initialData: Torneio | null;
  quadras: Quadra[];
  reservas: Reserva[];
}

const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return -1;
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return -1;
        return hours * 60 + minutes;
    } catch (e) {
        return -1;
    }
};

const TorneioModal: React.FC<TorneioModalProps> = ({ isOpen, onClose, onSave, initialData, quadras, reservas }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'torneio' as TorneioTipo,
    status: 'planejado' as TorneioStatus,
    modality: 'individual' as TorneioModality,
    team_size: 2,
    description: '',
    categories: [] as TorneioCategory[],
    expenses: [] as { id: string; description: string; amount: number }[],
    sponsors: [] as { id: string; name: string; amount: number }[],
  });
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const categoriesWithIds = (initialData.categories.length > 0
        ? initialData.categories
        : [{ id: uuidv4(), group: 'Mista', level: 'Iniciante', prize_1st: '', prize_2nd: '', prize_3rd: '', max_participants: 8, registration_fee: 50, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '18:00', quadras_ids: [] }]
      ).map(cat => ({
        ...cat,
        id: cat.id || uuidv4(),
      }));

      setFormData({
        name: initialData.name,
        type: initialData.type,
        status: initialData.status,
        modality: initialData.modality || 'individual',
        team_size: initialData.team_size || 2,
        description: initialData.description,
        categories: categoriesWithIds,
        expenses: initialData.expenses || [],
        sponsors: initialData.sponsors || [],
      });
    } else {
      setFormData({
        name: '', type: 'torneio', status: 'planejado',
        modality: 'individual', team_size: 2,
        description: '',
        categories: [{ id: uuidv4(), group: 'Mista', level: 'Iniciante', prize_1st: '', prize_2nd: '', prize_3rd: '', max_participants: 8, registration_fee: 50, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '18:00', quadras_ids: [] }],
        expenses: [], sponsors: [],
      });
    }
  }, [initialData, isOpen]);
  
  useEffect(() => {
    if (!isOpen) {
      setConflictWarning(null);
      return;
    }

    const checkConflicts = () => {
      for (const category of formData.categories) {
        const { start_date, end_date, start_time, end_time, quadras_ids } = category;

        if (!start_date || !end_date || !start_time || !end_time || !quadras_ids || quadras_ids.length === 0) {
            continue;
        }
        
        const startDate = parseDateStringAsLocal(start_date);
        const endDate = parseDateStringAsLocal(end_date);

        if (isBefore(endDate, startDate)) {
          setConflictWarning(`Categoria "${category.group} - ${category.level}": A data de fim não pode ser anterior à data de início.`);
          return;
        }

        const newEventStartMinutes = timeToMinutes(start_time);
        const newEventEndMinutes = timeToMinutes(end_time);
        if (newEventStartMinutes === -1 || newEventEndMinutes === -1 || newEventStartMinutes >= newEventEndMinutes) continue;

        const eventDays = eachDayOfInterval({ start: startDate, end: endDate });

        for (const day of eventDays) {
          const dayOfWeek = getDay(day);

          for (const existingReserva of reservas) {
            if (isEditing && (existingReserva.torneio_id === initialData?.id)) continue;
            if (existingReserva.status === 'cancelada') continue;

            let isConflictDay = false;
            if (existingReserva.isRecurring) {
              const masterDate = parseDateStringAsLocal(existingReserva.date);
              const recurrenceEndDate = existingReserva.recurringEndDate ? parseDateStringAsLocal(existingReserva.recurringEndDate) : null;
              if ((getDay(masterDate) === dayOfWeek) && !isBefore(day, masterDate) && (!recurrenceEndDate || !isAfter(day, recurrenceEndDate))) {
                isConflictDay = true;
              }
            } else {
              if (isSameDay(parseDateStringAsLocal(existingReserva.date), day)) {
                isConflictDay = true;
              }
            }

            if (isConflictDay) {
              const overlapsQuadra = quadras_ids.includes(existingReserva.quadra_id);
              if (overlapsQuadra) {
                const existingStartMinutes = timeToMinutes(existingReserva.start_time);
                const existingEndMinutes = timeToMinutes(existingReserva.end_time);

                if (existingStartMinutes !== -1 && existingEndMinutes !== -1 && newEventStartMinutes < existingEndMinutes && newEventEndMinutes > existingStartMinutes) {
                  const quadra = quadras.find(q => q.id === existingReserva.quadra_id);
                  setConflictWarning(`Conflito em ${format(day, 'dd/MM/yy')} na quadra "${quadra?.name}". Já existe uma reserva (${existingReserva.clientName}) das ${existingReserva.start_time} às ${existingReserva.end_time}.`);
                  return;
                }
              }
            }
          }
        }
      }

      setConflictWarning(null);
    };

    checkConflicts();
  }, [formData.categories, reservas, quadras, isEditing, initialData?.id, isOpen]);


  const handleSave = () => {
    if (conflictWarning) {
      alert("Corrija os conflitos de horário antes de salvar.");
      return;
    }
    const dataToSave = {
      ...formData,
      team_size: formData.modality === 'equipes' ? Number(formData.team_size) : undefined,
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
                {isEditing ? 'Editar Torneio' : 'Criar Novo Torneio'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <Input label="Nome do Torneio" name="name" value={formData.name} onChange={handleChange} icon={<Trophy className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Torneio de Verão" required />
              
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Descrição do Torneio</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  placeholder="Descreva as regras, formato, e outros detalhes importantes sobre o torneio..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo de Torneio</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Modalidade</label>
                  <select name="modality" value={formData.modality} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="individual">Individual</option>
                    <option value="duplas">Duplas</option>
                    <option value="equipes">Equipes</option>
                  </select>
                </div>
                {formData.modality === 'equipes' && (
                  <Input label="Jogadores por Equipe" name="team_size" type="number" value={formData.team_size.toString()} onChange={handleChange} icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />
                )}
              </div>

              <CategoryManager categories={formData.categories} setCategories={(newCategories) => setFormData(p => ({ ...p, categories: newCategories }))} tournamentQuadras={quadras} />
              
              {conflictWarning && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="flex">
                      <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Atenção: Horário Indisponível</h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                          <p>{conflictWarning}</p>
                          </div>
                      </div>
                      </div>
                  </div>
              )}
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!!conflictWarning} title={conflictWarning || ''}>
                <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Criar Torneio'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TorneioModal;
