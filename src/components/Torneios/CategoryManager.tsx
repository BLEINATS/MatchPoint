import React from 'react';
import { TorneioCategory, TORNEIO_CATEGORY_GROUPS, TORNEIO_CATEGORY_LEVELS, Quadra } from '../../types';
import Button from '../Forms/Button';
import CreatableSelect from '../Forms/CreatableSelect';
import { Plus, Trash2, Users, DollarSign, Calendar, Clock, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Input from '../Forms/Input';
import { format } from 'date-fns';

interface CategoryManagerProps {
  categories: TorneioCategory[];
  setCategories: (categories: TorneioCategory[]) => void;
  tournamentQuadras: Quadra[];
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, setCategories, tournamentQuadras }) => {

  const handleCategoryChange = (id: string, field: keyof TorneioCategory, value: any) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };
  
  const handleCategoryQuadrasChange = (id: string, quadraId: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    const currentQuadras = category.quadras_ids || [];
    const newQuadras = currentQuadras.includes(quadraId)
        ? currentQuadras.filter(qId => qId !== quadraId)
        : [...currentQuadras, quadraId];
    
    handleCategoryChange(id, 'quadras_ids', newQuadras);
  };

  const addCategory = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setCategories([...categories, { 
        id: uuidv4(), 
        group: 'Mista', 
        level: 'Iniciante', 
        prize_1st: '', 
        prize_2nd: '', 
        prize_3rd: '',
        max_participants: 8,
        registration_fee: 50,
        start_date: today,
        end_date: today,
        start_time: '09:00',
        end_time: '18:00',
        quadras_ids: [],
    }]);
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
                    <CreatableSelect
                        label="Grupo"
                        options={TORNEIO_CATEGORY_GROUPS}
                        value={category.group}
                        onChange={(value) => handleCategoryChange(category.id, 'group', value)}
                        placeholder="Selecione ou crie um grupo"
                    />
                    <CreatableSelect
                        label="Nível"
                        options={TORNEIO_CATEGORY_LEVELS}
                        value={category.level}
                        onChange={(value) => handleCategoryChange(category.id, 'level', value)}
                        placeholder="Selecione ou crie um nível"
                    />
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Máx. de Inscritos" type="number" value={category.max_participants || ''} onChange={(e) => handleCategoryChange(category.id, 'max_participants', e.target.value ? Number(e.target.value) : 0)} placeholder="Nº de vagas" icon={<Users className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label="Taxa de Inscrição (por jogador)" type="number" value={category.registration_fee || ''} onChange={(e) => handleCategoryChange(category.id, 'registration_fee', e.target.value ? Number(e.target.value) : 0)} placeholder="Valor em R$" icon={<DollarSign className="h-4 w-4 text-brand-gray-400"/>} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Data de Início" type="date" value={category.start_date || ''} onChange={(e) => handleCategoryChange(category.id, 'start_date', e.target.value)} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label="Data de Fim" type="date" value={category.end_date || ''} onChange={(e) => handleCategoryChange(category.id, 'end_date', e.target.value)} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Horário de Início" type="time" value={category.start_time || ''} onChange={(e) => handleCategoryChange(category.id, 'start_time', e.target.value)} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} required />
              <Input label="Horário de Fim" type="time" value={category.end_time || ''} onChange={(e) => handleCategoryChange(category.id, 'end_time', e.target.value)} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Quadras para esta Categoria</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tournamentQuadras.map(quadra => (
                  <label key={quadra.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                    <input
                      type="checkbox"
                      checked={category.quadras_ids?.includes(quadra.id) || false}
                      onChange={() => handleCategoryQuadrasChange(category.id, quadra.id)}
                      className="form-checkbox h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500"
                    />
                    <span className="text-sm">{quadra.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
                <label className="text-xs font-medium text-brand-gray-500 mb-1 block">Premiação (Opcional)</label>
                <div className="grid grid-cols-3 gap-2">
                    <Input value={category.prize_1st || ''} onChange={(e) => handleCategoryChange(category.id, 'prize_1st', e.target.value)} placeholder="1º Lugar" className="!text-sm" />
                    <Input value={category.prize_2nd || ''} onChange={(e) => handleCategoryChange(category.id, 'prize_2nd', e.target.value)} placeholder="2º Lugar" className="!text-sm" />
                    <Input value={category.prize_3rd || ''} onChange={(e) => handleCategoryChange(category.id, 'prize_3rd', e.target.value)} placeholder="3º Lugar" className="!text-sm" />
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
