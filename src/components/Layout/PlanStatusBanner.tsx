import React from 'react';
import { Link } from 'react-router-dom';
import { Arena, Profile } from '../../types';
import { AlertTriangle, XCircle, Star } from 'lucide-react';
import Button from '../Forms/Button';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';

interface PlanStatusBannerProps {
  arena: Arena;
  profile: Profile;
}

const PlanStatusBanner: React.FC<PlanStatusBannerProps> = ({ arena, profile }) => {
  const { plan, subscription, isExpired, isPastDue, isActive, nextBillingDate, isTrial, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return null;
  }

  let config: { icon: React.ElementType, bgColor: string, textColor: string, message: string } | null = null;
  
  if (!subscription || !plan) {
    config = {
      icon: AlertTriangle,
      bgColor: 'bg-orange-600',
      textColor: 'text-white',
      message: 'Você ainda não tem um plano ativo. Contrate agora para ativar todos os recursos!',
    };
  } else if (isExpired) {
    config = {
      icon: XCircle,
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      message: `Sua assinatura do plano ${plan.name} expirou. Renove seu plano para reativar os recursos.`,
    };
  } else if (isPastDue) {
    config = {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-900',
      message: `Seu plano ${plan.name} está com o pagamento pendente. Regularize para não perder acesso aos recursos.`,
    };
  } else if (isActive) {
    let dateInfo = '';
    if (nextBillingDate && isValid(nextBillingDate)) {
      const formattedDate = format(nextBillingDate, "dd 'de' MMMM", { locale: ptBR });
      if (isTrial || plan.duration_days) {
        dateInfo = `Expira em ${formattedDate}.`;
      } else {
        dateInfo = `Próxima cobrança em ${formattedDate}.`;
      }
    }
    
    const message = `Você está no plano ${plan.name}. ${dateInfo}`;

    config = {
      icon: Star,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      message: message,
    };
  }

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.textColor} py-2 px-4 sm:px-6 lg:px-8 text-sm font-medium`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <p>{config.message}</p>
        </div>
        <Link to="/settings" state={{ activeTab: 'plan' }}>
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white !px-3 !py-1">
            Gerenciar Plano
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PlanStatusBanner;
