import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quadra } from '../../types';
import Button from '../Forms/Button';
import { 
  Edit2, Trash2, Users, MapPin, 
  ArrowLeft, ArrowRight, Bookmark, DollarSign, Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start">
    <Icon className="h-4 w-4 text-brand-blue-500 mt-1 flex-shrink-0" />
    <div className="ml-2">
      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
      <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{value}</p>
    </div>
  </div>
);

interface QuadraCardProps {
  quadra: Quadra;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  monthlyEstimatedRevenue: number;
}

const QuadraCard: React.FC<QuadraCardProps> = ({ quadra, onEdit, onDelete, index, monthlyEstimatedRevenue }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const navigate = useNavigate();

  const photosToShow = useMemo(() => {
    if (!quadra.photos || quadra.photos.length === 0) {
      return [];
    }
    const coverPhoto = quadra.cover_photo;
    if (coverPhoto && quadra.photos.includes(coverPhoto)) {
      return [coverPhoto, ...quadra.photos.filter(p => p !== coverPhoto)];
    }
    return quadra.photos;
  }, [quadra.photos, quadra.cover_photo]);

  const hasPhotos = photosToShow.length > 0;
  const hasMultiplePhotos = photosToShow.length > 1;

  const priceDisplay = useMemo(() => {
    if (!quadra.pricing_rules || quadra.pricing_rules.length === 0) {
      return { single: 'A definir', normal: null, specific: null };
    }
    const activeRules = quadra.pricing_rules.filter(r => r.is_active);
    if (activeRules.length === 0) {
      return { single: 'A definir', normal: null, specific: null };
    }

    const allPrices = [...new Set(activeRules.map(r => r.price_single))];
    if (allPrices.length === 1) {
      return { single: formatCurrency(allPrices[0]), normal: null, specific: null };
    }

    const defaultRule = activeRules.find(r => r.is_default);
    const specificRules = activeRules.filter(r => !r.is_default);

    const normal = defaultRule ? formatCurrency(defaultRule.price_single) : null;

    let specific = null;
    if (specificRules.length > 0) {
      const specificPrices = specificRules.map(r => r.price_single);
      const minSpecific = Math.min(...specificPrices);
      const maxSpecific = Math.max(...specificPrices);
      if (minSpecific === maxSpecific) {
        specific = formatCurrency(minSpecific);
      } else {
        specific = `${formatCurrency(minSpecific)} - ${formatCurrency(maxSpecific)}`;
      }
    }

    // If there's no default rule, but there are specific rules, we should not show a single price.
    if (!normal && !specific) {
      return { single: 'A definir', normal: null, specific: null };
    }

    return { normal, specific, single: null };
  }, [quadra.pricing_rules]);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photosToShow.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photosToShow.length) % photosToShow.length);
    }
  };

  const handleReserve = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/reservas', { 
      state: { 
        selectedDate: new Date().toISOString(), 
        quadraId: quadra.id 
      } 
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };
  
  const weekdayHours = quadra.horarios?.weekday
    ? `${quadra.horarios.weekday.start} - ${quadra.horarios.weekday.end}`
    : 'N/A';
  const saturdayHours = quadra.horarios?.saturday
    ? `${quadra.horarios.saturday.start} - ${quadra.horarios.saturday.end}`
    : 'N/A';
  const sundayHours = quadra.horarios?.sunday
    ? `${quadra.horarios.sunday.start} - ${quadra.horarios.sunday.end}`
    : 'N/A';

  return (
    <motion.div
      key={quadra.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onEdit}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className="aspect-video bg-brand-gray-200 dark:bg-brand-gray-700 relative overflow-hidden group">
        {hasPhotos ? (
            <img src={photosToShow[currentPhotoIndex]} alt={`${quadra.name} - Foto ${currentPhotoIndex + 1}`} className="w-full h-full object-cover transition-opacity duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-gray-400 dark:text-brand-gray-500 bg-gradient-to-br from-brand-gray-100 to-brand-gray-200 dark:from-brand-gray-800 dark:to-brand-gray-700">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        {hasMultiplePhotos && (
          <>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
              <button onClick={prevPhoto} className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
              <button onClick={nextPhoto} className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"><ArrowRight className="h-5 w-5" /></button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full">{currentPhotoIndex + 1} / {photosToShow.length}</div>
          </>
        )}
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2 py-1 rounded-full text-xs font-medium shadow ${quadra.status === 'ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : quadra.status === 'inativa' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
            {quadra.status.charAt(0).toUpperCase() + quadra.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-brand-gray-900 dark:text-white">{quadra.name}</h3>
            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{quadra.sports && quadra.sports.length > 0 ? quadra.sports.join(', ') : 'Esporte não definido'}</p>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={handleEdit} className="p-2"><Edit2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-4">
          <InfoItem icon={Users} label="Piso" value={quadra.court_type || 'N/A'} />
          <InfoItem icon={Users} label="Capacidade" value={`${quadra.capacity || 'N/A'} pessoas`} />
          <InfoItem icon={Clock} label="Seg-Sex" value={weekdayHours} />
          <InfoItem icon={Clock} label="Sábado" value={saturdayHours} />
          <InfoItem icon={Clock} label="Domingo" value={sundayHours} />
        </div>
        <div className="mt-auto pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
              {priceDisplay.single ? (
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-brand-gray-500 mr-1" />
                  <p className="text-md font-bold text-brand-gray-800 dark:text-white">{priceDisplay.single}<span className="text-sm font-normal text-brand-gray-500">/hora</span></p>
                </div>
              ) : (
                <>
                  {priceDisplay.normal && (
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-brand-gray-500 mr-1" />
                      <div>
                        <p className="text-md font-bold text-brand-gray-800 dark:text-white">{priceDisplay.normal}<span className="text-sm font-normal text-brand-gray-500">/h</span></p>
                        <p className="text-xs text-brand-gray-500 -mt-1">Padrão</p>
                      </div>
                    </div>
                  )}
                  {priceDisplay.specific && (
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-brand-blue-500 mr-1" />
                      <div>
                        <p className="text-md font-bold text-brand-blue-600 dark:text-brand-blue-400">{priceDisplay.specific}<span className="text-sm font-normal text-brand-gray-500">/h</span></p>
                        <p className="text-xs text-brand-blue-500 -mt-1">Específico</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <Button onClick={handleReserve} size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Reservar
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuadraCard;
