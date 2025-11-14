import React from 'react';
import { AlunoLevel } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../components/Forms/Button';
import Input from '../../components/Forms/Input';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';

const TAILWIND_COLORS = [
  'slate', 'gray', 'zinc', 'red', 'orange', 'amber', 'yellow', 'lime', 
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

interface NiveisAlunosTabProps {
  levels: AlunoLevel[];
  setLevels: React.Dispatch<React.SetStateAction<AlunoLevel[]>>;
}

const NiveisAlunosTab: React.FC<NiveisAlunosTabProps> = ({ levels, setLevels }) => {
  const { selectedArenaContext: arena } = useAuth();

  const handleLevelChange = (id: string, field: 'name' | 'color', value: string) => {
    setLevels(prev => prev.map(level => level.id === id ? { ...level, [field]: value } : level));
  };

  const addLevel = () => {
    if (!arena) return;
    setLevels(prev => [
      ...prev,
      {
        id: uuidv4(),
        arena_id: arena.id,
        name: 'Novo Nível',
        color: 'slate',
      },
    ]);
  };

  const removeLevel = (id: string) => {
    setLevels(prev => prev.filter(level => level.id !== id));
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      slate: 'bg-slate-500', gray: 'bg-gray-500', zinc: 'bg-zinc-500', red: 'bg-red-500',
      orange: 'bg-orange-500', amber: 'bg-amber-500', yellow: 'bg-yellow-500', lime: 'bg-lime-500',
      green: 'bg-green-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500',
      sky: 'bg-sky-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500',
      purple: 'bg-purple-500', fuchsia: 'bg-fuchsia-500', pink: 'bg-pink-500', rose: 'bg-rose-500'
    };
    return colorMap[color] || 'bg-gray-500';
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Níveis de Alunos</h3>
          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Crie e personalize os níveis de habilidade dos seus alunos.</p>
        </div>
        <Button onClick={addLevel} type="button"><Plus className="h-4 w-4 mr-2" />Novo Nível</Button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {levels.map(level => (
          <div key={level.id} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="Nome do Nível"
              value={level.name}
              onChange={(e) => handleLevelChange(level.id, 'name', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Cor</label>
              <div className="relative">
                <select
                  value={level.color}
                  onChange={(e) => handleLevelChange(level.id, 'color', e.target.value)}
                  className="w-full form-select rounded-md pl-10 border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                >
                  {TAILWIND_COLORS.map(color => (
                    <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                  ))}
                </select>
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${getColorClass(level.color)}`}></div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => removeLevel(level.id)} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NiveisAlunosTab;
