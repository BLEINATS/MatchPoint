import React from 'react';
import { Arena } from '../../types';
import { BarChart2, Info, AlertTriangle, Bell, Clock, BadgePercent } from 'lucide-react';
import Input from '../Forms/Input';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';

interface FaturamentoTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const FaturamentoTab: React.FC<FaturamentoTabProps> = ({ formData, setFormData }) => {
  const handleBillingDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let day = parseInt(e.target.value, 10);
    if (isNaN(day)) day = 1;
    if (day < 1) day = 1;
    if (day > 28) day = 28;
    setFormData(prev => ({ ...prev, billing_day: day }));
  };

  const handleGracePeriodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'billing_grace_period_value' ? parseInt(value, 10) || 0 : value,
    }));
  };
  
  const handlePaymentWindowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      single_booking_payment_window_minutes: parseInt(e.target.value, 10) || 30,
    }));
  };

  const handleToggleWarning = (key: 'billing_warning_1_enabled' | 'billing_warning_2_enabled' | 'billing_warning_3_enabled') => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      <Section title="Cobrança Recorrente" icon={BarChart2}>
        <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
          <h5 className="font-medium mb-2 flex items-center text-blue-900 dark:text-blue-200"><Info className="h-4 w-4 mr-2" />Como funciona</h5>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Defina o dia do mês para a cobrança automática das mensalidades. O sistema gerará as faturas para todos os clientes com planos recorrentes nesta data.
          </p>
        </div>
        <Input
          label="Dia da Cobrança Mensal"
          name="billing_day"
          type="number"
          min="1"
          max="28"
          value={formData.billing_day || 1}
          onChange={handleBillingDayChange}
          placeholder="Ex: 5"
        />
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Insira um número de 1 a 28. Cobranças serão geradas neste dia de cada mês.
        </p>
      </Section>

      <Section title="Reservas Avulsas" icon={Clock}>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Defina o tempo que o cliente tem para realizar o pagamento de uma reserva avulsa antes que ela seja cancelada automaticamente.
        </p>
        <Input
          label="Tempo para Pagamento (minutos)"
          name="single_booking_payment_window_minutes"
          type="number"
          min="5"
          value={formData.single_booking_payment_window_minutes || 30}
          onChange={handlePaymentWindowChange}
          placeholder="Ex: 30"
        />
      </Section>

      <Section title="Gestão de Créditos" icon={BadgePercent}>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Defina um prazo de validade para os créditos que seus clientes recebem (ex: por cancelamento de reserva). Após este período, o crédito expira e não pode mais ser usado.
        </p>
        <Input
          label="Validade dos Créditos (dias)"
          name="credit_expiration_days"
          type="number"
          min="0"
          value={formData.credit_expiration_days || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, credit_expiration_days: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
          placeholder="Deixe em branco para não expirar"
        />
      </Section>

      <Section title="Cancelamento por Inadimplência" icon={AlertTriangle}>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Cancele automaticamente as reservas recorrentes e planos de aula de clientes que não efetuarem o pagamento após o vencimento.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Input
            label="Prazo de Tolerância"
            name="billing_grace_period_value"
            type="number"
            min="0"
            value={formData.billing_grace_period_value || 0}
            onChange={handleGracePeriodChange}
            placeholder="Ex: 72"
          />
          <select
            name="billing_grace_period_unit"
            value={formData.billing_grace_period_unit || 'hours'}
            onChange={handleGracePeriodChange}
            className="form-select w-full rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
          >
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </div>
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Defina quanto tempo após o vencimento o sistema deve esperar antes de cancelar. (0 para desativar)
        </p>
      </Section>

      <Section title="Alertas de Cobrança" icon={Bell}>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Envie notificações automáticas para seus clientes sobre o status de suas faturas.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50">
            <div>
              <p className="font-medium">Lembrete de Vencimento</p>
              <p className="text-xs text-brand-gray-500">Enviar um lembrete alguns dias antes da data de cobrança.</p>
            </div>
            <ToggleSwitch enabled={formData.billing_warning_1_enabled || false} setEnabled={() => handleToggleWarning('billing_warning_1_enabled')} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50">
            <div>
              <p className="font-medium">Aviso de Fatura Vencida</p>
              <p className="text-xs text-brand-gray-500">Notificar o cliente assim que a fatura vencer.</p>
            </div>
            <ToggleSwitch enabled={formData.billing_warning_2_enabled || false} setEnabled={() => handleToggleWarning('billing_warning_2_enabled')} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50">
            <div>
              <p className="font-medium">Notificação de Cancelamento</p>
              <p className="text-xs text-brand-gray-500">Informar o cliente que seu plano/reserva foi cancelado por falta de pagamento.</p>
            </div>
            <ToggleSwitch enabled={formData.billing_warning_3_enabled || false} setEnabled={() => handleToggleWarning('billing_warning_3_enabled')} />
          </div>
        </div>
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

export default FaturamentoTab;
