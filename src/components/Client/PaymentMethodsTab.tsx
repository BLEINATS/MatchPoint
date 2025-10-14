import React, { useState } from 'react';
import { Profile, CreditCardInfo } from '../../types';
import Button from '../Forms/Button';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AddCardModal from './AddCardModal';
import ConfirmationModal from '../Shared/ConfirmationModal';

interface PaymentMethodsTabProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Partial<Profile>) => void;
}

const getCardIcon = (brand: string) => {
  // In a real app, you'd use brand-specific icons
  return <CreditCard className="h-6 w-6 text-brand-gray-500" />;
};

const PaymentMethodsTab: React.FC<PaymentMethodsTabProps> = ({ profile, onProfileUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CreditCardInfo | null>(null);
  const { addToast } = useToast();

  const handleSaveCard = (newCard: CreditCardInfo) => {
    const updatedCards = [...(profile.credit_cards || []), newCard];
    onProfileUpdate({ credit_cards: updatedCards });
    addToast({ message: 'Cartão adicionado com sucesso!', type: 'success' });
  };

  const handleDeleteCard = () => {
    if (!cardToDelete) return;
    const updatedCards = (profile.credit_cards || []).filter(card => card.id !== cardToDelete.id);
    onProfileUpdate({ credit_cards: updatedCards });
    addToast({ message: 'Cartão removido com sucesso.', type: 'info' });
    setCardToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Métodos de Pagamento</h3>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartão
        </Button>
      </div>
      <div className="space-y-3">
        {(profile.credit_cards || []).map(card => (
          <div key={card.id} className="flex items-center justify-between p-4 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
            <div className="flex items-center gap-4">
              {getCardIcon(card.brand)}
              <div>
                <p className="font-semibold">{card.brand} •••• {card.last4}</p>
                <p className="text-sm text-brand-gray-500">{card.cardholder_name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCardToDelete(card)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(profile.credit_cards || []).length === 0 && (
          <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum cartão cadastrado.</p>
        )}
      </div>

      <AddCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCard}
      />
      <ConfirmationModal
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={handleDeleteCard}
        title="Remover Cartão"
        message={`Tem certeza que deseja remover o cartão ${cardToDelete?.brand} final ${cardToDelete?.last4}?`}
        confirmText="Sim, Remover"
      />
    </div>
  );
};

export default PaymentMethodsTab;
