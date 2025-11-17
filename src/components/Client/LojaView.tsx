import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { Loader2, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Button from '../Forms/Button';
import ProductPurchaseModal from './ProductPurchaseModal';

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const LojaView: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [[page, direction], setPage] = useState([0, 0]);
  const productIndex = products.length > 0 ? wrap(0, products.length, page) : 0;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const loadProducts = useCallback(async () => {
    if (!arena) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabaseApi.select<Product>('products', arena.id);
      if (error) throw error;
      
      const activeProducts = (data || []).filter(p => {
        if (!p.is_active) return false;
        if (p.variants && p.variants.length > 0) {
          const totalVariantStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
          return totalVariantStock > 0;
        }
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
    addToast({ message: `Compra de ${selectedProduct?.name} confirmada! (simulação)`, type: 'success' });
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
  }

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-white">Loja da Arena</h2>
        
        {products.length > 0 ? (
          <>
            {/* Carousel for Mobile */}
            <div className="md:hidden relative h-auto flex items-center justify-center -mx-4">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={page}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      paginate(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                      paginate(-1);
                    }
                  }}
                  className="absolute w-full h-full p-4"
                >
                  <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col overflow-hidden h-full">
                    <div className="aspect-square bg-brand-gray-100 dark:bg-brand-gray-700 flex items-center justify-center">
                      {products[productIndex].photo_urls && products[productIndex].photo_urls.length > 0 ? (
                        <img src={products[productIndex].photo_urls[0]} alt={products[productIndex].name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-20 w-20 text-brand-gray-400" />
                      )}
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{products[productIndex].name}</h3>
                      <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1 line-clamp-2">{products[productIndex].description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(products[productIndex].price)}</span>
                        <Button size="sm" onClick={() => handleBuyClick(products[productIndex])}>Comprar</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2">
                <Button variant="ghost" size="sm" className="bg-white/50 dark:bg-black/50 rounded-full !p-2" onClick={() => paginate(-1)}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="sm" className="bg-white/50 dark:bg-black/50 rounded-full !p-2" onClick={() => paginate(1)}>
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              <div className="absolute bottom-2 flex justify-center gap-2">
                {products.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setPage([i, i > page ? 1 : -1])}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                      i === productIndex ? 'bg-brand-blue-500' : 'bg-brand-gray-300 dark:bg-brand-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Grid for Desktop */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </>
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
