import React from 'react';
import { motion } from 'framer-motion';
import { Evento, Participant } from '../../types';
import Button from '../Forms/Button';
import { Check, UserPlus, Send, BarChart3, Users, X } from 'lucide-react';
import { generateBracket } from '../../utils/eventUtils';

interface ParticipantsTabProps {
  evento: Evento;
  setEvento: React.Dispatch<React.SetStateAction<Evento | null>>;
}

const ParticipantsTab: React.FC<ParticipantsTabProps> = ({ evento, setEvento }) => {
  const toggleCheckIn = (participantId: string) => {
    setEvento(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map(p =>
          p.id === participantId ? { ...p, checked_in: !p.checked_in } : p
        ),
      };
    });
  };

  const handleGenerateBracket = () => {
    if (evento.participants.length < 2) {
      alert("É necessário ter pelo menos 2 participantes para gerar as chaves.");
      return;
    }
    const newMatches = generateBracket(evento.participants);
    setEvento(prev => prev ? { ...prev, matches: newMatches } : null);
    alert("Chaves geradas com sucesso! Verifique a aba 'Chaves'.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h3 className="text-xl font-semibold">Lista de Inscritos ({evento.participants.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline"><Send className="h-4 w-4 mr-2" /> Comunicar</Button>
          <Button><UserPlus className="h-4 w-4 mr-2" /> Adicionar Inscrito</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">E-mail</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Check-in</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
              {evento.participants.map((participant, index) => (
                <motion.tr 
                  key={participant.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-gray-900 dark:text-white">{participant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{participant.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participant.checked_in ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                      {participant.checked_in ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      {participant.checked_in ? 'Feito' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button size="sm" variant={participant.checked_in ? 'outline' : 'primary'} onClick={() => toggleCheckIn(participant.id)}>
                      {participant.checked_in ? 'Desfazer' : 'Check-in'}
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-brand-blue-500/10 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-center justify-between">
            <div>
                <h4 className="font-bold text-blue-800 dark:text-blue-200">Próximo Passo: Chaves do Torneio</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Após todos os participantes fazerem o check-in, gere as chaves para iniciar as partidas.</p>
            </div>
            <Button onClick={handleGenerateBracket} disabled={evento.matches.length > 0}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {evento.matches.length > 0 ? 'Chaves Geradas' : 'Gerar Chaves'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsTab;
