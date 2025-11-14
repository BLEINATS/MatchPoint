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
    bg: 'bg-blue-800',
    border: 'border-blue-500',
    iconColor: 'text-blue-300',
    titleColor: 'text-white',
    messageColor: 'text-blue-200',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-800',
    border: 'border-green-500',
    iconColor: 'text-green-300',
    titleColor: 'text-white',
    messageColor: 'text-green-200',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-800',
    border: 'border-amber-500',
    iconColor: 'text-amber-300',
    titleColor: 'text-white',
    messageColor: 'text-amber-200',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-800',
    border: 'border-red-500',
    iconColor: 'text-red-300',
    titleColor: 'text-white',
    messageColor: 'text-red-200',
  },
};

const Alert: React.FC<AlertProps> = ({ type = 'info', title, message }) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 border-l-4 ${config.bg} ${config.border}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-bold ${config.titleColor}`}>{title}</h3>
          <div className={`mt-1 text-sm ${config.messageColor}`}>
            {message}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Alert;
