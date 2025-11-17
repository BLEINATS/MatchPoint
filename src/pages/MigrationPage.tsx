import { useState } from 'react';
import { testSupabaseConnection, migrateLocalStorageToSupabase } from '../utils/migrateToSupabase';

export default function MigrationPage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'migrating' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTestConnection = async () => {
    setStatus('testing');
    setError('');
    
    try {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        setStatus('success');
      } else {
        setStatus('error');
        setError('Falha ao conectar com Supabase');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Erro desconhecido');
    }
  };

  const handleMigrate = async () => {
    setStatus('migrating');
    setError('');
    setResults(null);
    
    try {
      const migrationResults = await migrateLocalStorageToSupabase();
      setResults(migrationResults);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Erro desconhecido');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🚀 Migração para Supabase
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Testar Conexão</h2>
          <p className="text-gray-600 mb-4">
            Primeiro, vamos testar se o Supabase está configurado corretamente.
          </p>
          
          <button
            onClick={handleTestConnection}
            disabled={status === 'testing'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'testing' ? 'Testando...' : 'Testar Conexão'}
          </button>

          {status === 'success' && !results && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✅ Conexão estabelecida com sucesso!</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Migrar Dados</h2>
          <p className="text-gray-600 mb-4">
            Esta operação irá copiar todos os dados do localStorage para o Supabase.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Atenção:</strong> Esta operação pode levar alguns minutos dependendo da quantidade de dados.
              Não feche esta página durante a migração.
            </p>
          </div>

          <button
            onClick={handleMigrate}
            disabled={status === 'migrating'}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'migrating' ? 'Migrando... (verifique o console)' : 'Iniciar Migração'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">❌ Erro:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Resultado da Migração</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm font-medium">Sucesso</p>
                <p className="text-2xl font-bold text-green-800">{results.success.length}</p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm font-medium">Ignoradas</p>
                <p className="text-2xl font-bold text-gray-800">{results.skipped.length}</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm font-medium">Erros</p>
                <p className="text-2xl font-bold text-red-800">{results.errors.length}</p>
              </div>
            </div>

            {results.success.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Migradas com sucesso:</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {results.success.map((msg: string, i: number) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ Erros encontrados:</h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {results.errors.map((msg: string, i: number) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.skipped.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">⏭️ Ignoradas (sem dados):</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {results.skipped.map((msg: string, i: number) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Abra o Console do navegador (F12) para ver os logs detalhados</li>
            <li>Você pode executar a migração múltiplas vezes (dados existentes serão atualizados)</li>
            <li>Após a migração, verifique no Supabase Dashboard se os dados foram importados</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
