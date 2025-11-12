import React from 'react';
import { motion } from 'framer-motion';
import { Torneio, Participant, Profile } from '../../types';
import { Trophy, CheckCircle, ArrowRight, DollarSign, Calendar, AlertCircle, UserPlus } from 'lucide-react';
import Button from '../Forms/Button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface MyTournamentCardProps {
  torneio: Torneio;
  participant: Participant;
  index: number;
  onInvitePartner: (torneio: Torneio, participant: Participant) => void;
}

const MyTournamentCard: React.FC<MyTournamentCardProps> = ({ torneio, participant, index, onInvitePartner }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const category = torneio.categories.find(c => c.id === participant.categoryId);

  const myPlayerInfo = participant.players.find(p => p.profile_id === profile?.id);
  const isPaid = myPlayerInfo?.payment_status === 'pago';

  const registrationFee = category?.registration_fee || 0;
  const dateString = category ? format(parseDateStringAsLocal(category.start_date), 'dd/MM/yyyy') : 'A definir';

  const canInvite = torneio.modality === 'duplas' && participant.players.length < 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between hover:shadow-xl dark:hover:shadow-brand-blue-500/10 transition-shadow"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{torneio.name}</h3>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                {category ? `${category.group} - ${category.level}` : 'Categoria'}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-brand-gray-700 dark:text-brand-gray-300">
                <Calendar className="h-4 w-4 text-brand-blue-500"/>
                <span className="font-medium">Data:</span>
                <span>{dateString}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-gray-700 dark:text-brand-gray-300">
                <DollarSign className="h-4 w-4 text-brand-blue-500"/>
                <span className="font-medium">Sua Inscrição:</span>
                <span className="font-bold">{formatCurrency(registrationFee)}</span>
            </div>
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
            }`}>
                {isPaid ? <CheckCircle className="h-3 w-3 mr-1.5" /> : <AlertCircle className="h-3 w-3 mr-1.5" />}
                {isPaid ? 'Pagamento Confirmado' : 'Pagamento Pendente'}
            </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 space-y-2">
        {canInvite && (
          <Button 
            variant="primary" 
            className="w-full"
            onClick={() => onInvitePartner(torneio, participant)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Parceiro(a)
          </Button>
        )}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate(`/torneios/publico/${torneio.id}`)}
        >
          Ver Chaves e Detalhes
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export default MyTournamentCard;
