import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Shield, GraduationCap, LogIn, Mail, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/Auth/ConfirmationDialog';

type Mode = 'login' | 'signup';
type SignupStep = 'choice' | 'form';

const AuthPortal: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signup');
  const [signupStep, setSignupStep] = useState<SignupStep>('choice');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleAdminSignup = () => {
    navigate('/cadastro-arena');
  };

  const handleClientSignup = () => {
    setSignupStep('form');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        await signUp(formData.email, formData.password, formData.name, 'cliente');
        setShowConfirmation(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignupChoice = () => (
    <motion.div
      key="choice"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-center text-brand-gray-800 dark:text-white">Escolha seu tipo de conta</h3>
      <div className="grid grid-cols-1 gap-4">
        <AuthCard
          icon={Shield}
          title="Administrador de Quadra"
          description="Gerencie sua arena, quadras e reservas."
          onClick={handleAdminSignup}
        />
        <AuthCard
          icon={User}
          title="Cliente / Aluno"
          description="Reserve horários e gerencie suas partidas."
          onClick={handleClientSignup}
        />
        <AuthCard
          icon={GraduationCap}
          title="Professor / Jogador de Aluguel"
          description="Ofereça seus serviços e encontre jogadores."
          onClick={() => {}}
          disabled
        />
      </div>
    </motion.div>
  );

  const renderForm = (isClientSignup: boolean) => (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-semibold text-center text-brand-gray-800 dark:text-white">
          {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta de Cliente'}
        </h3>
        {mode === 'signup' && isClientSignup && (
          <Input
            name="name"
            label="Nome Completo"
            placeholder="Seu nome"
            value={formData.name}
            onChange={handleFormChange}
            icon={<User className="h-4 w-4 text-brand-gray-400" />}
            required
          />
        )}
        <Input
          name="email"
          type="email"
          label="E-mail"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleFormChange}
          icon={<Mail className="h-4 w-4 text-brand-gray-400" />}
          required
        />
        <Input
          name="password"
          type="password"
          label="Senha"
          placeholder="Sua senha"
          value={formData.password}
          onChange={handleFormChange}
          icon={<Key className="h-4 w-4 text-brand-gray-400" />}
          required
        />
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div className="pt-2">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </Button>
        </div>
        {isClientSignup && (
           <Button variant="outline" className="w-full" onClick={() => setSignupStep('choice')}>
             Voltar
           </Button>
        )}
      </form>
    </motion.div>
  );

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-brand-gray-50 dark:bg-brand-gray-950 flex flex-col justify-center items-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Calendar className="h-10 w-10 text-brand-blue-500" />
          <span className="ml-3 text-3xl font-bold text-brand-gray-900 dark:text-white">MatchPlay</span>
        </motion.div>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-brand-gray-100 dark:bg-brand-gray-800 p-1 rounded-lg flex space-x-1">
                <Button
                  variant={mode === 'signup' ? 'secondary' : 'ghost'}
                  onClick={() => { setMode('signup'); setSignupStep('choice'); }}
                  className={`w-32 ${mode === 'signup' ? 'shadow' : ''}`}
                >
                  Cadastrar
                </Button>
                <Button
                  variant={mode === 'login' ? 'secondary' : 'ghost'}
                  onClick={() => setMode('login')}
                  className={`w-32 ${mode === 'login' ? 'shadow' : ''}`}
                >
                  <LogIn className="h-4 w-4 mr-2"/> Entrar
                </Button>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {mode === 'signup' && signupStep === 'choice' && renderSignupChoice()}
              {mode === 'signup' && signupStep === 'form' && renderForm(true)}
              {mode === 'login' && renderForm(false)}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setMode('login');
        }}
        email={formData.email}
      />
    </Layout>
  );
};

interface AuthCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const AuthCard: React.FC<AuthCardProps> = ({ icon: Icon, title, description, onClick, disabled }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.03 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    className={`w-full text-left p-5 border rounded-lg transition-all flex items-center space-x-4 ${
      disabled 
        ? 'bg-brand-gray-100 dark:bg-brand-gray-800 opacity-60 cursor-not-allowed' 
        : 'bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-500 hover:shadow-lg dark:hover:border-brand-blue-500'
    }`}
  >
    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${disabled ? 'bg-brand-gray-300 dark:bg-brand-gray-600' : 'bg-blue-100 dark:bg-brand-blue-500/10'}`}>
      <Icon className={`h-6 w-6 ${disabled ? 'text-brand-gray-500' : 'text-brand-blue-500'}`} />
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-brand-gray-800 dark:text-white">{title}</h4>
      <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{description}</p>
    </div>
    {disabled && <span className="text-xs font-semibold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">Em breve</span>}
  </motion.button>
);

export default AuthPortal;
