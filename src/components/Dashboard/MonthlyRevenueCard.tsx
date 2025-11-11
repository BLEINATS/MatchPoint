import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

interface MonthlyRevenueCardProps {
  label: string;
  value: number;
  breakdown: { label: string; value: number }[];
  className?: string;
}

const MonthlyRevenueCard: React.FC<MonthlyRevenueCardProps> = ({ label, value, breakdown, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col", className)}
  >
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
      <div className="p-3 rounded-lg bg-purple-100 dark:bg-brand-gray-900">
        <DollarSign className="h-6 w-6 text-purple-500" />
      </div>
    </div>
    <p className="text-xl lg:text-2xl font-bold text-brand-gray-900 dark:text-white mt-2">{formatCurrency(value)}</p>
    <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 space-y-2 flex-grow">
      {breakdown.map((item) => (
        <div key={item.label} className="flex justify-between items-center text-sm">
          <span className="text-brand-gray-600 dark:text-brand-gray-400">{item.label}</span>
          <span className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default MonthlyRevenueCard;
