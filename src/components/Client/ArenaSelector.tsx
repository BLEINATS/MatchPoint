import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Arena } from '../../types';
import { ChevronsUpDown, Check, PlusCircle, Search, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ArenaSelectorProps {
  arenas: Arena[];
  selectedArena: Arena | null;
  onSelect: (arena: Arena) => void;
}

const ArenaSelector: React.FC<ArenaSelectorProps> = ({ arenas, selectedArena, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredArenas = useMemo(() => {
    return arenas.filter(arena =>
      arena.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [arenas, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (arena: Arena) => {
    onSelect(arena);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddNew = () => {
    navigate('/arenas');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full md:max-w-xs" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-brand-gray-800 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg shadow-sm px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
      >
        <span className="flex items-center">
          {selectedArena ? (
            <>
              <img src={selectedArena.main_image || `https://avatar.vercel.sh/${selectedArena.id}.svg`} alt={selectedArena.name} className="w-6 h-6 rounded-full mr-3 object-cover" />
              <span className="font-medium text-brand-gray-900 dark:text-white truncate">{selectedArena.name}</span>
            </>
          ) : (
            <>
              <Building className="w-5 h-5 mr-3 text-brand-gray-500" />
              <span className="text-brand-gray-500">Selecione uma arena</span>
            </>
          )}
        </span>
        <ChevronsUpDown className="h-5 w-5 text-brand-gray-400" />
      </button>

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
                  placeholder="Buscar arena..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full form-input bg-brand-gray-100 dark:bg-brand-gray-900 border-transparent focus:border-brand-blue-500 focus:ring-brand-blue-500 rounded-md pl-9 py-2 text-sm"
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-y-auto p-2">
              {filteredArenas.map(arena => (
                <li
                  key={arena.id}
                  onClick={() => handleSelect(arena)}
                  className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
                >
                  <span className="flex items-center">
                    <img src={arena.main_image || `https://avatar.vercel.sh/${arena.id}.svg`} alt={arena.name} className="w-6 h-6 rounded-full mr-3 object-cover" />
                    <span className="font-medium text-sm text-brand-gray-800 dark:text-brand-gray-200">{arena.name}</span>
                  </span>
                  {selectedArena?.id === arena.id && <Check className="h-5 w-5 text-brand-blue-500" />}
                </li>
              ))}
            </ul>
            <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 p-2">
              <button
                onClick={handleAddNew}
                className="w-full flex items-center p-3 rounded-md text-sm font-medium text-brand-blue-600 dark:text-brand-blue-400 hover:bg-blue-50 dark:hover:bg-brand-blue-500/10"
              >
                <PlusCircle className="h-5 w-5 mr-3" />
                Seguir nova arena
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArenaSelector;
