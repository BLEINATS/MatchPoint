import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trophy } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { Torneio, Quadra, Reserva } from '../types';
import TorneioModal from '../components/Torneios/TorneioModal';
import TorneioCard from '../components/Torneios/TorneioCard';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { localApi } from '../lib/localApi';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';

const Torneios: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTorneio, setEditingTorneio] = useState<Torneio | null>(null);

  const loadData = useCallback(async () => {
    if (arena) {
      const [torneiosRes, quadrasRes, reservasRes] = await Promise.all([
        localApi.select<Torneio>('torneios', arena.id),
        localApi.select<Quadra>('quadras', arena.id),
        localApi.select<Reserva>('reservas', arena.id),
      ]);
      setTorneios(torneiosRes.data || []);
      setQuadras(quadrasRes.data || []);
      setReservas(reservasRes.data || []);
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const handleSaveTorneio = async (torneioData: Omit<Torneio, 'id' | 'arena_id' | 'created_at'> | Torneio) => {
    if (!arena) return;

    try {
      const isEditing = 'id' in torneioData;
      const torneioId = isEditing ? torneioData.id : `torneio_${uuidv4()}`;
      
      const newTorneio: Torneio = isEditing 
        ? torneioData as Torneio
        : { ...torneioData, id: torneioId, arena_id: arena.id, created_at: new Date().toISOString(), participants: [], matches: [] } as Torneio;

      await localApi.upsert('torneios', [newTorneio], arena.id);

      const { data: currentReservas } = await localApi.select<Reserva>('reservas', arena.id);
      const otherReservas = currentReservas.filter(r => r.torneio_id !== torneioId);
      
      const tournamentBlockReservations: Reserva[] = [];
      if (newTorneio.quadras_ids.length > 0) {
        const tournamentDays = eachDayOfInterval({
          start: parseDateStringAsLocal(newTorneio.start_date),
          end: parseDateStringAsLocal(newTorneio.end_date)
        });

        for (const day of tournamentDays) {
          for (const quadraId of newTorneio.quadras_ids) {
            tournamentBlockReservations.push({
              id: `reserva_torneio_${torneioId}_${quadraId}_${format(day, 'yyyy-MM-dd')}`,
              arena_id: arena.id,
              quadra_id: quadraId,
              torneio_id: torneioId,
              date: format(day, 'yyyy-MM-dd'),
              start_time: newTorneio.start_time,
              end_time: newTorneio.end_time,
              type: 'torneio',
              status: 'confirmada',
              clientName: `Torneio: ${newTorneio.name}`,
              isRecurring: false,
              profile_id: '',
              created_at: new Date().toISOString(),
            } as Reserva);
          }
        }
      }

      await localApi.upsert('reservas', [...otherReservas, ...tournamentBlockReservations], arena.id, true);
      
      addToast({ message: 'Torneio salvo com sucesso!', type: 'success' });
      await loadData();
      setIsModalOpen(false);
      setEditingTorneio(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar torneio: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteTorneio = async (id: string) => {
    if (!arena || !window.confirm('Tem certeza que deseja excluir este torneio? Os bloqueios de horário e todos os dados do torneio serão removidos.')) return;
    
    try {
      await localApi.delete('torneios', [id], arena.id);
      
      const { data: currentReservas } = await localApi.select<Reserva>('reservas', arena.id);
      const finalReservas = currentReservas.filter(r => r.torneio_id !== id);
      await localApi.upsert('reservas', finalReservas, arena.id, true);

      addToast({ message: 'Torneio excluído com sucesso.', type: 'success' });
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir torneio: ${error.message}`, type: 'error' });
    }
  };

  const filteredTorneios = useMemo(() => 
    torneios.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [torneios, searchTerm]
  );
  
  useEffect(() => {
    if (editingTorneio) setIsModalOpen(true);
  }, [editingTorneio]);

  useEffect(() => {
    if (!isModalOpen) setEditingTorneio(null);
  }, [isModalOpen]);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Gestão de Torneios</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Crie e gerencie torneios, campeonatos e atividades especiais.</p>
        </motion.div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto sm:flex-1">
              <Input
                placeholder="Buscar por torneio..."
                icon={<Search className="h-4 w-4 text-brand-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Torneio
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="torneios-list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {filteredTorneios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTorneios.map((torneio, index) => (
                  <TorneioCard 
                    key={torneio.id}
                    torneio={torneio}
                    onEdit={() => setEditingTorneio(torneio)}
                    onDelete={() => handleDeleteTorneio(torneio.id)}
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
                  <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">Nenhum torneio encontrado</h3>
                  <p className="text-brand-gray-600 dark:text-brand-gray-400">Clique em 'Criar Novo Torneio' para começar a organizar sua primeira competição.</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <TorneioModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTorneio} 
        initialData={editingTorneio}
        quadras={quadras}
        reservas={reservas}
      />
    </Layout>
  );
};

export default Torneios;
