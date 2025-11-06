import React, { useState } from 'react';
import { LifeBuoy, Languages, AlertCircle, Mail, Info, Share2, X, Copy } from 'lucide-react';
import Button from '../Forms/Button';
import ReportErrorModal from './ReportErrorModal';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '../Forms/Input';

const SupportTab: React.FC = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const appVersion = "1.0.0";
  const { addToast } = useToast();
  const shareableLink = window.location.origin;

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      addToast({ message: 'Link copiado para a área de transferência!', type: 'success' });
    } catch (err) {
      console.error('Falha ao copiar:', err);
      addToast({ message: 'Não foi possível copiar. Por favor, copie manualmente.', type: 'error' });
    }
  };

  return (
    <>
      <div className="space-y-8">
        <Section title="Idioma" icon={Languages}>
          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">
              Idioma da Interface
            </label>
            <select
              id="language-select"
              className="form-select w-full max-w-xs rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
              defaultValue="pt-BR"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US" disabled>English (em breve)</option>
            </select>
          </div>
        </Section>

        <Section title="Compartilhar com amigos" icon={Share2}>
          <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
            Gostou do MatchPlay? Convide seus amigos para gerenciar suas arenas ou encontrar novos lugares para jogar.
          </p>
          <div className="mt-4">
            <Button onClick={handleOpenShareModal}>
              Convidar Amigos
            </Button>
          </div>
        </Section>

        <Section title="Fale Conosco" icon={Mail}>
          <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
            Para dúvidas comerciais, parcerias ou outras questões não relacionadas a suporte técnico, entre em contato.
          </p>
          <p className="text-sm mt-2">
            <span className="font-semibold">E-mail Comercial:</span> <a href="mailto:contato@matchplay.com" className="text-brand-blue-500 hover:underline">contato@matchplay.com</a>
          </p>
        </Section>
        
        <Section title="Suporte Técnico" icon={LifeBuoy}>
          <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
            Precisa de ajuda com o app? Use nosso assistente virtual para respostas rápidas ou nos envie um e-mail.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Assistente Virtual:</span> Clique no ícone de chat no canto inferior direito da tela.
            </p>
            <p className="text-sm">
              <span className="font-semibold">E-mail de Suporte:</span> <a href="mailto:suporte@matchplay.com" className="text-brand-blue-500 hover:underline">suporte@matchplay.com</a>
            </p>
          </div>
        </Section>

        <Section title="Reportar Erro" icon={AlertCircle}>
          <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
            Encontrou um problema ou algo que não funciona como esperado? Ajude-nos a melhorar a plataforma reportando o erro.
          </p>
          <div className="mt-4">
            <Button onClick={() => setIsReportModalOpen(true)}>
              Reportar um Erro
            </Button>
          </div>
        </Section>

        <Section title="Sobre o App" icon={Info}>
            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Plataforma de gestão de arenas esportivas.
            </p>
            <p className="text-sm mt-2">
                <span className="font-semibold">Versão:</span> {appVersion}
            </p>
        </Section>
      </div>
      <ReportErrorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[80]" onClick={() => setIsShareModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <Share2 className="h-5 w-5 text-brand-blue-500" />
                  Compartilhar Link do App
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setIsShareModalOpen(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                  Compartilhe este link com seus amigos para que eles possam conhecer o MatchPlay.
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareableLink}
                    onFocus={(e) => e.target.select()}
                    className="flex-grow"
                  />
                  <Button onClick={handleCopyToClipboard} aria-label="Copiar link">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
                <Button onClick={() => setIsShareModalOpen(false)}>Fechar</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-6 first:border-t-0 first:pt-0">
    <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4 flex items-center">
      <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export default SupportTab;
