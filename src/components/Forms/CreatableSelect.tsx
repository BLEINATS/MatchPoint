import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronsUpDown, Check, PlusCircle, Search } from 'lucide-react';

interface CreatableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({ label, options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option && typeof option === 'string' && option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const canCreate = useMemo(() => {
    return searchTerm.length > 0 && !options.some(opt => opt && typeof opt === 'string' && opt.toLowerCase() === searchTerm.toLowerCase());
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreate = () => {
    onChange(searchTerm);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{label}</label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {icon}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between text-left form-input rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:border-brand-blue-500 focus:ring-brand-blue-500 shadow-sm ${icon ? 'pl-10' : 'px-3'}`}
        >
          <span className={value ? 'text-brand-gray-900 dark:text-white' : 'text-brand-gray-400 dark:text-brand-gray-500'}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-5 w-5 text-brand-gray-400" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-1 w-full bg-white dark:bg-brand-gray-800 shadow-lg rounded-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden"
          >
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ou criar novo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full form-input bg-brand-gray-100 dark:bg-brand-gray-900 border-transparent focus:border-brand-blue-500 focus:ring-brand-blue-500 rounded-md pl-9 py-2 text-sm"
                />
              </div>
            </div>
            <ul className="max-h-48 overflow-y-auto p-2">
              {filteredOptions.map(option => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 text-sm"
                >
                  <span className="font-medium text-brand-gray-800 dark:text-brand-gray-200">{option}</span>
                  {value === option && <Check className="h-5 w-5 text-brand-blue-500" />}
                </li>
              ))}
              {filteredOptions.length === 0 && !canCreate && (
                <li className="p-3 text-center text-sm text-brand-gray-500">Nenhuma opção encontrada.</li>
              )}
            </ul>
            {canCreate && (
              <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 p-2">
                <button
                  onClick={handleCreate}
                  className="w-full flex items-center p-3 rounded-md text-sm font-medium text-brand-blue-600 dark:text-brand-blue-400 hover:bg-blue-50 dark:hover:bg-brand-blue-500/10"
                >
                  <PlusCircle className="h-5 w-5 mr-3" />
                  Criar "{searchTerm}"
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatableSelect;
