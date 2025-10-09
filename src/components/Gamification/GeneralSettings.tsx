import React from 'react';
import { GamificationSettings } from '../../types';
import Input from '../Forms/Input';
import { ToggleSwitch } from './ToggleSwitch';
import { Info } from 'lucide-react';

interface GeneralSettingsProps {
  settings: GamificationSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<GamificationSettings | null>>;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, setSettings }) => {
  if (!settings) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => prev ? { ...prev, [name]: Number(value) } : null);
  };

  const handleToggle = (isEnabled: boolean) => {
    setSettings(prev => prev ? { ...prev, is_enabled: isEnabled } : null);
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="text-xl font-semibold mb-6">Configurações Gerais</h3>
      <div className="space-y-6">
        
        <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
          <h4 className="font-semibold mb-2 flex items-center text-blue-900 dark:text-blue-200"><Info className="h-5 w-5 mr-2" />Como Configurar o MatchPlay Rewards</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li><strong>Ative o Sistema:</strong> Use o botão abaixo para habilitar o sistema de gamificação.</li>
            <li><strong>Defina a Pontuação:</strong> Configure quantos pontos seus clientes ganharão por reserva ou por valor gasto.</li>
            <li><strong>Configure os Níveis:</strong> Na aba "Níveis", defina os ranks (Bronze, Prata, Ouro) e quantos pontos são necessários para alcançá-los.</li>
            <li><strong>Crie Recompensas:</strong> Na aba "Recompensas", crie os prêmios que seus clientes poderão resgatar com os pontos acumulados.</li>
            <li><strong>Gerencie as Conquistas:</strong> Na aba "Conquistas", você pode revisar e ajustar as medalhas automáticas que os clientes ganham ao atingir marcos.</li>
          </ol>
        </div>

        <div className="flex items-center justify-between p-4 bg-brand-gray-50 dark:bg-brand-gray-900/50 rounded-lg">
          <div>
            <h4 className="font-medium text-brand-gray-900 dark:text-white">Ativar Sistema de Gamificação</h4>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Habilite ou desabilite o MatchPlay Rewards para seus clientes.</p>
          </div>
          <ToggleSwitch enabled={settings.is_enabled} setEnabled={handleToggle} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Pontos por Reserva"
            name="points_per_reservation"
            type="number"
            value={settings.points_per_reservation.toString()}
            onChange={handleChange}
            placeholder="Ex: 10"
            disabled={!settings.is_enabled}
          />
          <Input
            label="Pontos por Real Gasto (R$)"
            name="points_per_real"
            type="number"
            value={settings.points_per_real.toString()}
            onChange={handleChange}
            placeholder="Ex: 1"
            disabled={!settings.is_enabled}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
