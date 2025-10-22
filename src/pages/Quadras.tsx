import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Loader2, LayoutGrid, ShoppingBag, Percent } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import QuadraCard from '../components/Dashboard/QuadraCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadra, PricingRule, Reserva } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import { parse, addDays, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import RentalItemsTab from '../components/Quadras/RentalItemsTab';
import DiscountsTab from '../components/Quadras/DiscountsTab';
import { localApi, localUploadPhoto, localDeletePhoto } from '../lib/localApi';
import QuadraFormTabs from '../components/Forms/QuadraFormTabs';

const Quadras: React.FC = () => {
  const { user, selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuadra, setSelectedQuadra] = useState<Quadra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quadras' | 'itens' | 'promocoes'>('quadras');

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
    setSelectedQuadra(quadra);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuadra(null);
  };

  const handleSaveQuadra = async (quadraData: Omit<Quadra, 'id' | 'created_at' | 'arena_id'>, photosToUpload: File[], photosToDelete: string[], pricingRules: PricingRule[]) => {
    if (!user || !arena) return;
    
    if (!quadraData.name?.trim()) {
      addToast({ message: 'O nome da quadra é obrigatório.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      
      const { id: quadraId, ...quadraPayload } = quadraData;

      let finalPhotoUrls = quadraData.photos || [];

      if (photosToDelete.length > 0) {
          finalPhotoUrls = finalPhotoUrls.filter(url => !photosToDelete.includes(url));
      }

      const finalQuadraPayload = {
        ...quadraPayload,
        id: quadraId,
        photos: finalPhotoUrls,
        cover_photo: finalPhotoUrls.includes(quadraData.cover_photo as string) ? quadraData.cover_photo : finalPhotoUrls[0] || null,
        arena_id: arena.id,
        pricing_rules: pricingRules.map(r => ({...r, id: r.id || r.client_id || uuidv4() }))
      };
      
      await localApi.upsert('quadras', [finalQuadraPayload], arena.id);

      addToast({ message: `Quadra ${quadraId ? 'atualizada' : 'criada'} com sucesso! Novas imagens são temporárias para visualização.`, type: 'success' });
      handleCloseModal();
      fetchQuadras();

    } catch (error: any) {
      console.error("Detailed error:", error);
      addToast({ message: `Erro ao salvar quadra: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuadra = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta quadra? Esta ação não pode ser desfeita.')) {
      if (!arena) return;
      try {
        setIsLoading(true);
        await localApi.delete('quadras', [id], arena.id);
        addToast({ message: 'Quadra excluída com sucesso.', type: 'success' });
        fetchQuadras();
      } catch (error: any) {
        addToast({ message: `Erro ao excluir quadra: ${error.message}`, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const calculateEstimatedRevenue = (quadra: Quadra): number => {
    if (quadra.status !== 'ativa' || !quadra.pricing_rules || quadra.pricing_rules.length === 0) {
        return 0;
    }

    const defaultRule = quadra.pricing_rules.find(r => r.is_default && r.is_active);
    let representativePrice = 0;
    if (defaultRule) {
        representativePrice = defaultRule.price_single;
    } else {
        const activePrices = quadra.pricing_rules.filter(r => r.is_active).map(r => r.price_single);
        if (activePrices.length > 0) {
            representativePrice = activePrices.reduce((sum, p) => sum + p, 0) / activePrices.length;
        }
    }

    if (representativePrice === 0) return 0;

    const calculateHours = (horario?: { start: string; end: string }): number => {
        if (!horario || !horario.start || !horario.end) return 0;
        try {
            const start = parse(horario.start, 'HH:mm', new Date());
            let end = parse(horario.end, 'HH:mm', new Date());
            if (end <= start) {
                end = addDays(end, 1);
            }
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        } catch {
            return 0;
        }
    };

    const weekdayHours = calculateHours(quadra.horarios?.weekday);
    const saturdayHours = calculateHours(quadra.horarios?.saturday);
    const sundayHours = calculateHours(quadra.horarios?.sunday);

    const today = new Date();
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });

    let totalMonthlyHours = 0;
    daysInMonth.forEach(day => {
        const dayOfWeek = getDay(day);
        if (dayOfWeek === 0) {
            totalMonthlyHours += sundayHours;
        } else if (dayOfWeek === 6) {
            totalMonthlyHours += saturdayHours;
        } else {
            totalMonthlyHours += weekdayHours;
        }
    });
    
    const OCCUPANCY_RATE = 0.70;
    return totalMonthlyHours * representativePrice * OCCUPANCY_RATE;
  };

  return (
    <Layout>
      <main className="flex-1 p-4 sm:p-6 bg-brand-gray-50 dark:bg-brand-gray-950">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-brand-gray-800 dark:text-white">Gerenciamento de Quadras</h1>
          {activeTab === 'quadras' && canEdit && (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Quadra
            </Button>
          )}
        </div>

        <div className="mb-8 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('quadras')}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === 'quadras'
                  ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
              }`}
            >
              <LayoutGrid className="mr-2 h-5 w-5" />
              Minhas Quadras
            </button>
            <button
              onClick={() => setActiveTab('itens')}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === 'itens'
                  ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
              }`}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Itens para Aluguel
            </button>
            <button
              onClick={() => setActiveTab('promocoes')}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === 'promocoes'
                  ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
              }`}
            >
              <Percent className="mr-2 h-5 w-5" />
              Promoções
            </button>
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {activeTab === 'quadras' ? (
              <>
                {isLoading && quadras.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" />
                  </div>
                ) : quadras.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {quadras.map((quadra, index) => {
                      const revenue = calculateEstimatedRevenue(quadra);
                      return (
                        <QuadraCard
                          key={quadra.id}
                          index={index}
                          quadra={quadra}
                          onEdit={() => canEdit && handleOpenModal(quadra)}
                          onDelete={() => canEdit && handleDeleteQuadra(quadra.id)}
                          monthlyEstimatedRevenue={revenue}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-white dark:bg-brand-gray-900 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-brand-gray-800 dark:text-white">Nenhuma quadra cadastrada</h3>
                    <p className="mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">Comece adicionando sua primeira quadra para gerenciar reservas e horários.</p>
                    {canEdit && (
                      <Button className="mt-4" onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeira Quadra
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : activeTab === 'itens' ? (
              <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
                <RentalItemsTab canEdit={canEdit} />
              </div>
            ) : (
              <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
                <DiscountsTab canEdit={canEdit} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

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
    </Layout>
  );
};

export default Quadras;
