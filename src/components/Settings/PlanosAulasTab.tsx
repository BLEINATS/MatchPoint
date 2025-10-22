import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import { PlanoAula } from '../../types';
import { Loader2, Plus, Edit, Trash2, Tag, Calendar, DollarSign } from 'lucide-react';
import Button from '../Forms/Button';
import ConfirmationModal from '../Shared/ConfirmationModal';
import PlanoAulaModal from '../Settings/PlanoAulaModal';
import { formatCurrency } from '../../utils/formatters';

const seedDefaultPlanosAulas = async (arenaId: string) => {
  const defaultPlanos: Omit<PlanoAula, 'id' | 'arena_id' | 'created_at'>[] = [
    { name: 'Aula Avulsa', duration_type: 'avulso', price: 80, description: 'Uma única aula para experimentar ou para alunos esporádicos.', is_active: true, num_aulas: 1 },
    { name: 'Plano Mensal - 1x/semana', duration_type: 'mensal', price: 280, description: 'Pacote com 4 aulas no mês, uma por semana.', is_active: true, num_aulas: 4 },
    { name: 'Plano Mensal - 2x/semana', duration_type: 'mensal', price: 480, description: 'Pacote com 8 aulas no mês, duas por semana.', is_active: true, num_aulas: 8 },
    { name: 'Plano Trimestral - 2x/semana', duration_type: 'trimestral', price: 1350, description: 'Pacote de 3 meses com 8 aulas por mês. Desconto aplicado.', is_active: true, num_aulas: 24 },
    { name: 'Plano Anual - Livre', duration_type: 'anual', price: 5000, description: 'Acesso livre a todas as turmas compatíveis durante o ano.', is_active: false, num_aulas: null },
  ];
  await localApi.upsert('planos_aulas', defaultPlanos, arenaId, true);
};

const PlanosAulasTab: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [planos, setPlanos] = useState<PlanoAula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoAula | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<PlanoAula | null>(null);

  const loadPlanos = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const seedKey = `planos_aulas_seeded_v2_${arena.id}`;
      if (!localStorage.getItem(seedKey)) {
        await seedDefaultPlanosAulas(arena.id);
        localStorage.setItem(seedKey, 'true');
      }

      const { data, error } = await localApi.select<PlanoAula>('planos_aulas', arena.id);
      if (error) throw error;
      setPlanos(data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar planos: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadPlanos();
  }, [loadPlanos]);

  const handleSave = async (planoData: Omit<PlanoAula, 'id' | 'arena_id' | 'created_at'> | PlanoAula) => {
    if (!arena) return;
    try {
      await localApi.upsert('planos_aulas', [{ ...planoData, arena_id: arena.id }], arena.id);
      addToast({ message: 'Plano salvo com sucesso!', type: 'success' });
      await loadPlanos();
      setIsModalOpen(false);
      setEditingPlano(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar plano: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteRequest = (plano: PlanoAula) => {
    setPlanoToDelete(plano);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planoToDelete || !arena) return;
    try {
      await localApi.delete('planos_aulas', [planoToDelete.id], arena.id);
      addToast({ message: 'Plano excluído com sucesso.', type: 'success' });
      await loadPlanos();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir plano: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setPlanoToDelete(null);
    }
  };

  const openModal = (plano: PlanoAula | null = null) => {
    setEditingPlano(plano);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Planos de Aulas</h3>
          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Crie e gerencie os pacotes de aulas oferecidos em sua arena.</p>
        </div>
        <Button onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
      </div>
      
      {planos.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
              <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Nome do Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Duração</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Preço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {planos.map(plano => (
                  <tr key={plano.id}>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-brand-gray-900 dark:text-white">{plano.name}</div><p className="text-xs text-brand-gray-500 truncate max-w-xs">{plano.description}</p></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400 capitalize">{plano.duration_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(plano.price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plano.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                        {plano.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => openModal(plano)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(plano)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {planos.map(plano => (
              <div key={plano.id} className="bg-white dark:bg-brand-gray-800 p-4 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-brand-gray-900 dark:text-white">{plano.name}</h4>
                    <span className={`px-2 mt-1 inline-flex text-xs leading-5 font-semibold rounded-full ${plano.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                      {plano.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => openModal(plano)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(plano)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="text-sm text-brand-gray-500 mt-2">{plano.description}</p>
                <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
                  <span className="text-sm text-brand-gray-500 dark:text-brand-gray-400 capitalize">{plano.duration_type}</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(plano.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700 rounded-lg">
          <h3 className="mt-2 text-sm font-medium text-brand-gray-900 dark:text-white">Nenhum plano de aula cadastrado</h3>
          <p className="mt-1 text-sm text-brand-gray-500 dark:text-brand-gray-400">Clique em 'Novo Plano' para começar.</p>
        </div>
      )}

      <PlanoAulaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingPlano}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={<p>Tem certeza que deseja excluir o plano <strong>{planoToDelete?.name}</strong>?</p>}
        confirmText="Sim, Excluir"
      />
    </div>
  );
};

export default PlanosAulasTab;
