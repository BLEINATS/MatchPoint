import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trophy, Calendar, Clock, Info, Users, DollarSign, Users2, AlertTriangle } from 'lucide-react';
import { Torneio, Quadra, TorneioTipo, TorneioStatus, TorneioModality, TorneioCategory, Reserva } from '../types';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { format, eachDayOfInterval, isSameDay, isBefore } from 'date-fns';
import CategoryManager from '../components/Torneios/CategoryManager';
import { v4 as uuidv4 } from 'uuid';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { expandRecurringReservations } from '../utils/reservationUtils';

interface TorneioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (torneio: Omit<Torneio, 'id' | 'arena_id' | 'created_at'> | Torneio) => void;
  initialData: Torneio | null;
  quadras: Quadra[];
  reservas: Reserva[];
}

const TorneioModal: React.FC<TorneioModalProps> = ({ isOpen, onClose, onSave, initialData, quadras, reservas }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'torneio' as TorneioTipo,
    status: 'planejado' as TorneioStatus,
    modality: 'individual' as TorneioModality,
    team_size: 2,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    quadras_ids: [] as string[],
    start_time: '08:00',
    end_time: '18:00',
    categories: [] as TorneioCategory[],
    max_participants: 8,
    registration_fee: 0,
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
        : [{ group: 'Mista', level: 'Iniciante', prize_1st: '', prize_2nd: '', prize_3rd: '' } as TorneioCategory]
      ).map(cat => ({
        ...cat,
        id: cat.id || uuidv4(),
        prize_1st: cat.prize_1st || '',
        prize_2nd: cat.prize_2nd || '',
        prize_3rd: cat.prize_3rd || '',
      }));

      setFormData({
        name: initialData.name,
        type: initialData.type,
        status: initialData.status,
        modality: initialData.modality || 'individual',
        team_size: initialData.team_size || 2,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        description: initialData.description,
        quadras_ids: initialData.quadras_ids,
        start_time: initialData.start_time,
        end_time: initialData.end_time,
        categories: categoriesWithIds,
        max_participants: initialData.max_participants,
        registration_fee: initialData.registration_fee,
        expenses: initialData.expenses || [],
        sponsors: initialData.sponsors || [],
      });
    } else {
      setFormData({
        name: '', type: 'torneio', status: 'planejado',
        modality: 'individual', team_size: 2,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        description: '', quadras_ids: [],
        start_time: '08:00', end_time: '18:00',
        categories: [{ id: uuidv4(), group: 'Mista', level: 'Iniciante', prize_1st: '', prize_2nd: '', prize_3rd: '' }],
        max_participants: 8, registration_fee: 0,
        expenses: [], sponsors: [],
      });
    }
  }, [initialData, isOpen]);
  
  useEffect(() => {
    if (!isOpen || !formData.quadras_ids.length || !formData.start_date || !formData.end_date || !formData.start_time || !formData.end_time) {
      setConflictWarning(null);
      return;
    }

    const checkConflicts = () => {
      const eventStartDate = parseDateStringAsLocal(formData.start_date);
      const eventEndDate = parseDateStringAsLocal(formData.end_date);

      if (isBefore(eventEndDate, eventStartDate)) {
        setConflictWarning("A data de fim não pode ser anterior à data de início.");
        return;
      }

      const allExpandedReservations = expandRecurringReservations(reservas, eventStartDate, eventEndDate, quadras);
      const eventDays = eachDayOfInterval({ start: eventStartDate, end: eventEndDate });

      for (const day of eventDays) {
        for (const quadraId of formData.quadras_ids) {
          const conflictingReserva = allExpandedReservations.find(r => {
            if (isEditing && (r.torneio_id === initialData?.id)) return false;
            if (r.quadra_id !== quadraId || !isSameDay(parseDateStringAsLocal(r.date), day) || r.status === 'cancelada') {
              return false;
            }

            const eventStartTime = parseDateStringAsLocal(`${format(day, 'yyyy-MM-dd')}T${formData.start_time}`);
            const eventEndTime = parseDateStringAsLocal(`${format(day, 'yyyy-MM-dd')}T${formData.end_time}`);
            const reservaStartTime = parseDateStringAsLocal(`${format(day, 'yyyy-MM-dd')}T${r.start_time}`);
            const reservaEndTime = parseDateStringAsLocal(`${format(day, 'yyyy-MM-dd')}T${r.end_time}`);
            
            return eventStartTime < reservaEndTime && eventEndTime > reservaStartTime;
          });

          if (conflictingReserva) {
            const quadra = quadras.find(q => q.id === quadraId);
            setConflictWarning(`Conflito em ${format(day, 'dd/MM')}: A quadra "${quadra?.name}" já tem uma reserva (${conflictingReserva.clientName}) das ${conflictingReserva.start_time} às ${conflictingReserva.end_time}.`);
            return;
          }
        }
      }
      setConflictWarning(null);
    };

    checkConflicts();
  }, [formData.quadras_ids, formData.start_date, formData.end_date, formData.start_time, formData.end_time, reservas, quadras, isEditing, initialData?.id, isOpen]);


  const handleSave = () => {
    if (conflictWarning) {
      alert("Corrija os conflitos de horário antes de salvar.");
      return;
    }
    const dataToSave = {
      ...formData,
      max_participants: Number(formData.max_participants),
      registration_fee: Number(formData.registration_fee),
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
                {isEditing ? 'Editar Torneio' : 'Criar Novo Torneio'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <Input label="Nome do Torneio" name="name" value={formData.name} onChange={handleChange} icon={<Trophy className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Torneio de Verão" required />
              
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
                  <Input label="Jogadores por Equipe" name="team_size" type="number" value={formData.team_size.toString()} onChange={handleChange} icon={<Users2 className="h-4 w-4 text-brand-gray-400"/>} />
                )}
              </div>

              <CategoryManager categories={formData.categories} setCategories={(newCategories) => setFormData(p => ({ ...p, categories: newCategories }))} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Máx. de Inscritos (por categoria)" name="max_participants" type="number" value={formData.max_participants.toString()} onChange={handleChange} icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Taxa de Inscrição (R$)" name="registration_fee" type="number" value={formData.registration_fee.toString()} onChange={handleChange} icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Data de Início" name="start_date" type="date" value={formData.start_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Data de Fim" name="end_date" type="date" value={formData.end_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Horário de Início" name="start_time" type="time" value={formData.start_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Horário de Fim" name="end_time" type="time" value={formData.end_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
              </div>

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
