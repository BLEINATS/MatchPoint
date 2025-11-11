import React from 'react';
import { motion } from 'framer-motion';
import { Torneio } from '../../types';
import { Trophy, ArrowRight } from 'lucide-react';
import Button from '../Forms/Button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface TournamentBannerProps {
  torneio: Torneio;
}

const TournamentBanner: React.FC<TournamentBannerProps> = ({ torneio }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/torneios/publico/${torneio.id}`);
  };

  const dateString = format(parseDateStringAsLocal(torneio.start_date), 'dd/MM');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 text-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <Trophy className="h-10 w-10 text-yellow-300 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg">Novo Torneio! Inscrições Abertas!</h3>
          <p className="text-sm opacity-90">
            Participe do <strong>{torneio.name}</strong> em {dateString}. Não perca!
          </p>
        </div>
      </div>
      <Button
        onClick={handleNavigate}
        className="bg-white/20 hover:bg-white/30 text-white w-full sm:w-auto flex-shrink-0"
      >
        Ver Detalhes e Inscrever-se
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
  );
};

export default TournamentBanner;
