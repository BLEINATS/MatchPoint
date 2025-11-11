import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SimpleStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  className?: string;
  description?: string;
}

const SimpleStatCard: React.FC<SimpleStatCardProps> = ({ label, value, icon: Icon, color, className, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col", className)}
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
          <div className={`p-3 rounded-lg bg-brand-gray-100 dark:bg-brand-gray-900`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white mt-2">{value}</p>
      </div>
      {description && (
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-700">
          {description}
        </p>
      )}
    </motion.div>
);

export default SimpleStatCard;
