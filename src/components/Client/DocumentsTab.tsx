import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText } from 'lucide-react';

const DocumentsTab: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();

  if (!arena) {
    return <p className="text-center text-brand-gray-500">Selecione uma arena para ver os documentos.</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-white">Documentos da Arena</h2>
      <DocumentCard title="Termos de Uso" content={arena.terms_of_use} />
      <DocumentCard title="Política de Privacidade" content={arena.privacy_policy} />
    </div>
  );
};

const DocumentCard: React.FC<{ title: string; content: string | null | undefined }> = ({ title, content }) => (
  <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="text-xl font-semibold mb-4 flex items-center text-brand-gray-900 dark:text-white">
      <FileText className="h-5 w-5 mr-3 text-brand-blue-500" />
      {title}
    </h3>
    {content ? (
      <div className="prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto whitespace-pre-wrap text-brand-gray-600 dark:text-brand-gray-300">
        {content}
      </div>
    ) : (
      <p className="text-sm text-brand-gray-500">Nenhum documento fornecido pela arena.</p>
    )}
  </div>
);

export default DocumentsTab;
