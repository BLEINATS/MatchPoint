import React, { useState, useEffect } from 'react';
import { AtletaAluguel, WeeklyAvailability } from '../../types';
import Input from '../Forms/Input';
import Button from '../Forms/Button';
import { Save, DollarSign, Briefcase, Plus, Trash2, Calendar, Info } from 'lucide-react';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';
import { AnimatePresence, motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Alert from '../Shared/Alert';

interface AtletaPerfilTabProps {
  atleta: AtletaAluguel;
  onSave: (updatedData: Partial<AtletaAluguel>) => void;
}

const ALL_SPORTS = ['Futevôlei', 'Beach Tennis', 'Futebol', 'Futsal', 'Futsal Society', 'Vôlei', 'Basquete', 'Squash', 'Badminton', 'Ping Pong', 'Padel', 'Multiuso'];
const NIVEIS_TECNICOS = ['Iniciante', 'Intermediário', 'Avançado', 'Profissional'];
const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const AtletaPerfilTab: React.FC<AtletaPerfilTabProps> = ({ atleta, onSave }) => {
  const [formData, setFormData] = useState<Partial<AtletaAluguel>>({
    taxa_hora: atleta.taxa_hora,
    esportes: atleta.esportes,
    nivel_tecnico: atleta.nivel_tecnico,
    experiencia_anos: atleta.experiencia_anos,
    biografia: atleta.biografia,
    status: atleta.status,
    weekly_availability: atleta.weekly_availability || [],
  });
  const [customSport, setCustomSport] = useState('');

  useEffect(() => {
    const customSportEntry = atleta.esportes?.find(e => !ALL_SPORTS.includes(e.sport));
    setCustomSport(customSportEntry ? customSportEntry.sport : '');
    setFormData({
      taxa_hora: atleta.taxa_hora,
      esportes: atleta.esportes,
      nivel_tecnico: atleta.nivel_tecnico,
      experiencia_anos: atleta.experiencia_anos,
      biografia: atleta.biografia,
      status: atleta.status,
      weekly_availability: atleta.weekly_availability || [],
    });
  }, [atleta]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | string[] = value;
    if (name === 'taxa_hora' || name === 'experiencia_anos') {
      processedValue = Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSportToggle = (sport: string) => {
    setFormData(prev => {
      const currentEsportes = prev.esportes || [];
      const isSelected = currentEsportes.some(e => e.sport === sport);
      if (isSelected) {
        return { ...prev, esportes: currentEsportes.filter(e => e.sport !== sport) };
      } else {
        return { ...prev, esportes: [...currentEsportes, { sport: sport, position: '' }] };
      }
    });
  };

  const handleToggleOther = () => {
    const isOtherCurrentlySelected = formData.esportes?.some(e => !ALL_SPORTS.includes(e.sport));
    if (isOtherCurrentlySelected) {
      setFormData(prev => ({
        ...prev,
        esportes: prev.esportes?.filter(e => ALL_SPORTS.includes(e.sport))
      }));
      setCustomSport('');
    }
  };

  const handleCustomSportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomValue = e.target.value;
    setCustomSport(newCustomValue);

    setFormData(prev => {
      const standardSports = (prev.esportes || []).filter(es => ALL_SPORTS.includes(es.sport));
      const newEsportes = [...standardSports];
      if (newCustomValue.trim()) {
        newEsportes.push({ sport: newCustomValue.trim(), position: '' });
      }
      return { ...prev, esportes: newEsportes };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAvailabilityChange = (dayOfWeek: number, slotId: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => {
        const newAvailability = [...(prev.weekly_availability || [])];
        let dayAvailability = newAvailability.find(d => d.dayOfWeek === dayOfWeek);

        if (!dayAvailability) return prev;

        const slotIndex = dayAvailability.slots.findIndex(s => s.id === slotId);
        if (slotIndex > -1) {
            dayAvailability.slots[slotIndex] = { ...dayAvailability.slots[slotIndex], [field]: value };
        }

        return { ...prev, weekly_availability: newAvailability };
    });
  };

  const addSlot = (dayOfWeek: number) => {
    setFormData(prev => {
        const newAvailability = [...(prev.weekly_availability || [])];
        let dayAvailability = newAvailability.find(d => d.dayOfWeek === dayOfWeek);

        if (!dayAvailability) {
            dayAvailability = { dayOfWeek, slots: [] };
            newAvailability.push(dayAvailability);
        }

        dayAvailability.slots.push({ id: uuidv4(), start: '08:00', end: '12:00' });
        
        newAvailability.sort((a,b) => a.dayOfWeek - b.dayOfWeek);

        return { ...prev, weekly_availability: newAvailability };
    });
  };

  const removeSlot = (dayOfWeek: number, slotId: string) => {
    setFormData(prev => {
        const newAvailability = (prev.weekly_availability || []).map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                return { ...day, slots: day.slots.filter(s => s.id !== slotId) };
            }
            return day;
        }).filter(day => day.slots.length > 0);

        return { ...prev, weekly_availability: newAvailability };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Disponibilidade e Taxa">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Taxa por Jogo/Hora (R$)"
              name="taxa_hora"
              type="number"
              value={formData.taxa_hora || ''}
              onChange={handleChange}
              icon={<DollarSign className="h-4 w-4 text-brand-gray-400" />}
              required
              disabled
            />
            <p className="text-xs text-brand-gray-500 mt-1">O valor da taxa é gerenciado pelo administrador da arena.</p>
          </div>
          <div className="flex items-center justify-between p-4 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
            <span className="font-medium">Disponível para jogos</span>
            <ToggleSwitch
              enabled={formData.status === 'disponivel'}
              setEnabled={(val) => setFormData(p => ({ ...p, status: val ? 'disponivel' : 'indisponivel' }))}
            />
          </div>
        </div>
      </Section>
      
      <Section title="Disponibilidade Semanal">
        {(!formData.weekly_availability || formData.weekly_availability.length === 0) && (
            <Alert
                type="info"
                title="Configure sua Disponibilidade"
                message="Para aparecer como disponível para contratação em horários específicos, você precisa definir seus dias e horários de trabalho. Sem um horário cadastrado, você não será listado para reservas com hora marcada."
            />
        )}
        <p className="text-sm -mt-2 text-brand-gray-500 dark:text-brand-gray-400">
            Defina os dias e horários em que você está disponível para ser contratado. Você pode adicionar múltiplos intervalos para o mesmo dia.
        </p>
        <div className="space-y-4">
            {WEEK_DAYS.map((dayName, index) => {
                const dayAvailability = formData.weekly_availability?.find(d => d.dayOfWeek === index);
                return (
                    <div key={index} className="p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50">
                        <div className="flex justify-between items-center">
                            <h5 className="font-semibold">{dayName}</h5>
                            <Button type="button" variant="outline" size="sm" onClick={() => addSlot(index)}>
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Horário
                            </Button>
                        </div>
                        {dayAvailability && dayAvailability.slots.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {dayAvailability.slots.map(slot => (
                                    <div key={slot.id} className="flex items-center gap-2">
                                        <Input type="time" value={slot.start} onChange={(e) => handleAvailabilityChange(index, slot.id, 'start', e.target.value)} />
                                        <span>até</span>
                                        <Input type="time" value={slot.end} onChange={(e) => handleAvailabilityChange(index, slot.id, 'end', e.target.value)} />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSlot(index, slot.id)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </Section>

      <Section title="Habilidades e Experiência">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Nível Técnico</label>
            <select name="nivel_tecnico" value={formData.nivel_tecnico || ''} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
              <option value="">Selecione o nível</option>
              {NIVEIS_TECNICOS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Input
            label="Experiência (anos)"
            name="experiencia_anos"
            type="number"
            value={String(formData.experiencia_anos || '')}
            onChange={handleChange}
            icon={<Briefcase className="h-4 w-4 text-brand-gray-400" />}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Esportes Praticados</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ALL_SPORTS.map(sport => (
              <label key={sport} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.esportes?.some(e => e.sport === sport)}
                  onChange={() => handleSportToggle(sport)}
                  className="form-checkbox h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500"
                />
                <span className="text-sm">{sport}</span>
              </label>
            ))}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.esportes?.some(e => !ALL_SPORTS.includes(e.sport))}
                  onChange={handleToggleOther}
                  className="form-checkbox h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500"
                />
                <span className="text-sm">Outro</span>
              </label>
              <AnimatePresence>
                {formData.esportes?.some(e => !ALL_SPORTS.includes(e.sport)) && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="pl-7">
                    <Input
                      value={customSport}
                      onChange={handleCustomSportChange}
                      placeholder="Digite o esporte"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Biografia</label>
          <textarea
            name="biografia"
            value={formData.biografia || ''}
            onChange={handleChange}
            rows={4}
            className="w-full form-textarea rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600"
            placeholder="Descreva seu estilo de jogo, suas principais qualidades e o que você busca em uma partida..."
          />
        </div>
      </Section>

      <div className="flex justify-end pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700">
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export default AtletaPerfilTab;
