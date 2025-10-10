import React from 'react';
import { Arena } from '../../types';
import Input from '../Forms/Input';
import { CreditCard, Key, Info } from 'lucide-react';

interface PaymentSettingsTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const PaymentSettingsTab: React.FC<PaymentSettingsTabProps> = ({ formData, setFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      <Section title="Configuração de Pagamentos" icon={CreditCard}>
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
          <h5 className="font-medium mb-2 flex items-center text-blue-900 dark:text-blue-200">
            <Info className="h-4 w-4 mr-2" />
            Receba pagamentos online
          </h5>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Integre sua conta do Asaas para receber pagamentos de reservas, torneios e mensalidades via Pix e Cartão de Crédito. Esta chave é o primeiro passo para automatizar seu faturamento.
          </p>
        </div>

        <Input
          label="Chave de API Asaas"
          name="asaas_api_key"
          type="password"
          value={formData.asaas_api_key || ''}
          onChange={handleChange}
          placeholder="prod_xxxxxxxxxxxxxxxxxxxxxxxx"
          icon={<Key className="h-4 w-4 text-brand-gray-400" />}
        />
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 -mt-2">
          Sua chave é armazenada de forma segura e não será exibida novamente. Você pode encontrá-la no seu painel do Asaas em Integrações &gt; Chaves de API.
        </p>
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

export default PaymentSettingsTab;
