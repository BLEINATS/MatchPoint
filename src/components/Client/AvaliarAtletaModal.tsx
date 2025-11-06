import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Save } from 'lucide-react';
import Button from '../Forms/Button';

interface AvaliarAtletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating: number, comment: string, tags: string[]) => void;
  atletaName: string;
}

const RATING_TAGS = [
  'Pontual',
  'Joga muito',
  'Bom companheiro',
  'Respeitoso',
  'Ótima comunicação',
  'Chegou atrasado',
  'Comportamento inadequado',
];

const AvaliarAtletaModal: React.FC<AvaliarAtletaModalProps> = ({ isOpen, onClose, onConfirm, atletaName }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirm = () => {
    if (rating > 0) {
      onConfirm(rating, comment, selectedTags);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setSelectedTags([]);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Avaliar {atletaName}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-center font-medium mb-2">Sua nota:</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        (hoverRating || rating) >= star ? 'text-yellow-400 fill-current' : 'text-brand-gray-300'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-center font-medium mb-3">O que você achou?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {RATING_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-brand-blue-500 border-brand-blue-500 text-white'
                          : 'bg-transparent border-brand-gray-300 dark:border-brand-gray-600 hover:border-brand-blue-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Comentário (opcional):</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                  placeholder="Como foi sua experiência com o atleta?"
                />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={rating === 0}>
                <Save className="h-4 w-4 mr-2"/> Enviar Avaliação
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AvaliarAtletaModal;
