import React from 'react';
import { GamificationReward } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { Plus, Trash2, Gift } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ToggleSwitch } from './ToggleSwitch';

interface RewardsSettingsProps {
  rewards: GamificationReward[];
  setRewards: React.Dispatch<React.SetStateAction<GamificationReward[]>>;
}

const RewardsSettings: React.FC<RewardsSettingsProps> = ({ rewards, setRewards }) => {
  const handleRewardChange = (id: string, field: keyof GamificationReward, value: any) => {
    setRewards(prev => prev.map(reward => reward.id === id ? { ...reward, [field]: value } : reward));
  };

  const addReward = () => {
    setRewards(prev => [
      ...prev,
      {
        id: uuidv4(),
        arena_id: '',
        title: 'Nova Recompensa',
        description: '',
        points_cost: 100,
        type: 'discount',
        value: 10,
        quantity: null,
        is_active: true,
      },
    ]);
  };

  const removeReward = (id: string) => {
    setRewards(prev => prev.filter(reward => reward.id !== id));
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Recompensas para Resgate</h3>
        <Button onClick={addReward} size="sm"><Plus className="h-4 w-4 mr-2" /> Nova Recompensa</Button>
      </div>
      <div className="space-y-4">
        {rewards.map(reward => (
          <div key={reward.id} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-900/50 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                <Input
                  placeholder="Título da Recompensa"
                  value={reward.title}
                  onChange={(e) => handleRewardChange(reward.id, 'title', e.target.value)}
                  className="font-semibold !text-base"
                />
              </div>
              <div className="flex items-center gap-4">
                <ToggleSwitch enabled={reward.is_active} setEnabled={(val) => handleRewardChange(reward.id, 'is_active', val)} />
                <Button variant="ghost" size="sm" onClick={() => removeReward(reward.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <Input
              placeholder="Descrição da recompensa"
              value={reward.description}
              onChange={(e) => handleRewardChange(reward.id, 'description', e.target.value)}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Custo (Pontos)"
                type="number"
                value={reward.points_cost.toString()}
                onChange={(e) => handleRewardChange(reward.id, 'points_cost', Number(e.target.value))}
              />
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo</label>
                <select
                  value={reward.type}
                  onChange={(e) => handleRewardChange(reward.id, 'type', e.target.value)}
                  className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white"
                >
                  <option value="discount">Desconto (R$)</option>
                  <option value="free_hour">Hora Grátis</option>
                  <option value="free_item">Item Grátis</option>
                </select>
              </div>
              <Input
                label="Valor"
                type="number"
                value={reward.value?.toString() || ''}
                onChange={(e) => handleRewardChange(reward.id, 'value', Number(e.target.value))}
                disabled={reward.type === 'free_hour'}
                placeholder={reward.type === 'discount' ? 'Valor do desc.' : 'ID do item'}
              />
              <Input
                label="Quantidade"
                type="number"
                value={reward.quantity?.toString() || ''}
                onChange={(e) => handleRewardChange(reward.id, 'quantity', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Ilimitado"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsSettings;
