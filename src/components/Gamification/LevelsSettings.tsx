import React from 'react';
import { GamificationLevel } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { Plus, Trash2, Star } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface LevelsSettingsProps {
  levels: GamificationLevel[];
  setLevels: React.Dispatch<React.SetStateAction<GamificationLevel[]>>;
}

const LevelsSettings: React.FC<LevelsSettingsProps> = ({ levels, setLevels }) => {
  const handleLevelChange = (id: string, field: keyof GamificationLevel, value: string | number) => {
    setLevels(prev => prev.map(level => level.id === id ? { ...level, [field]: value } : level));
  };

  const addLevel = () => {
    const newRank = levels.length > 0 ? Math.max(...levels.map(l => l.level_rank)) + 1 : 1;
    setLevels(prev => [
      ...prev,
      {
        id: uuidv4(),
        arena_id: '', // Will be set on save
        name: `Nível ${newRank}`,
        points_required: 0,
        level_rank: newRank,
      },
    ]);
  };

  const removeLevel = (id: string) => {
    setLevels(prev => prev.filter(level => level.id !== id));
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Níveis de Prestígio</h3>
        <Button onClick={addLevel} size="sm"><Plus className="h-4 w-4 mr-2" /> Novo Nível</Button>
      </div>
      <div className="space-y-4">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 items-center px-3 pb-2 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <div className="col-span-1 text-center text-xs font-semibold text-brand-gray-500 uppercase">Ícone</div>
          <div className="col-span-4 text-xs font-semibold text-brand-gray-500 uppercase">Nome do Nível</div>
          <div className="col-span-3 text-xs font-semibold text-brand-gray-500 uppercase">Pontos</div>
          <div className="col-span-3 text-xs font-semibold text-brand-gray-500 uppercase">Ordem</div>
          <div className="col-span-1 text-right text-xs font-semibold text-brand-gray-500 uppercase">Ações</div>
        </div>
        {levels.map(level => (
          <div key={level.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 md:p-0 md:px-3 rounded-lg md:rounded-none bg-brand-gray-50 dark:bg-brand-gray-900/50 md:bg-transparent md:dark:bg-transparent">
            <div className="md:col-span-1 text-center">
              <Star className="h-6 w-6 text-yellow-400 mx-auto" />
            </div>
            <div className="col-span-full md:col-span-4">
              <Input
                placeholder="Nome do Nível (Ex: Bronze)"
                value={level.name}
                onChange={(e) => handleLevelChange(level.id, 'name', e.target.value)}
              />
            </div>
            <div className="col-span-full md:col-span-3">
              <Input
                type="number"
                placeholder="Pontos"
                value={level.points_required.toString()}
                onChange={(e) => handleLevelChange(level.id, 'points_required', Number(e.target.value))}
              />
            </div>
            <div className="col-span-full md:col-span-3">
              <Input
                type="number"
                placeholder="Ordem"
                value={level.level_rank.toString()}
                onChange={(e) => handleLevelChange(level.id, 'level_rank', Number(e.target.value))}
              />
            </div>
            <div className="col-span-full md:col-span-1 text-right">
              <Button variant="ghost" size="sm" onClick={() => removeLevel(level.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelsSettings;
