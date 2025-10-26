import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import Button from '../Forms/Button';
import { Edit, Trash2, Package, BadgeCheck, BadgeX } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, index }) => {
  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col overflow-hidden"
    >
      <div className="aspect-square bg-brand-gray-100 dark:bg-brand-gray-700 flex items-center justify-center">
        {product.photo_urls && product.photo_urls.length > 0 ? (
          <img src={product.photo_urls[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="h-20 w-20 text-brand-gray-400" />
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white flex-1">{product.name}</h3>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1 line-clamp-2">{product.description}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(product.price)}</span>
          <span className="text-sm font-medium text-brand-gray-500">Estoque: {totalStock}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
            {product.is_active ? <BadgeCheck className="h-3 w-3 mr-1" /> : <BadgeX className="h-3 w-3 mr-1" />}
            {product.is_active ? 'Ativo' : 'Inativo'}
          </span>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit} className="p-2" title="Editar"><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="p-2 hover:text-red-500" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
