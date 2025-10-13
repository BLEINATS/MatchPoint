import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type?: AlertType;
  title: string;
  message: React.ReactNode;
}

const alertConfig = {
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/50',
    border: 'border-blue-500',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800 dark:text-blue-200',
    messageColor: 'text-blue-700 dark:text-blue-300',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 dark:bg-green-900/50',
    border: 'border-green-500',
    iconColor: 'text-green-500',
    titleColor: 'text-green-800 dark:text-green-200',
    messageColor: 'text-green-700 dark:text-green-300',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 dark:bg-yellow-900/50',
    border: 'border-yellow-500',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
    messageColor: 'text-yellow-700 dark:text-yellow-300',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/50',
    border: 'border-red-500',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800 dark:text-red-200',
    messageColor: 'text-red-700 dark:text-red-300',
  },
};

const Alert: React.FC<AlertProps> = ({ type = 'info', title, message }) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-l-4 p-4 ${config.bg} ${config.border}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-bold ${config.titleColor}`}>{title}</h3>
          <div className={`mt-1 text-sm ${config.messageColor}`}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Alert;
