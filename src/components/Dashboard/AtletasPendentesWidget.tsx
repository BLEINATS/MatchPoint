import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Reserva, AtletaAluguel } from '../../types';
import { Handshake, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

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
  reservas: Reserva[];
  atletas: AtletaAluguel[];
  onCardClick: (payment: RepassePaymentItem) => void;
}

const AtletasPendentesWidget: React.FC<AtletasPendentesWidgetProps> = ({ reservas, atletas, onCardClick }) => {
  const pendingPayments = useMemo(() => {
    const payments: RepassePaymentItem[] = [];
    reservas.forEach(reserva => {
      if (reserva.atleta_aluguel_id && reserva.atleta_payment_status === 'pendente_repasse') {
        const atleta = atletas.find(p => p.id === reserva.atleta_aluguel_id);
        if (atleta) {
          const grossAmount = reserva.atleta_cost || 0;
          const commissionPercentage = atleta.comissao_arena || 0;
          const netAmount = grossAmount * (1 - commissionPercentage / 100);

          payments.push({
            reservaId: reserva.id,
            profissionalId: atleta.id,
            profissionalName: atleta.name,
            profissionalAvatar: atleta.avatar_url,
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
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700"
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex items-center">
        <Handshake className="h-5 w-5 mr-2 text-brand-blue-500" />
        Repasses Pendentes
      </h3>
      <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
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
          <p className="text-sm text-center text-brand-gray-500 py-8">Nenhum repasse pendente.</p>
        )}
      </div>
    </motion.div>
  );
};

export default AtletasPendentesWidget;
