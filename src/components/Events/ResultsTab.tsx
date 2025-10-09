import React from 'react';
import { Evento } from '../../types';
import { Trophy, Upload, X, Star } from 'lucide-react';

interface ResultsTabProps {
  evento: Evento;
  setEvento: React.Dispatch<React.SetStateAction<Evento | null>>;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ evento, setEvento }) => {
  // Mock functionality for photo upload
  const handlePhotoUpload = () => {
    // In a real app, this would open a file dialog
    alert("Funcionalidade de upload de fotos em desenvolvimento.");
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Trophy className="mr-2 h-6 w-6 text-yellow-500"/> Resultados Finais</h3>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <p className="text-brand-gray-500">Defina os vencedores do evento.</p>
            {/* This would be replaced with a proper selection UI */}
            <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-yellow-500">1º Lugar:</span>
                    <span className="font-medium">A definir...</span>
                </div>
                 <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-400">2º Lugar:</span>
                    <span className="font-medium">A definir...</span>
                </div>
                 <div className="flex items-center gap-4">
                    <span className="font-bold text-orange-400">3º Lugar:</span>
                    <span className="font-medium">A definir...</span>
                </div>
            </div>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-4">Galeria de Fotos</h3>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <div className="border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 rounded-lg p-8 text-center hover:border-brand-blue-400 dark:hover:border-brand-blue-500 transition-colors cursor-pointer" onClick={handlePhotoUpload}>
                <Upload className="h-12 w-12 text-brand-gray-400 dark:text-brand-gray-500 mx-auto mb-4" />
                <p className="text-brand-blue-600 dark:text-brand-blue-400 font-medium">Clique para adicionar fotos</p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">Compartilhe os melhores momentos do evento.</p>
            </div>
            {/* Placeholder for uploaded photos */}
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
