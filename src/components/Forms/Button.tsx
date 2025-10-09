import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-brand-gray-900';
  
  // Classes de variantes reforçadas para garantir visibilidade em ambos os temas
  const variantClasses = {
    primary: 'bg-brand-blue-600 text-white hover:bg-brand-blue-700 focus:ring-brand-blue-500 dark:bg-brand-blue-500 dark:hover:bg-brand-blue-600',
    secondary: 'bg-brand-gray-700 text-white hover:bg-brand-gray-800 focus:ring-brand-gray-500 dark:bg-brand-gray-200 dark:text-brand-gray-900 dark:hover:bg-white',
    outline: 'border border-brand-gray-300 bg-transparent text-brand-gray-700 hover:bg-brand-gray-100 focus:ring-brand-blue-500 dark:border-brand-gray-600 dark:text-brand-gray-300 dark:hover:bg-brand-gray-800',
    ghost: 'bg-transparent text-brand-gray-700 hover:bg-brand-gray-100 focus:ring-brand-blue-500 dark:text-brand-gray-300 dark:hover:bg-brand-gray-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''
  } ${className}`;

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
