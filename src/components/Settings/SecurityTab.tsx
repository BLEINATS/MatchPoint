import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import Input from '../Forms/Input';
import Button from '../Forms/Button';
import { Key, Save } from 'lucide-react';

const SecurityTab: React.FC = () => {
  const { addToast } = useToast();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast({ message: 'A nova senha e a confirmação não correspondem.', type: 'error' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      addToast({ message: 'A nova senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    setIsLoading(true);
    // Simulação de chamada de API
    setTimeout(() => {
      setIsLoading(false);
      addToast({ message: 'Senha alterada com sucesso!', type: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  return (
    <div className="max-w-xl">
      <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Alterar Senha</h3>
      <p className="mt-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">
        Para sua segurança, recomendamos o uso de uma senha forte que você não utiliza em outros lugares.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Input
          label="Senha Atual"
          name="currentPassword"
          type="password"
          value={passwords.currentPassword}
          onChange={handleChange}
          icon={<Key className="h-4 w-4 text-brand-gray-400" />}
          required
        />
        <Input
          label="Nova Senha"
          name="newPassword"
          type="password"
          value={passwords.newPassword}
          onChange={handleChange}
          icon={<Key className="h-4 w-4 text-brand-gray-400" />}
          required
        />
        <Input
          label="Confirmar Nova Senha"
          name="confirmPassword"
          type="password"
          value={passwords.confirmPassword}
          onChange={handleChange}
          icon={<Key className="h-4 w-4 text-brand-gray-400" />}
          required
        />
        <div className="pt-2">
          <Button type="submit" isLoading={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Alterar Senha
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SecurityTab;
