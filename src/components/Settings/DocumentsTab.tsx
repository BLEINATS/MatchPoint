import React from 'react';
import { Arena } from '../../types';
import { FileText } from 'lucide-react';

interface DocumentsTabProps {
  formData: Partial<Arena>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Arena>>>;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ formData, setFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const defaultPrivacyPolicy = `POLÍTICA DE PRIVACIDADE

Esta Política de Privacidade descreve como suas informações pessoais são coletadas, usadas e compartilhadas quando você utiliza os serviços da nossa arena.

INFORMAÇÕES PESSOAIS QUE COLETAMOS
Quando você faz uma reserva ou se cadastra, coletamos certas informações suas, incluindo seu nome, e-mail, número de telefone e histórico de reservas.

COMO USAMOS SUAS INFORMAÇÕES PESSOAIS?
Usamos as informações que coletamos para:
- Processar suas reservas e pagamentos.
- Comunicar com você sobre suas reservas e outros assuntos relacionados à arena.
- Enviar informações sobre promoções e eventos, caso você opte por recebê-las.

COMPARTILHAMENTO DE SUAS INFORMAÇÕES PESSOAIS
Não compartilhamos suas informações pessoais com terceiros, exceto para cumprir as leis aplicáveis ou para proteger nossos direitos.

SEUS DIREITOS
Você tem o direito de acessar as informações pessoais que mantemos sobre você e de pedir que suas informações pessoais sejam corrigidas, atualizadas ou excluídas.

CONTATE-NOS
Para mais informações sobre nossas práticas de privacidade, se você tiver dúvidas, ou se quiser fazer uma reclamação, entre em contato conosco por e-mail ou telefone.`;

  const defaultTermsOfUse = `TERMOS DE USO DA ARENA

EQUIPAMENTOS E VESTUÁRIO:
• Obrigatório uso de calçado esportivo adequado (chuteira society, tênis)
• Proibido uso de chuteira com travas de metal
• Recomendado uso de roupas esportivas

REGRAS GERAIS:
• Proibido fumar nas dependências da arena
• Proibido consumo de bebidas alcoólicas que não sejam vendidas no local
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

  const fillDefaultContent = (field: 'privacy_policy' | 'terms_of_use') => {
    const defaultValue = field === 'privacy_policy' ? defaultPrivacyPolicy : defaultTermsOfUse;
    setFormData(prev => ({ ...prev, [field]: defaultValue }));
  };

  return (
    <div className="space-y-8">
      <Section title="Documentos Legais" icon={FileText}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Política de Privacidade</label>
            <button
              type="button"
              onClick={() => fillDefaultContent('privacy_policy')}
              className="text-xs text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-800 dark:hover:text-brand-blue-300 font-medium"
            >
              Usar modelo padrão
            </button>
          </div>
          <textarea
            rows={12}
            name="privacy_policy"
            value={formData.privacy_policy || ''}
            onChange={handleChange}
            className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
            placeholder="Descreva como você coleta, usa e protege os dados dos seus clientes..."
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Termos de Uso</label>
            <button
              type="button"
              onClick={() => fillDefaultContent('terms_of_use')}
              className="text-xs text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-800 dark:hover:text-brand-blue-300 font-medium"
            >
              Usar modelo padrão
            </button>
          </div>
          <textarea
            rows={12}
            name="terms_of_use"
            value={formData.terms_of_use || ''}
            onChange={handleChange}
            className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
            placeholder="Defina as regras gerais de utilização da sua arena, responsabilidades, etc..."
          />
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

export default DocumentsTab;
