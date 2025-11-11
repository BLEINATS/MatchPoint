import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

interface DetailedPerformanceCardProps {
  receita: number;
  ocupacao: number;
  className?: string;
}

const DetailedPerformanceCard: React.FC<DetailedPerformanceCardProps> = ({ receita, ocupacao, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col justify-between", className)}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">Desempenho do Dia</p>
        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
          <TrendingUp className="h-6 w-6 text-green-500" />
        </div>
      </div>
      
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <div className="text-left">
          <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">
            {formatCurrency(receita)}
          </p>
          <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Receita</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">
            {ocupacao.toFixed(0)}%
          </p>
          <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Ocupação</p>
        </div>
      </div>
    </motion.div>
  );
};

export default DetailedPerformanceCard;
