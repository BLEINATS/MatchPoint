import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Button from '../Forms/Button';

interface RecommendationCardProps {
  quadraName: string;
  day: string;
  time: string;
  onClick: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ quadraName, day, time, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 dark:from-brand-blue-600 dark:to-brand-blue-700 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex items-center mb-3">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-300" />
          <h4 className="font-bold text-lg">Horário nobre pra você</h4>
        </div>
        <p className="text-blue-100 text-base leading-relaxed">
          Notamos que você joga com frequência às <b className="font-semibold text-white">{day}s</b>. A quadra <b className="font-semibold text-white">{quadraName}</b> está livre na próxima <b className="font-semibold text-white">{day}</b> às <b className="font-semibold text-white">{time}</b>!
        </p>
      </div>
      <div className="mt-6">
        <Button
          variant="secondary"
          className="w-full bg-white/20 hover:bg-white/30 text-white dark:bg-white/20 dark:hover:bg-white/30 dark:text-white"
          onClick={onClick}
        >
          Reservar Agora
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export default RecommendationCard;
