import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import { Loader2, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Button from '../Forms/Button';
import ProductPurchaseModal from './ProductPurchaseModal';

const LojaView: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!arena) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await localApi.select<Product>('products', arena.id);
      if (error) throw error;
      
      const activeProducts = (data || []).filter(p => {
        if (!p.is_active) return false;
        
        // Se o produto tem variações, verifica o estoque delas
        if (p.variants && p.variants.length > 0) {
          const totalVariantStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
          return totalVariantStock > 0;
        }
        
        // Se não tem variações, verifica o estoque principal
        return p.stock > 0;
      });
      
      setProducts(activeProducts);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar produtos: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    // Placeholder for purchase logic
    addToast({ message: `Compra de ${selectedProduct?.name} confirmada! (simulação)`, type: 'success' });
    setIsModalOpen(false);
    setSelectedProduct(null);
    // In a real app, you would update stock here.
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
  }

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-white">Loja da Arena</h2>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-md border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col overflow-hidden"
              >
                <div className="aspect-square bg-brand-gray-100 dark:bg-brand-gray-700 flex items-center justify-center">
                  {product.photo_urls && product.photo_urls.length > 0 ? (
                    <img src={product.photo_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-20 w-20 text-brand-gray-400" />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white flex-1">{product.name}</h3>
                  <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(product.price)}</span>
                    <Button size="sm" onClick={() => handleBuyClick(product)}>Comprar</Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-dashed border-brand-gray-200 dark:border-brand-gray-700">
            <ShoppingBag className="mx-auto h-12 w-12 text-brand-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-brand-gray-900 dark:text-white">Loja Vazia</h3>
            <p className="mt-1 text-sm text-brand-gray-500 dark:text-brand-gray-400">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </div>
      <ProductPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPurchase}
        product={selectedProduct}
      />
    </>
  );
};

export default LojaView;
