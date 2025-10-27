import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Building, LayoutGrid, Users, Check, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../Forms/Button';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Building,
    title: 'Bem-vindo ao MatchPlay!',
    description: 'Vamos configurar sua arena em poucos passos. Este guia rápido mostrará o essencial para você começar a operar.',
    link: null,
  },
  {
    icon: LayoutGrid,
    title: '1. Cadastre suas Quadras',
    description: 'O primeiro passo é adicionar suas quadras. Defina nomes, tipos de piso, esportes e horários de funcionamento para cada uma.',
    link: '/quadras',
  },
  {
    icon: Users,
    title: '2. Gerencie seus Clientes',
    description: 'Aqui você pode adicionar clientes, criar planos de aula e gerenciar mensalistas. Mantenha sua base de clientes organizada.',
    link: '/alunos',
  },
  {
    icon: CalendarIcon,
    title: '3. Hub de Reservas',
    description: 'No Hub de Reservas, você visualiza e gerencia todos os agendamentos. É o coração da sua operação diária.',
    link: '/reservas',
  },
  {
    icon: Check,
    title: 'Tudo Pronto!',
    description: 'Você já sabe o básico! Explore o painel para descobrir mais funcionalidades como torneios, loja e gamificação. Bom trabalho!',
    link: null,
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleGoToLink = () => {
    const link = steps[currentStep].link;
    if (link) {
      navigate(link);
    }
  };

  const { icon: Icon, title, description, link } = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="p-8 text-center"
              >
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-brand-blue-500/10 mb-6">
                  <Icon className="h-10 w-10 text-brand-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white">{title}</h3>
                <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-4 min-h-[60px]">{description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className={currentStep === 0 ? 'invisible' : ''}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div key={index} className={`w-2 h-2 rounded-full transition-colors ${currentStep === index ? 'bg-brand-blue-500' : 'bg-brand-gray-300 dark:bg-brand-gray-600'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                    {link ? (
                        <>
                            <Button variant="outline" onClick={handleNext}>
                                Próximo
                            </Button>
                            <Button onClick={handleGoToLink}>
                                Ir para a seção <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleNext}>
                            {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                            {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
