import React, { useState, useEffect, useCallback } from 'react';
import { DurationDiscount } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Plus, Trash2, Edit, Save, X, Percent, Clock, Tag } from 'lucide-react';
import Button from '../Forms/Button';
import Input from '../Forms/Input';

const DiscountsTab: React.FC = () => {
  const { arena } = useAuth();
  const { addToast } = useToast();
  const [discounts, setDiscounts] = useState<DurationDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Partial<DurationDiscount> | null>(null);

  const loadDiscounts = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('duration_discounts')
        .select('*')
        .eq('arena_id', arena.id)
        .order('duration_hours', { ascending: true });
      if (error) throw error;
      setDiscounts(data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar descontos: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleSave = async (discount: Partial<DurationDiscount>) => {
    if (!arena) return;

    const dataToSave = {
      ...discount,
      arena_id: arena.id,
    };

    // If the ID is missing or falsy, it's a new record.
    // Remove the ID property so Supabase can auto-generate it.
    if (!dataToSave.id) {
      delete dataToSave.id;
    }

    try {
      const { error } = await supabase.from('duration_discounts').upsert(dataToSave);
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      addToast({ message: 'Promoção salva com sucesso!', type: 'success' });
      setIsEditing(null);
      await loadDiscounts();
    } catch (error: any) {
      addToast({ message: `Erro ao salvar promoção: ${error.message}`, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta promoção?')) {
      try {
        const { error } = await supabase.from('duration_discounts').delete().eq('id', id);
        if (error) throw error;
        addToast({ message: 'Promoção excluída com sucesso.', type: 'success' });
        await loadDiscounts();
      } catch (error: any) {
        addToast({ message: `Erro ao excluir promoção: ${error.message}`, type: 'error' });
      }
    }
  };

  const handleAddNew = () => {
    setIsEditing({
      duration_hours: 2,
      discount_percentage: 10,
      is_active: true,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4 flex items-center">
          <Percent className="h-5 w-5 mr-2 text-brand-blue-500" />
          Promoções por Duração
        </h3>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
          Incentive reservas mais longas oferecendo descontos progressivos. O desconto será aplicado automaticamente no momento da reserva.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleAddNew}><Plus className="h-4 w-4 mr-2" />Nova Promoção</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>
      ) : isEditing ? (
        <EditDiscountForm discount={isEditing} onSave={handleSave} onCancel={() => setIsEditing(null)} />
      ) : (
        <div className="space-y-3">
          {discounts.length > 0 ? (
            discounts.map(d => (
              <DiscountItem key={d.id} discount={d} onEdit={() => setIsEditing(d)} onDelete={() => handleDelete(d.id)} />
            ))
          ) : (
            <p className="text-center text-brand-gray-500 py-8">Nenhuma promoção por duração cadastrada.</p>
          )}
        </div>
      )}
    </div>
  );
};

const DiscountItem: React.FC<{ discount: DurationDiscount, onEdit: () => void, onDelete: () => void }> = ({ discount, onEdit, onDelete }) => (
  <div className={`p-4 rounded-lg border flex items-center justify-between gap-4 ${discount.is_active ? 'bg-white dark:bg-brand-gray-800' : 'bg-brand-gray-100 dark:bg-brand-gray-800/50 opacity-70'}`}>
    <div className="flex-1 flex items-center gap-4 md:gap-8">
      <div className="flex items-center text-brand-gray-800 dark:text-white">
        <Clock className="h-4 w-4 mr-2 text-brand-gray-500" />
        <span className="font-semibold">{discount.duration_hours} hora(s)</span>
      </div>
      <div className="flex items-center text-green-600 dark:text-green-400">
        <Tag className="h-4 w-4 mr-2" />
        <span className="font-semibold">{discount.discount_percentage}% de desconto</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 text-xs rounded-full ${discount.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
        {discount.is_active ? 'Ativa' : 'Inativa'}
      </span>
      <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
    </div>
  </div>
);

const EditDiscountForm: React.FC<{ discount: Partial<DurationDiscount>, onSave: (d: Partial<DurationDiscount>) => void, onCancel: () => void }> = ({ discount, onSave, onCancel }) => {
  const [formData, setFormData] = useState(discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-brand-gray-50 dark:bg-brand-gray-900/50 space-y-4">
      <h4 className="font-semibold">{formData.id ? 'Editar Promoção' : 'Nova Promoção'}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Duração (horas)"
          type="number"
          min="1"
          value={formData.duration_hours}
          onChange={e => setFormData({ ...formData, duration_hours: parseInt(e.target.value, 10) || 1 })}
          required
        />
        <Input
          label="Desconto (%)"
          type="number"
          min="1"
          max="100"
          value={formData.discount_percentage}
          onChange={e => setFormData({ ...formData, discount_percentage: parseInt(e.target.value, 10) || 0 })}
          required
        />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="form-checkbox h-4 w-4 rounded text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-sm text-brand-gray-700 dark:text-brand-gray-300">Promoção ativa</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit"><Save className="h-4 w-4 mr-2" />Salvar</Button>
      </div>
    </form>
  );
};

export default DiscountsTab;
