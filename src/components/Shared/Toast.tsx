import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../context/ToastContext';

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <AlertTriangle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [message.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="mb-4 flex w-full max-w-sm items-start space-x-4 rounded-lg bg-white dark:bg-brand-gray-800 p-4 shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div className="flex-shrink-0">{icons[message.type]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-brand-gray-900 dark:text-white">{message.message}</p>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={() => onDismiss(message.id)}
          className="inline-flex rounded-md bg-white dark:bg-brand-gray-800 text-brand-gray-400 hover:text-brand-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onDismiss }) => {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <AnimatePresence>
          {messages.map(message => (
            <Toast key={message.id} message={message} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToastContainer;
