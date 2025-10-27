import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import QuadraCard from '../components/Dashboard/QuadraCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadra, PricingRule } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi, localUploadPhoto, localDeletePhoto } from '../lib/localApi';
import QuadraFormTabs from '../components/Forms/QuadraFormTabs';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import Alert from '../components/Shared/Alert';
import DeleteQuadraConfirmationModal from '../components/Quadras/DeleteQuadraConfirmationModal';

const Quadras: React.FC = () => {
  const { selectedArenaContext: arena, profile, refreshResourceCounts } = useAuth();
  const { addToast } = useToast();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuadra, setSelectedQuadra] = useState<Quadra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { canAddQuadra, limits, isExpired, isActive } = useSubscriptionStatus();
  const effectiveCanAdd = canAddQuadra && isActive;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quadraToDelete, setQuadraToDelete] = useState<Quadra | null>(null);

  const canEdit = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.quadras === 'edit', [profile]);

  const fetchQuadras = useCallback(async () => {
    if (!arena) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await localApi.select<Quadra>('quadras', arena.id);
      if (error) throw error;
      setQuadras(data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar quadras: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    fetchQuadras();
  }, [fetchQuadras]);

  const handleOpenModal = (quadra: Quadra | null = null) => {
    if (!quadra && !effectiveCanAdd) {
      const message = isExpired
        ? 'Seu plano expirou. Para adicionar mais quadras, por favor, renove sua assinatura.'
        : `Limite de ${limits.maxQuadras} quadras atingido para o seu plano atual. Para adicionar mais, considere fazer um upgrade.`;
      addToast({ message, type: 'error' });
      return;
    }
    setSelectedQuadra(quadra);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuadra(null);
  };

  const handleSaveQuadra = async (quadraData: Omit<Quadra, 'id' | 'created_at' | 'arena_id'>, photosToUpload: File[], photosToDelete: string[], pricingRules: PricingRule[]) => {
    if (!profile || !arena) return;
    
    if (!quadraData.name?.trim()) {
      addToast({ message: 'O nome da quadra é obrigatório.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      
      const isEditing = !!(quadraData as Quadra).id;
      const quadraId = (quadraData as Quadra).id || `quadra_${Date.now()}`;

      let finalPhotoUrls = (quadraData as Quadra).photos || [];

      for (const url of photosToDelete) {
        await localDeletePhoto(url);
      }
      finalPhotoUrls = finalPhotoUrls.filter(url => !photosToDelete.includes(url));

      for (const file of photosToUpload) {
        const { publicUrl } = await localUploadPhoto(file);
        finalPhotoUrls.push(publicUrl);
      }

      const finalQuadraPayload = {
        ...quadraData,
        id: quadraId,
        photos: finalPhotoUrls,
        cover_photo: finalPhotoUrls.includes(quadraData.cover_photo as string) ? quadraData.cover_photo : finalPhotoUrls[0] || null,
        arena_id: arena.id,
        pricing_rules: pricingRules
      };
      
      await localApi.upsert('quadras', [finalQuadraPayload], arena.id);
      
      await refreshResourceCounts();

      addToast({ message: `Quadra ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, type: 'success' });
      handleCloseModal();
      fetchQuadras();

    } catch (error: any) {
      console.error("Detailed error:", error);
      addToast({ message: `Erro ao salvar quadra: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = (quadra: Quadra) => {
    setQuadraToDelete(quadra);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!quadraToDelete || !arena) return;
    try {
      setIsLoading(true);
      for (const photoUrl of quadraToDelete.photos) {
        await localDeletePhoto(photoUrl);
      }
      await localApi.delete('quadras', [quadraToDelete.id], arena.id);
      await refreshResourceCounts();
      addToast({ message: 'Quadra excluída com sucesso.', type: 'success' });
      fetchQuadras();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir quadra: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setQuadraToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-brand-gray-800 dark:text-white">Minhas Quadras</h1>
          {canEdit && (
            <Button onClick={() => handleOpenModal()} disabled={!effectiveCanAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Quadra
            </Button>
          )}
        </div>

        {!effectiveCanAdd && (
          <Alert
            type="warning"
            title={isExpired ? "Plano Expirado" : "Limite de Quadras Atingido"}
            message={isExpired ? `Seu plano expirou. Para adicionar mais quadras, por favor, renove sua assinatura.` : `Você atingiu o limite de ${limits.maxQuadras} quadras para o seu plano atual. Para adicionar mais, considere fazer um upgrade.`}
          />
        )}
        
        {isLoading && quadras.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" />
          </div>
        ) : quadras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {quadras.map((quadra, index) => (
              <QuadraCard
                key={quadra.id}
                index={index}
                quadra={quadra}
                onEdit={() => canEdit && handleOpenModal(quadra)}
                onDelete={() => canEdit && handleDeleteRequest(quadra)}
                monthlyEstimatedRevenue={0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-white dark:bg-brand-gray-900 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-brand-gray-800 dark:text-white">Nenhuma quadra cadastrada</h3>
            <p className="mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">Comece adicionando sua primeira quadra para gerenciar reservas e horários.</p>
            {canEdit && (
              <Button className="mt-4" onClick={() => handleOpenModal()} disabled={!effectiveCanAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Quadra
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={handleCloseModal}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-4xl shadow-xl flex flex-col max-h-[95vh]"
              onClick={e => e.stopPropagation()}
            >
              <QuadraFormTabs
                initialData={selectedQuadra}
                onSave={handleSaveQuadra}
                onClose={handleCloseModal}
                addToast={addToast}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DeleteQuadraConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        quadra={quadraToDelete}
      />
    </Layout>
  );
};

export default Quadras;
