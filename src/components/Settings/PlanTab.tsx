import React, { useState } from 'react';
import { CheckCircle, BarChart2, Star, Calendar, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import Button from '../Forms/Button';
import { Plan, Subscription, Arena } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import PaymentModal from '../SuperAdmin/PaymentModal';

interface PlanTabProps {
  plans: Plan[];
  arena: Arena | null;
  currentSubscription: Subscription | null;
}

const PriceDisplay: React.FC<{ plan: Plan | undefined }> = ({ plan }) => {
  if (!plan) return <span>A definir</span>;

  const isFreePlan = (plan.trial_days && plan.trial_days > 0) || (plan.duration_days && plan.duration_days > 0 && plan.price === 0);

  if (isFreePlan) {
    const duration = plan.trial_days || plan.duration_days;
    return (
      <>
        <span className="text-4xl font-extrabold text-brand-gray-900 dark:text-white">-</span>
        <span className="text-base font-medium text-brand-gray-500 dark:text-brand-gray-400">/ {duration} dias</span>
      </>
    );
  }

  const cycleLabel = {
    monthly: '/mês',
    quarterly: '/trimestre',
    semiannual: '/semestre',
    annual: '/ano',
  }[plan.billing_cycle] || '';

  return (
    <>
      <span className="text-4xl font-extrabold text-brand-gray-900 dark:text-white">{formatCurrency(plan.price)}</span>
      <span className="text-base font-medium text-brand-gray-500 dark:text-brand-gray-400">{cycleLabel}</span>
    </>
  );
};


const PlanTab: React.FC<PlanTabProps> = ({ plans, arena, currentSubscription }) => {
  const { plan: currentPlan, nextBillingDate, isTrial, isPastDue } = useSubscriptionStatus();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const otherPlans = plans.filter(p => p.id !== currentPlan?.id && p.is_active);

  const billingDateLabel = (isTrial || currentPlan?.duration_days) ? 'Expira em:' : 'Próxima cobrança em:';
  const formattedNextBillingDate = (nextBillingDate && isValid(nextBillingDate)) ? format(nextBillingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;

  const handleUpgradePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
    window.location.reload();
  };

  return (
    <>
      <div className="space-y-12">
        <Section title="Plano e Faturamento" icon={BarChart2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Plano Atual */}
          {currentPlan ? (
            <div className="border-2 border-brand-blue-500 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 relative">
              <div className="absolute top-0 -translate-y-1/2 left-6 bg-brand-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Plano Atual
              </div>
              <h4 className="text-2xl font-bold text-brand-gray-900 dark:text-white mt-4">{currentPlan.name}</h4>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">Seu plano de assinatura atual.</p>
              <div className="mb-6">
                <PriceDisplay plan={currentPlan} />
              </div>
              <ul className="space-y-3 text-sm">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />{feature}</li>
                ))}
                <li className="pt-3 mt-3 border-t border-brand-gray-200 dark:border-brand-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 text-brand-gray-400 mr-2" />
                    Assinatura iniciada em: <strong className="ml-1">{currentSubscription ? format(parseDateStringAsLocal(currentSubscription.start_date), 'dd/MM/yyyy') : '--'}</strong>
                </li>
                {formattedNextBillingDate && (
                    <li className="flex items-center">
                        <DollarSign className="h-4 w-4 text-brand-gray-400 mr-2" />
                        {billingDateLabel} <strong className="ml-1">{formattedNextBillingDate}</strong>
                    </li>
                )}
              </ul>
               {isPastDue && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-sm flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-3" />
                      Seu pagamento está pendente. Contate o suporte para regularizar.
                  </div>
              )}
            </div>
          ) : (
             <div className="border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 text-center bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6">
                <h4 className="text-2xl font-bold text-brand-gray-900 dark:text-white">Nenhum Plano Ativo</h4>
                <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Você não possui uma assinatura ativa no momento.</p>
             </div>
          )}

          {/* Upgrade Plans */}
          {otherPlans.map((plan, index) => (
            <div key={plan.id} className="border border-brand-gray-200 dark:border-brand-gray-700 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-xl p-6 relative overflow-hidden">
              {index === 0 && (
                 <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center transform rotate-12">
                  <Star className="h-4 w-4 mr-1" /> UPGRADE
                </div>
              )}
              <h4 className="text-2xl font-bold text-brand-gray-900 dark:text-white">{plan.name}</h4>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">Faça o upgrade para desbloquear mais recursos.</p>
              <div className="mb-6">
                <PriceDisplay plan={plan} />
              </div>
              <ul className="space-y-3 text-sm mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />{feature}</li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handleUpgradePlan(plan)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Contratar Plano
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>

    {selectedPlan && arena && (
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPlan(null);
        }}
        arena={arena}
        plan={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />
    )}
    </>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-6 flex items-center">
        <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default PlanTab;
