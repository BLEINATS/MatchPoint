import React, { useState, useEffect } from 'react';
import { Arena } from '../../types';
import { FileText, Info, Clock, Handshake, Globe } from 'lucide-react';
import Input from '../Forms/Input';

interface OperationTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const OperationTab: React.FC<OperationTabProps> = ({ formData, setFormData }) => {
  const [sportsInput, setSportsInput] = useState('');

  useEffect(() => {
    if (Array.isArray(formData.available_sports)) {
      setSportsInput(formData.available_sports.join(', '));
    }
  }, [formData.available_sports]);

  const handleSportsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSportsInput(e.target.value);
  };

  const handleSportsInputBlur = () => {
    const sportsArray = sportsInput.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, available_sports: sportsArray }));
  };

  const handleDeadlineChange = (
    field: 'class_cancellation_deadline' | 'class_booking_deadline',
    part: 'value' | 'unit',
    value: string
  ) => {
    const valueKey = `${field}_value` as keyof Arena;
    const unitKey = `${field}_unit` as keyof Arena;

    if (part === 'value') {
      setFormData(prev => ({ ...prev, [valueKey]: value === '' ? null : parseInt(value, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [unitKey]: value as 'hours' | 'minutes' }));
    }
  };

  const handleAthleteSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseInt(value, 10)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const defaultCancellationPolicy = `POLÍTICA DE CANCELAMENTO

• Cancelamento com 24h ou mais de antecedência: reembolso de 100%
• Cancelamento entre 12h e 24h: reembolso de 50%
• Cancelamento com menos de 12h: sem reembolso
• Em caso de chuva forte: reagendamento ou reembolso integral
• Comprovante médico: reembolso integral independente do prazo

Para cancelar, entre em contato pelo WhatsApp ou telefone informando o número da reserva.`;

  const fillDefaultPolicy = (field: 'cancellation_policy') => {
    const defaultValue = defaultCancellationPolicy;
    setFormData(prev => ({ ...prev, [field]: defaultValue }));
  };

  return (
    <div className="space-y-8">
      <Section title="Esportes da Arena" icon={Globe}>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Personalize a lista de esportes disponíveis na sua arena. Esta lista será usada nos cadastros e filtros. Separe os nomes por vírgula.
        </p>
        <Input
          label="Lista de Esportes"
          name="available_sports_input"
          value={sportsInput}
          onChange={handleSportsInputChange}
          onBlur={handleSportsInputBlur}
          placeholder="Beach Tennis, Futevôlei, Tênis de Mesa"
        />
      </Section>
      <Section title="Políticas da Arena" icon={FileText}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Política de Cancelamento de Reservas</label>
            <button
              type="button"
              onClick={() => fillDefaultPolicy('cancellation_policy')}
              className="text-xs text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-800 dark:hover:text-brand-blue-300 font-medium"
            >
              Usar modelo padrão
            </button>
          </div>
          <textarea
            rows={8}
            name="cancellation_policy"
            value={formData.cancellation_policy || ''}
            onChange={handleChange}
            className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
            placeholder="Ex: Cancelamentos com até 24h de antecedência têm reembolso de 100%. Após esse período, não há reembolso."
          />
        </div>
      </Section>
      <Section title="Gestão de Aulas" icon={Clock}>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
              Defina o prazo limite para que um aluno possa <strong>agendar</strong> uma aula. Após este prazo, o agendamento não será mais permitido.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input
                label="Prazo para Agendamento"
                name="class_booking_deadline_value"
                type="number"
                min="0"
                value={formData.class_booking_deadline_value || ''}
                onChange={(e) => handleDeadlineChange('class_booking_deadline', 'value', e.target.value)}
                placeholder="Ex: 2"
              />
              <div className="flex items-end">
                <select
                  name="class_booking_deadline_unit"
                  value={formData.class_booking_deadline_unit || 'hours'}
                  onChange={(e) => handleDeadlineChange('class_booking_deadline', 'unit', e.target.value)}
                  className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
                >
                  <option value="hours">Horas antes</option>
                  <option value="minutes">Minutos antes</option>
                </select>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700">
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
              Defina o prazo limite para que um aluno possa <strong>cancelar</strong> uma aula agendada. Após este prazo, a aula será considerada como realizada.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input
                label="Prazo para Cancelamento"
                name="class_cancellation_deadline_value"
                type="number"
                min="0"
                value={formData.class_cancellation_deadline_value || ''}
                onChange={(e) => handleDeadlineChange('class_cancellation_deadline', 'value', e.target.value)}
                placeholder="Ex: 12"
              />
              <div className="flex items-end">
                <select
                  name="class_cancellation_deadline_unit"
                  value={formData.class_cancellation_deadline_unit || 'hours'}
                  onChange={(e) => handleDeadlineChange('class_cancellation_deadline', 'unit', e.target.value)}
                  className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
                >
                  <option value="hours">Horas antes</option>
                  <option value="minutes">Minutos antes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Gestão de Atletas de Aluguel" icon={Handshake}>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Defina prazos para a contratação, cancelamento e pagamento de atletas de aluguel.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Prazo para Contratar (horas antes)"
            name="athlete_booking_deadline_hours"
            type="number"
            min="0"
            value={formData.athlete_booking_deadline_hours || ''}
            onChange={handleAthleteSettingChange}
            placeholder="Ex: 24"
          />
          <Input
            label="Prazo para Cancelar (horas antes)"
            name="athlete_cancellation_deadline_hours"
            type="number"
            min="0"
            value={formData.athlete_cancellation_deadline_hours || ''}
            onChange={handleAthleteSettingChange}
            placeholder="Ex: 12"
          />
        </div>
        <Input
          label="Tempo para Pagamento (minutos após aceite)"
          name="athlete_payment_window_minutes"
          type="number"
          min="5"
          value={formData.athlete_payment_window_minutes || ''}
          onChange={handleAthleteSettingChange}
          placeholder="Ex: 30"
        />
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4 flex items-center">
      <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
      {title}
    </h3>
    <div className="space-y-6">{children}</div>
  </div>
);

export default OperationTab;
