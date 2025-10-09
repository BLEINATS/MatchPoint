import React from 'react';
import { PricingRule } from '../../types';
import { Plus, Trash2, DollarSign, Calendar, Clock, Tag, CheckSquare, Square } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { v4 as uuidv4 } from 'uuid';

interface PricingRulesEditorProps {
  rules: PricingRule[];
  setRules: React.Dispatch<React.SetStateAction<PricingRule[]>>;
}

const ALL_SPORTS = ['Qualquer Esporte', 'Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Tênis', 'Padel', 'Futebol Society'];
const DAYS_OF_WEEK = [
  { label: 'Dom', value: 0 }, { label: 'Seg', value: 1 }, { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 }, { label: 'Qui', value: 4 }, { label: 'Sex', value: 5 }, { label: 'Sáb', value: 6 }
];

const PricingRulesEditor: React.FC<PricingRulesEditorProps> = ({ rules, setRules }) => {

  const handleAddNew = () => {
    const newRule: PricingRule = {
      client_id: uuidv4(),
      sport_type: 'Qualquer Esporte',
      start_time: '00:00',
      end_time: '23:59',
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      price_single: 0,
      price_monthly: 0,
      is_active: true,
      is_default: false,
    } as PricingRule;
    setRules([...rules, newRule]);
  };

  const handleRuleChange = (clientId: string, field: keyof PricingRule, value: any) => {
    let newRules = rules.map(r => 
        r.client_id === clientId ? { ...r, [field]: value } : r
    );

    if (field === 'is_default' && value === true) {
        const sportType = newRules.find(r => r.client_id === clientId)?.sport_type;
        newRules = newRules.map(r => {
            if (r.sport_type === sportType && r.client_id !== clientId) {
                return { ...r, is_default: false };
            }
            return r;
        });
    }
    setRules(newRules);
  };
  
  const handleDayToggle = (clientId: string, dayValue: number) => {
      const newRules = rules.map(r => {
          if (r.client_id === clientId) {
              const currentDays = r.days_of_week;
              const newDays = currentDays.includes(dayValue)
                  ? currentDays.filter(d => d !== dayValue)
                  : [...currentDays, dayValue];
              return { ...r, days_of_week: newDays.sort() };
          }
          return r;
      });
      setRules(newRules);
  };

  const handleDelete = (clientId: string) => {
    setRules(rules.filter(r => r.client_id !== clientId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-brand-gray-900 dark:text-white">Regras de Precificação</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>
      
      <div className="space-y-4">
        {rules.length > 0 ? (
          rules.map((rule) => (
            <div key={rule.client_id} className={`p-4 border rounded-lg space-y-4 ${rule.is_active ? 'bg-white dark:bg-brand-gray-800' : 'bg-brand-gray-100 dark:bg-brand-gray-800/50 opacity-70'}`}>
              <div className="flex justify-between items-start">
                  <div className="space-y-1">
                      <div className="flex items-center gap-2">
                          <select
                            value={rule.sport_type}
                            onChange={e => handleRuleChange(rule.client_id!, 'sport_type', e.target.value)}
                            className="form-select text-sm font-semibold rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
                          >
                            {ALL_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button type="button" onClick={() => handleRuleChange(rule.client_id!, 'is_default', !rule.is_default)} className="flex items-center gap-2 text-sm">
                            {rule.is_default ? <CheckSquare className="h-4 w-4 text-brand-blue-500"/> : <Square className="h-4 w-4 text-brand-gray-400"/>}
                            <span className="font-medium text-brand-gray-700 dark:text-brand-gray-300">Padrão</span>
                          </button>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
                          <input 
                              type="checkbox"
                              checked={rule.is_active}
                              onChange={e => handleRuleChange(rule.client_id!, 'is_active', e.target.checked)}
                              className="form-checkbox h-4 w-4 rounded text-brand-blue-600 focus:ring-brand-blue-500"
                          />
                          Ativa
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.client_id!)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4"/></Button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="block text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400">Dias da Semana</label>
                      <div className="flex flex-wrap gap-1">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleDayToggle(rule.client_id!, day.value)}
                            className={`w-8 h-8 text-xs font-bold rounded-md ${rule.days_of_week.includes(day.value) ? 'bg-brand-blue-600 text-white' : 'bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200'}`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                       <Input label="Hora Início" type="time" value={rule.start_time} onChange={e => handleRuleChange(rule.client_id!, 'start_time', e.target.value.slice(0,5))} />
                       <Input label="Hora Fim" type="time" value={rule.end_time} onChange={e => handleRuleChange(rule.client_id!, 'end_time', e.target.value.slice(0,5))} />
                  </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Preço Avulso (R$)" type="number" value={rule.price_single} onChange={e => handleRuleChange(rule.client_id!, 'price_single', parseFloat(e.target.value) || 0)} />
                  <Input label="Preço Mensal (R$)" type="number" value={rule.price_monthly} onChange={e => handleRuleChange(rule.client_id!, 'price_monthly', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-brand-gray-500 text-center py-8">Nenhuma regra de preço definida. Clique em "Nova Regra" para começar.</p>
        )}
      </div>
    </div>
  );
};

export default PricingRulesEditor;
