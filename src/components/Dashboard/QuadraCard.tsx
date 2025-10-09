import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quadra } from '../../types';
import Button from '../Forms/Button';
import { 
  Edit2, Trash2, Users, Shield, MapPin, 
  TrendingUp, Clock, Layers, Zap, ArrowLeft, ArrowRight, Bookmark, DollarSign
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

  const priceRange = useMemo(() => {
    if (!quadra.pricing_rules || quadra.pricing_rules.length === 0) {
      return "Preço a definir";
    }
    const activePrices = quadra.pricing_rules.filter(r => r.is_active).map(r => r.price_single);
    if (activePrices.length === 0) return "Preço a definir";

    const minPrice = Math.min(...activePrices);
    const maxPrice = Math.max(...activePrices);

    if (minPrice === maxPrice) {
      return formatCurrency(minPrice);
    }
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
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

  const handleReserve = () => {
    navigate('/reservas', { 
      state: { 
        selectedDate: new Date().toISOString(), 
        quadraId: quadra.id 
      } 
    });
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
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col overflow-hidden"
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
            <Button variant="ghost" size="sm" onClick={onEdit} className="p-2"><Edit2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className={`p-4 rounded-lg mb-4 flex items-center gap-4 ${quadra.status === 'ativa' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-brand-gray-100 dark:bg-brand-gray-700/50'}`}>
          <div className={`p-2 rounded-full ${quadra.status === 'ativa' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300' : 'bg-brand-gray-200 dark:bg-brand-gray-600 text-brand-gray-500'}`}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Receita Mensal Estimada (70%)</p>
            <p className={`font-bold text-lg ${quadra.status === 'ativa' ? 'text-green-700 dark:text-green-300' : 'text-brand-gray-500'}`}>
              {quadra.status === 'ativa' ? formatCurrency(monthlyEstimatedRevenue) : '-'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-4">
          <InfoItem icon={Layers} label="Piso" value={quadra.court_type || 'N/A'} />
          <InfoItem icon={Users} label="Capacidade" value={`${quadra.capacity || 'N/A'} pessoas`} />
          <InfoItem icon={Clock} label="Seg-Sex" value={weekdayHours} />
          <InfoItem icon={Clock} label="Sábado" value={saturdayHours} />
          <InfoItem icon={Clock} label="Domingo" value={sundayHours} />
        </div>
        <div className="mt-auto pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-brand-gray-500 mr-1" />
                <p className="text-md font-bold text-brand-gray-800 dark:text-white">{priceRange}<span className="text-sm font-normal text-brand-gray-500">/hora</span></p>
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
