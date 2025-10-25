import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronsUpDown, Check, Search } from 'lucide-react';

interface Person {
    profile_id: string;
    name: string;
    typeLabel: string;
}

interface PersonSelectProps {
  people: Person[];
  value: string | null;
  onChange: (profileId: string) => void;
  placeholder?: string;
}

const PersonSelect: React.FC<PersonSelectProps> = ({ people, value, onChange, placeholder = "Selecione uma pessoa..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPeople = useMemo(() => {
    if (!searchTerm) return people;
    return people.filter(person =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [people, searchTerm]);

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

  const handleSelect = (person: Person) => {
    onChange(person.profile_id);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  const selectedPerson = useMemo(() => people.find(p => p.profile_id === value), [people, value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Destinatário</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left form-input rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white placeholder-brand-gray-400 dark:placeholder-brand-gray-500 focus:border-brand-blue-500 focus:ring-brand-blue-500 shadow-sm pl-3"
        >
          <span className={selectedPerson ? 'text-brand-gray-900 dark:text-white truncate' : 'text-brand-gray-400 dark:text-brand-gray-500'}>
            {selectedPerson?.name || placeholder}
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
            className="absolute z-20 mt-1 w-full bg-white dark:bg-brand-gray-800 shadow-lg rounded-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden"
          >
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full form-input bg-brand-gray-100 dark:bg-brand-gray-900 border-transparent focus:border-brand-blue-500 focus:ring-brand-blue-500 rounded-md pl-9 py-2 text-sm"
                />
              </div>
            </div>
            <ul className="max-h-48 overflow-y-auto p-2">
              {filteredPeople.map(person => (
                <li
                  key={person.profile_id}
                  onClick={() => handleSelect(person)}
                  className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-brand-gray-800 dark:text-brand-gray-200">{person.name}</span>
                    <span className="text-xs text-brand-gray-500">{person.typeLabel}</span>
                  </div>
                  {value === person.profile_id && <Check className="h-5 w-5 text-brand-blue-500" />}
                </li>
              ))}
              {filteredPeople.length === 0 && (
                <li className="p-3 text-center text-sm text-brand-gray-500">Nenhuma pessoa encontrada.</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersonSelect;
