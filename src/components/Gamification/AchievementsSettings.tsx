import React from 'react';
import { GamificationAchievement } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { Plus, Trash2, Star } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as LucideIcons from 'lucide-react';

// Componente para renderizar ícones dinamicamente
const DynamicIcon = ({ name, ...props }: { name: string } & React.ComponentProps<typeof LucideIcons.Icon>) => {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) {
    return <Star {...props} />; // Ícone padrão
  }
  return <IconComponent {...props} />;
};

interface AchievementsSettingsProps {
  achievements: GamificationAchievement[];
  setAchievements: React.Dispatch<React.SetStateAction<GamificationAchievement[]>>;
}

const AchievementsSettings: React.FC<AchievementsSettingsProps> = ({ achievements, setAchievements }) => {
  const handleAchievementChange = (id: string, field: keyof GamificationAchievement, value: any) => {
    setAchievements(prev => prev.map(ach => ach.id === id ? { ...ach, [field]: value } : ach));
  };

  const addAchievement = () => {
    setAchievements(prev => [
      ...prev,
      {
        id: uuidv4(),
        arena_id: '',
        name: 'Nova Conquista',
        description: '',
        type: 'first_reservation',
        points_reward: 10,
        icon: 'Star',
      },
    ]);
  };

  const removeAchievement = (id: string) => {
    setAchievements(prev => prev.filter(ach => ach.id !== id));
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Conquistas e Medalhas</h3>
        <Button onClick={addAchievement} size="sm"><Plus className="h-4 w-4 mr-2" /> Nova Conquista</Button>
      </div>
      <div className="space-y-4">
        {achievements.map(ach => (
          <div key={ach.id} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-900/50 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4 flex-1">
                {/* Icon Preview */}
                <div className="flex flex-col items-center">
                  <label className="block text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">Ícone</label>
                  <div className="p-3 bg-brand-gray-200 dark:bg-brand-gray-800 rounded-lg">
                    <DynamicIcon name={ach.icon} className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                {/* Name Input */}
                <div className="flex-1">
                  <Input
                    label="Nome da Conquista"
                    placeholder="Nome da Conquista"
                    value={ach.name}
                    onChange={(e) => handleAchievementChange(ach.id, 'name', e.target.value)}
                    className="font-semibold !text-base"
                  />
                </div>
              </div>
              {/* Delete Button */}
              <Button variant="ghost" size="sm" onClick={() => removeAchievement(ach.id)} className="text-red-500 ml-4">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              label="Descrição"
              placeholder="Descrição da conquista"
              value={ach.description}
              onChange={(e) => handleAchievementChange(ach.id, 'description', e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo de Gatilho</label>
                <select
                  value={ach.type}
                  onChange={(e) => handleAchievementChange(ach.id, 'type', e.target.value)}
                  className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white"
                >
                  <option value="first_reservation">Primeira Reserva</option>
                  <option value="play_all_courts">Jogar em todas as quadras</option>
                  <option value="weekly_frequency">Frequência Semanal</option>
                  <option value="loyalty_10">Lealdade (10 reservas)</option>
                  <option value="loyalty_50">Lealdade (50 reservas)</option>
                  <option value="loyalty_100">Lealdade (100 reservas)</option>
                </select>
              </div>
              <Input
                label="Recompensa (Pontos)"
                type="number"
                value={ach.points_reward.toString()}
                onChange={(e) => handleAchievementChange(ach.id, 'points_reward', Number(e.target.value))}
              />
              <Input
                label="Ícone (Lucide)"
                value={ach.icon}
                onChange={(e) => handleAchievementChange(ach.id, 'icon', e.target.value)}
                placeholder="Ex: Star, Crown, Heart"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsSettings;
