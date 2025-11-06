import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Quadra } from '../../types';
import { Zap, Shield } from 'lucide-react';

interface FavoriteCourtCardProps {
  quadra: Quadra;
  arenaSlug: string;
  index: number;
}

const FavoriteCourtCard: React.FC<FavoriteCourtCardProps> = ({ quadra, arenaSlug, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden group"
    >
      <Link to={`/${arenaSlug}`} className="block">
        <div className="h-32 bg-brand-gray-200 dark:bg-brand-gray-700 overflow-hidden">
          <img src={quadra.photos[0] || `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300?text=${quadra.name}`} alt={quadra.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
          <h4 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 truncate">{quadra.name}</h4>
          <p className="text-sm text-brand-gray-500">{quadra.sport_type}</p>
          <div className="flex flex-wrap gap-2 text-xs mt-2">
            {quadra.is_covered && <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Shield className="h-3 w-3 mr-1" />Coberta</span>}
            {quadra.has_lighting && <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Zap className="h-3 w-3 mr-1" />Iluminação</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default FavoriteCourtCard;
