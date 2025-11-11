import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Handshake, Calendar } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';
import { Reserva, AtletaAluguel } from '../../types';

export interface RepassePaymentItem {
  reservaId: string;
  profissionalId: string;
  profissionalName: string;
  profissionalAvatar?: string | null;
  clientName: string;
  date: string;
  netAmount: number;
}

interface AtletasPendentesWidgetProps {
  atletas: AtletaAluguel[];
  reservas: Reserva[];
  onCardClick: (payment: RepassePaymentItem) => void;
  className?: string;
}

const AtletasPendentesWidget: React.FC<AtletasPendentesWidgetProps> = ({ atletas, reservas, onCardClick, className }) => {
  const pendingPayments = useMemo(() => {
    const payments: RepassePaymentItem[] = [];
    if (!reservas || !atletas) {
        return payments;
    }
    reservas.forEach(reserva => {
      if (
        reserva.atleta_aluguel_id &&
        reserva.atleta_payment_status === 'pendente_repasse' &&
        isPast(parseDateStringAsLocal(`${reserva.date}T${reserva.end_time}`))
      ) {
        const profissional = atletas.find(p => p.id === reserva.atleta_aluguel_id);
        if (profissional) {
          const grossAmount = reserva.atleta_cost || 0;
          const commissionPercentage = profissional.comissao_arena || 0;
          const netAmount = grossAmount * (1 - commissionPercentage / 100);

          payments.push({
            reservaId: reserva.id,
            profissionalId: profissional.id,
            profissionalName: profissional.name,
            profissionalAvatar: profissional.avatar_url,
            clientName: reserva.clientName,
            date: reserva.date,
            netAmount,
          });
        }
      }
    });
    return payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reservas, atletas]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-full", className)}
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex-shrink-0">
        <Handshake className="h-5 w-5 mr-2 text-brand-blue-500 inline-block" />
        Repasses Pendentes
      </h3>
      <div className="space-y-4 flex-grow overflow-y-auto pr-2 min-h-0">
        {pendingPayments.length > 0 ? (
          pendingPayments.map(payment => (
            <button key={payment.reservaId} onClick={() => onCardClick(payment)} className="w-full text-left p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{payment.profissionalName}</p>
                  <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                    Jogo com {payment.clientName}
                  </p>
                </div>
                <div className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(payment.netAmount)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-600 flex items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
                <Calendar className="h-3 w-3 mr-1" />
                {format(parseDateStringAsLocal(payment.date), 'dd/MM/yyyy')}
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Handshake className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
            <p className="text-sm text-brand-gray-500">Nenhum repasse pendente.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AtletasPendentesWidget;
