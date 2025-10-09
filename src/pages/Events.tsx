import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trophy } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { Evento, Quadra, Reserva, Participant } from '../types';
import EventModal from '../components/Events/EventModal';
import EventCard from '../components/Events/EventCard';
import { parseDateStringAsLocal } from '../utils/dateUtils';

// Mock de participantes
const MOCK_PARTICIPANTS: Omit<Participant, 'id'>[] = [
  { name: 'Carlos Silva', email: 'carlos@email.com', checked_in: false },
  { name: 'Bruna Matos', email: 'bruna@email.com', checked_in: false },
  { name: 'Pedro Almeida', email: 'pedro@email.com', checked_in: false },
  { name: 'Juliana Costa', email: 'juliana@email.com', checked_in: false },
  { name: 'Fernando Lima', email: 'fernando@email.com', checked_in: false },
  { name: 'Mariana Dias', email: 'mariana@email.com', checked_in: false },
  { name: 'Rafael Souza', email: 'rafael@email.com', checked_in: false },
  { name: 'Luiza Pereira', email: 'luiza@email.com', checked_in: false },
];

const Events: React.FC = () => {
  const { arena } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  const loadData = useCallback(() => {
    if (arena) {
      const savedEventos = localStorage.getItem(`eventos_${arena.id}`);
      setEventos(savedEventos ? JSON.parse(savedEventos) : []);
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      setQuadras(savedQuadras ? JSON.parse(savedQuadras) : []);
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const handleSaveEvento = (eventoData: Omit<Evento, 'id' | 'arena_id' | 'created_at'> | Evento) => {
    if (!arena) return;

    const isEditing = 'id' in eventoData;
    const eventoId = isEditing ? eventoData.id : `evento_${Date.now()}`;
    
    // Adiciona participantes mock ao criar um novo evento
    const participants = isEditing ? (eventoData as Evento).participants : MOCK_PARTICIPANTS.slice(0, eventoData.max_participants).map((p, i) => ({...p, id: `participante_${eventoId}_${i}`}));

    const newEvento: Evento = isEditing 
      ? eventoData as Evento
      : { ...eventoData, id: eventoId, arena_id: arena.id, created_at: new Date().toISOString(), participants, matches: [] } as Evento;

    const updatedEventos = isEditing
      ? eventos.map(e => e.id === newEvento.id ? newEvento : e)
      : [...eventos, newEvento];
    
    setEventos(updatedEventos);
    localStorage.setItem(`eventos_${arena.id}`, JSON.stringify(updatedEventos));

    // --- Lógica de criação de reserva ---
    const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
    const currentReservas: Reserva[] = savedReservas ? JSON.parse(savedReservas) : [];
    
    const otherReservas = currentReservas.filter(r => r.evento_id !== eventoId);
    
    const eventBlockReservations: Reserva[] = [];
    const eventDays = eachDayOfInterval({
      start: parseDateStringAsLocal(newEvento.start_date),
      end: parseDateStringAsLocal(newEvento.end_date)
    });

    for (const day of eventDays) {
      for (const quadraId of newEvento.quadras_ids) {
        const newBlockReserva: Reserva = {
          id: `reserva_evento_${eventoId}_${quadraId}_${format(day, 'yyyy-MM-dd')}`,
          arena_id: arena.id,
          quadra_id: quadraId,
          evento_id: eventoId,
          date: format(day, 'yyyy-MM-dd'),
          start_time: newEvento.start_time,
          end_time: newEvento.end_time,
          type: 'evento',
          status: 'confirmada',
          clientName: `Evento: ${newEvento.name}`,
          isRecurring: false,
          profile_id: '',
          created_at: new Date().toISOString(),
        };
        eventBlockReservations.push(newBlockReserva);
      }
    }

    const finalReservas = [...otherReservas, ...eventBlockReservations];
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(finalReservas));
    // --- Fim da lógica de reserva ---

    setIsModalOpen(false);
    setEditingEvento(null);
  };

  const handleDeleteEvento = (id: string) => {
    if (!arena || !window.confirm('Tem certeza que deseja excluir este evento? Os bloqueios de horário e todos os dados do evento serão removidos.')) return;
    
    const updatedEventos = eventos.filter(e => e.id !== id);
    setEventos(updatedEventos);
    localStorage.setItem(`eventos_${arena.id}`, JSON.stringify(updatedEventos));

    const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
    const currentReservas: Reserva[] = savedReservas ? JSON.parse(savedReservas) : [];
    const finalReservas = currentReservas.filter(r => r.evento_id !== id);
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(finalReservas));
  };

  const filteredEventos = useMemo(() => 
    eventos.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [eventos, searchTerm]
  );
  
  useEffect(() => {
    if (editingEvento) setIsModalOpen(true);
  }, [editingEvento]);

  useEffect(() => {
    if (!isModalOpen) setEditingEvento(null);
  }, [isModalOpen]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Gestão de Eventos</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Crie e gerencie torneios, campeonatos e atividades especiais.</p>
        </motion.div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto sm:flex-1">
              <Input
                placeholder="Buscar por evento..."
                icon={<Search className="h-4 w-4 text-brand-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Evento
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="eventos-list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {filteredEventos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEventos.map((evento, index) => (
                  <EventCard 
                    key={evento.id}
                    evento={evento}
                    onEdit={() => setEditingEvento(evento)}
                    onDelete={() => handleDeleteEvento(evento.id)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
                  <div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6">
                    <Trophy className="h-8 w-8 text-brand-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">Nenhum evento encontrado</h3>
                  <p className="text-brand-gray-600 dark:text-brand-gray-400">Clique em 'Criar Novo Evento' para começar a organizar seu primeiro torneio ou atividade.</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvento} 
        initialData={editingEvento}
        quadras={quadras}
      />
    </Layout>
  );
};

export default Events;
