import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Search } from 'lucide-react';
import { AtletaAluguel, Reserva } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { formatCurrency } from '../../utils/formatters';
import { getDay, parse } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface HirePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (profissionalId: string) => void;
  reserva: Reserva;
  profissionais: AtletaAluguel[];
  onViewProfile: (atleta: AtletaAluguel) => void;
}

const HirePlayerModal: React.FC<HirePlayerModalProps> = ({ isOpen, onClose, onConfirm, reserva, profissionais, onViewProfile }) => {
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const availableProfissionais = useMemo(() => {
    if (!profissionais || !reserva) return [];

    const reservaDate = parseDateStringAsLocal(reserva.date);
    const reservaDayOfWeek = getDay(reservaDate);
    const reservaStartTime = parse(reserva.start_time, 'HH:mm', new Date());

    return profissionais.filter(p => {
        if (p.status !== 'disponivel') return false;

        const isCompatibleSport = p.esportes.some(e => e.sport === reserva.sport_type);
        if (!isCompatibleSport) return false;

        if (!p.weekly_availability || p.weekly_availability.length === 0) {
            // Se o atleta não cadastrou horário, ele não aparece para reservas com hora marcada.
            return false;
        }

        const dayAvailability = p.weekly_availability.find(d => d.dayOfWeek === reservaDayOfWeek);
        if (!dayAvailability || dayAvailability.slots.length === 0) {
            return false;
        }

        const isAvailableAtTime = dayAvailability.slots.some(slot => {
            try {
                const slotStart = parse(slot.start, 'HH:mm', new Date());
                const slotEnd = parse(slot.end, 'HH:mm', new Date());
                // Check if reservation time is within the slot [start, end)
                return reservaStartTime >= slotStart && reservaStartTime < slotEnd;
            } catch (e) {
                console.error("Error parsing athlete availability slot:", slot, e);
                return false;
            }
        });
        
        if (!isAvailableAtTime) {
            return false;
        }

        return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [profissionais, reserva, searchTerm]);

  const handleConfirm = () => {
    if (selectedProfissionalId) {
      onConfirm(selectedProfissionalId);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Contratar Atleta para {reserva.sport_type}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <Input
                placeholder="Buscar por nome do atleta..."
                icon={<Search className="h-4 w-4 text-brand-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {availableProfissionais.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProfissionais.map(prof => (
                    <div 
                      key={prof.id} 
                      onClick={() => setSelectedProfissionalId(prof.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedProfissionalId(prof.id); }}
                      className={`p-4 border-2 rounded-lg text-left transition-all flex flex-col gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-blue-500 ${selectedProfissionalId === prof.id ? 'border-brand-blue-500 bg-blue-50 dark:bg-brand-blue-900/50' : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'}`}
                    >
                      <div className="flex items-center gap-4">
                        <img src={prof.avatar_url || `https://avatar.vercel.sh/${prof.id}.svg`} alt={prof.name} className="w-16 h-16 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="font-bold">{prof.name}</p>
                          <p className="text-sm text-brand-gray-500">{prof.nivel_tecnico || 'Nível não informado'}</p>
                          <div className="flex items-center text-yellow-400 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < Math.round(prof.avg_rating || 0) ? 'fill-current' : ''}`} />
                            ))}
                            <span className="text-xs text-brand-gray-500 ml-1">({prof.ratings?.length || 0})</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(prof.taxa_hora)}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); onViewProfile(prof); }} className="text-sm font-medium text-brand-blue-500 hover:underline">Ver Perfil</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-brand-gray-500 py-8">Nenhum atleta disponível para este esporte, horário ou busca no momento.</p>
              )}
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedProfissionalId}>Contratar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HirePlayerModal;
