import React from 'react';
import { CheckCircle, BarChart2, Star, Lock } from 'lucide-react';
import Button from '../Forms/Button';

const PlanTab: React.FC = () => {
  return (
    <div className="space-y-12">
      <Section title="Plano e Faturamento" icon={BarChart2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Plano Atual */}
          <div className="border-2 border-brand-blue-500 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 relative">
            <div className="absolute top-0 -translate-y-1/2 left-6 bg-brand-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Plano Atual
            </div>
            <h4 className="text-2xl font-bold text-brand-gray-900 dark:text-white mt-4">Básico</h4>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">Tudo que você precisa para começar.</p>
            <p className="text-4xl font-extrabold text-brand-gray-900 dark:text-white mb-6">
              Grátis
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Até 5 quadras</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Reservas online</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Dashboard de gestão</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Página pública da arena</li>
            </ul>
          </div>

          {/* Upgrade Plano Pro */}
          <div className="border border-brand-gray-200 dark:border-brand-gray-700 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-xl p-6 relative overflow-hidden">
             <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center transform rotate-12">
              <Star className="h-4 w-4 mr-1" /> MAIS POPULAR
            </div>
            <h4 className="text-2xl font-bold text-brand-gray-900 dark:text-white">Pro</h4>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">Para arenas que querem crescer.</p>
            <p className="text-4xl font-extrabold text-brand-gray-900 dark:text-white mb-2">
              R$ 99,90
              <span className="text-base font-medium text-brand-gray-500 dark:text-brand-gray-400">/mês</span>
            </p>
             <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-6">Cobrança em breve via Asaas.</p>
            <ul className="space-y-3 text-sm mb-8">
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Quadras ilimitadas</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Relatórios avançados</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Gestão de clientes (CRM)</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Suporte prioritário</li>
            </ul>
            <Button className="w-full" disabled>
              <Lock className="h-4 w-4 mr-2" />
              Upgrade em Breve
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-6 flex items-center">
      <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export default PlanTab;
