import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { RentalItem } from '../../types';
import { Loader2, Plus, Edit, Trash2, Package } from 'lucide-react';
import Button from '../Forms/Button';
import RentalItemModal from './RentalItemModal';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { formatCurrency } from '../../utils/formatters';

interface RentalItemsTabProps {
  canEdit: boolean;
}

const RentalItemsTab: React.FC<RentalItemsTabProps> = ({ canEdit }) => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RentalItem | null>(null);

  const loadItems = useCallback(async () => {
    if (!arena) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabaseApi.select<RentalItem>('rental_items', arena.id);
      if (error) throw error;
      setItems((data || []).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error: any) {
      addToast({ message: `Erro ao carregar itens: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (itemData: Omit<RentalItem, 'id' | 'arena_id' | 'created_at'> | RentalItem) => {
    if (!arena) return;
    const isEditing = 'id' in itemData;
    
    try {
      await supabaseApi.upsert('rental_items', [{ ...itemData, arena_id: arena.id }], arena.id);
      addToast({ message: `Item ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, type: 'success' });
      await loadItems();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar item: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteRequest = (item: RentalItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !arena) return;
    try {
      await supabaseApi.delete('rental_items', [itemToDelete.id], arena.id);
      addToast({ message: 'Item excluído com sucesso.', type: 'success' });
      await loadItems();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir item: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const openModal = (item: RentalItem | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Itens para Aluguel</h3>
          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Gerencie os itens que seus clientes podem alugar junto com a reserva.</p>
        </div>
        {canEdit && <Button onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" />Adicionar Item</Button>}
      </div>
      
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Estoque</th>
                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{formatCurrency(item.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{item.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openModal(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(item)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700 rounded-lg">
          <Package className="mx-auto h-12 w-12 text-brand-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-brand-gray-900 dark:text-white">Nenhum item cadastrado</h3>
          <p className="mt-1 text-sm text-brand-gray-500 dark:text-brand-gray-400">Comece adicionando itens para aluguel.</p>
        </div>
      )}

      <RentalItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={<p>Tem certeza que deseja excluir o item <strong>{itemToDelete?.name}</strong>?</p>}
        confirmText="Sim, Excluir"
      />
    </div>
  );
};

export default RentalItemsTab;
