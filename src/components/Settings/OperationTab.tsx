import React from 'react';
import { Arena } from '../../types';
import { FileText, Info } from 'lucide-react';

interface OperationTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const OperationTab: React.FC<OperationTabProps> = ({ formData, setFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Políticas padrão como modelo
  const defaultCancellationPolicy = `POLÍTICA DE CANCELAMENTO

• Cancelamento com 24h ou mais de antecedência: reembolso de 100%
• Cancelamento entre 12h e 24h: reembolso de 50%
• Cancelamento com menos de 12h: sem reembolso
• Em caso de chuva forte: reagendamento ou reembolso integral
• Comprovante médico: reembolso integral independente do prazo

Para cancelar, entre em contato pelo WhatsApp ou telefone informando o número da reserva.`;

  const defaultTermsOfUse = `TERMOS DE USO DA ARENA

EQUIPAMENTOS E VESTUÁRIO:
• Obrigatório uso de calçado esportivo adequado (chuteira society, tênis)
• Proibido uso de chuteira com travas de metal
• Recomendado uso de roupas esportivas

REGRAS GERAIS:
• Proibido fumar nas dependências da arena
• Proibido consumo de bebidas alcoólicas
• Não é permitido levar animais de estimação
• Música deve estar em volume moderado

RESPONSABILIDADES:
• A arena não se responsabiliza por objetos perdidos ou furtados
• Praticantes jogam por sua conta e risco
• Danos ao patrimônio serão cobrados do responsável pela reserva
• Tolerância de 15 minutos para chegada

COMPORTAMENTO:
• Respeite outros usuários e a vizinhança
• Mantenha a quadra limpa
• Comunique imediatamente qualquer problema ou acidente`;

  const fillDefaultPolicy = (field: 'cancellation_policy' | 'terms_of_use') => {
    const defaultValue = field === 'cancellation_policy' ? defaultCancellationPolicy : defaultTermsOfUse;
    setFormData(prev => ({ ...prev, [field]: defaultValue }));
  };

  return (
    <div className="space-y-8">
      <Section title="Políticas da Arena" icon={FileText}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Política de Cancelamento</label>
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
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Termos de Uso</label>
            <button
              type="button"
              onClick={() => fillDefaultPolicy('terms_of_use')}
              className="text-xs text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-800 dark:hover:text-brand-blue-300 font-medium"
            >
              Usar modelo padrão
            </button>
          </div>
          <textarea
            rows={10}
            name="terms_of_use"
            value={formData.terms_of_use || ''}
            onChange={handleChange}
            className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
            placeholder="Ex: É obrigatório o uso de calçado apropriado. Proibido fumar nas dependências da quadra."
          />
        </div>
      </Section>
      
      <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
        <h5 className="font-medium mb-2 flex items-center text-blue-900 dark:text-blue-200"><Info className="h-4 w-4 mr-2" />Informação</h5>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Estas políticas serão exibidas para seus clientes durante o processo de reserva para garantir que todos estejam cientes das regras.
        </p>
      </div>
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
