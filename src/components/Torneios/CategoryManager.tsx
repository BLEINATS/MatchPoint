import React from 'react';
import { TorneioCategory, TORNEIO_CATEGORY_GROUPS, TORNEIO_CATEGORY_LEVELS } from '../../types';
import Button from '../Forms/Button';
import CreatableSelect from '../Forms/CreatableSelect';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Input from '../Forms/Input';

interface CategoryManagerProps {
  categories: TorneioCategory[];
  setCategories: (categories: TorneioCategory[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, setCategories }) => {
  const handleCategoryChange = (id: string, field: keyof TorneioCategory, value: string) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };

  const addCategory = () => {
    setCategories([...categories, { id: uuidv4(), group: 'Mista', level: 'Iniciante', prize_1st: '', prize_2nd: '', prize_3rd: '' }]);
  };

  const removeCategory = (id: string) => {
    if (categories.length > 1) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Categorias e Premiações</label>
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="p-4 border rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50 space-y-4">
            <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                    <div>
                        <CreatableSelect
                            label="Grupo"
                            options={TORNEIO_CATEGORY_GROUPS}
                            value={category.group}
                            onChange={(value) => handleCategoryChange(category.id, 'group', value)}
                            placeholder="Selecione ou crie um grupo"
                        />
                    </div>
                    <div>
                        <CreatableSelect
                            label="Nível"
                            options={TORNEIO_CATEGORY_LEVELS}
                            value={category.level}
                            onChange={(value) => handleCategoryChange(category.id, 'level', value)}
                            placeholder="Selecione ou crie um nível"
                        />
                    </div>
                </div>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeCategory(category.id)} 
                    className="text-red-500 disabled:opacity-50 ml-2 mt-6"
                    disabled={categories.length <= 1}
                    title="Remover Categoria"
                >
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
            <div>
                <label className="text-xs font-medium text-brand-gray-500 mb-1 block">Premiação (Opcional)</label>
                <div className="grid grid-cols-3 gap-2">
                    <Input
                        value={category.prize_1st || ''}
                        onChange={(e) => handleCategoryChange(category.id, 'prize_1st', e.target.value)}
                        placeholder="1º Lugar"
                        className="!text-sm"
                    />
                    <Input
                        value={category.prize_2nd || ''}
                        onChange={(e) => handleCategoryChange(category.id, 'prize_2nd', e.target.value)}
                        placeholder="2º Lugar"
                        className="!text-sm"
                    />
                    <Input
                        value={category.prize_3rd || ''}
                        onChange={(e) => handleCategoryChange(category.id, 'prize_3rd', e.target.value)}
                        placeholder="3º Lugar"
                        className="!text-sm"
                    />
                </div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addCategory} className="mt-3">
        <Plus className="h-4 w-4 mr-2"/> Adicionar Categoria
      </Button>
    </div>
  );
};

export default CategoryManager;
