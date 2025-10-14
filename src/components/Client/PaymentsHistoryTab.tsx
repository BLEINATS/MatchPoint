import React from 'react';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface PaymentsHistoryTabProps {
  history?: PaymentHistoryItem[];
}

const PaymentsHistoryTab: React.FC<PaymentsHistoryTabProps> = ({ history = [] }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Histórico de Pagamentos</h3>
      <div>
        {history.length > 0 ? (
          <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700 max-h-96 overflow-y-auto pr-2">
            {history.map(item => (
              <li key={item.id} className="py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-brand-gray-800 dark:text-brand-gray-200">{item.description}</p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                      {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-brand-gray-800 dark:text-white">
                  {formatCurrency(item.amount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum pagamento encontrado no histórico.</p>
        )}
      </div>
    </div>
  );
};

export default PaymentsHistoryTab;
