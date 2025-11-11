import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AcquisitionCardProps {
  clientes: number;
  alunos: number;
  className?: string;
}

const AcquisitionCard: React.FC<AcquisitionCardProps> = ({ clientes, alunos, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col", className)}
  >
    <div className="flex items-start justify-between mb-4">
      <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">Aquisição (Mês)</p>
      <div className="p-3 rounded-lg bg-blue-100 dark:bg-brand-gray-900">
        <Users className="h-6 w-6 text-blue-500" />
      </div>
    </div>
    <div className="flex justify-around items-end flex-grow">
      <div className="text-center">
        <p className="text-xl lg:text-2xl font-bold text-brand-gray-900 dark:text-white">{clientes}</p>
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">Clientes</p>
      </div>
      <div className="h-10 w-px bg-brand-gray-200 dark:bg-brand-gray-700"></div>
      <div className="text-center">
        <p className="text-xl lg:text-2xl font-bold text-brand-gray-900 dark:text-white">{alunos}</p>
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">Alunos com Plano</p>
      </div>
    </div>
  </motion.div>
);

export default AcquisitionCard;
