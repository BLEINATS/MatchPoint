import React, { useState, useEffect } from 'react';
import { AtletaAluguel } from '../../types';
import Input from '../Forms/Input';
import Button from '../Forms/Button';
import { Save, DollarSign, Briefcase } from 'lucide-react';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';
import { AnimatePresence, motion } from 'framer-motion';

interface AtletaPerfilTabProps {
  atleta: AtletaAluguel;
  onSave: (updatedData: Partial<AtletaAluguel>) => void;
}

const ALL_SPORTS = ['Futevôlei', 'Beach Tennis', 'Futebol', 'Futsal', 'Futsal Society', 'Vôlei', 'Basquete', 'Squash', 'Badminton', 'Ping Pong', 'Padel', 'Multiuso'];
const NIVEIS_TECNICOS = ['Iniciante', 'Intermediário', 'Avançado', 'Profissional'];

const AtletaPerfilTab: React.FC<AtletaPerfilTabProps> = ({ atleta, onSave }) => {
  const [formData, setFormData] = useState<Partial<AtletaAluguel>>({
    taxa_hora: atleta.taxa_hora,
    esportes: atleta.esportes,
    nivel_tecnico: atleta.nivel_tecnico,
    experiencia_anos: atleta.experiencia_anos,
    biografia: atleta.biografia,
    status: atleta.status,
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
