import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingBag, Loader2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Product } from '../types';
import Button from '../components/Forms/Button';
import ProductCard from '../components/Loja/ProductCard';
import ProductModal from '../components/Loja/ProductModal';
import ConfirmationModal from '../components/Shared/ConfirmationModal';

const Loja: React.FC = () => {
  const { selectedArenaContext: arena, profile } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const canEdit = useMemo(() => profile?.role === 'admin_arena', [profile]);

  const loadProducts = useCallback(async () => {
    if (!arena) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await localApi.select<Product>('products', arena.id);
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar produtos: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'arena_id' | 'created_at'> | Product) => {
    if (!arena) return;
    try {
      await localApi.upsert('products', [{ ...productData, arena_id: arena.id }], arena.id);
      addToast({ message: 'Produto salvo com sucesso!', type: 'success' });
      await loadProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar produto: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete || !arena) return;
    try {
      await localApi.delete('products', [productToDelete.id], arena.id);
      addToast({ message: 'Produto excluído com sucesso.', type: 'success' });
      await loadProducts();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir produto: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  if (!canEdit) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-brand-gray-500">Você não tem permissão para gerenciar a loja.</p>
          <Link to="/dashboard"><Button className="mt-4">Voltar para o Painel</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Loja da Arena</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie os produtos disponíveis para venda aos seus clientes.</p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => openModal(product)}
                onDelete={() => handleDeleteRequest(product)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-dashed border-brand-gray-200 dark:border-brand-gray-700">
            <ShoppingBag className="mx-auto h-12 w-12 text-brand-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-brand-gray-900 dark:text-white">Nenhum produto cadastrado</h3>
            <p className="mt-1 text-sm text-brand-gray-500 dark:text-brand-gray-400">Clique em 'Novo Produto' para começar a vender.</p>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={<p>Tem certeza que deseja excluir o produto <strong>{productToDelete?.name}</strong>?</p>}
        confirmText="Sim, Excluir"
      />
    </Layout>
  );
};

export default Loja;
