import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface ProductPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedVariantId?: string) => void;
  product: Product | null;
}

const ProductPurchaseModal: React.FC<ProductPurchaseModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  
  // Hooks must be called unconditionally before any early returns.
  const hasVariants = product?.variants && product.variants.length > 0;

  const selectedVariant = useMemo(() => {
    if (!hasVariants || !selectedVariantId || !product) return null;
    return product.variants?.find(v => v.id === selectedVariantId);
  }, [product, selectedVariantId, hasVariants]);

  // Early return is now after all hooks.
  if (!product) {
    return null;
  }

  const handleConfirm = () => {
    if (hasVariants && !selectedVariantId) {
      alert("Por favor, selecione uma opção.");
      return;
    }
    onConfirm(selectedVariantId || undefined);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-brand-blue-500" />
                Confirmar Compra
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-brand-gray-100 dark:bg-brand-gray-700 flex-shrink-0 overflow-hidden">
                        {product.photo_urls && product.photo_urls.length > 0 ? (
                            <img src={product.photo_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <ShoppingBag className="w-12 h-12 text-brand-gray-400 m-auto" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{product.name}</h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(product.price)}</p>
                    </div>
                </div>
                <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{product.description}</p>
                
                {hasVariants && (
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Selecione uma opção:</label>
                    <select 
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                    >
                      <option value="">Escolha...</option>
                      {product.variants?.map(v => (
                        <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                          {v.name} {v.stock <= 0 ? '(Esgotado)' : `(${v.stock} em estoque)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={hasVariants && !selectedVariantId}>
                Confirmar Compra
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductPurchaseModal;
