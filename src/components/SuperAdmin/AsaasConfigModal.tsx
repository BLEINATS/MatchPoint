import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertCircle } from 'lucide-react';
import { localApi } from '../../lib/localApi';
import { AsaasConfig } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../Forms/Button';
import Input from '../Forms/Input';

interface AsaasConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AsaasConfigModal({ isOpen, onClose, onSave }: AsaasConfigModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isProduction, setIsProduction] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig();
    }
  }, [isOpen]);

  const loadCurrentConfig = async () => {
    const { data } = await localApi.select<AsaasConfig>('asaas_config', 'all');
    if (data && data.length > 0) {
      const config = data[0];
      setApiKey(config.api_key);
      setIsProduction(config.is_production);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Por favor, insira a API Key' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${isProduction ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3'}/customers?limit=1`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
          },
        }
      );

      if (response.ok) {
        setTestResult({ success: true, message: 'Conexão bem-sucedida! API Key válida.' });
      } else {
        const error = await response.json();
        setTestResult({ success: false, message: `Erro: ${error.errors?.[0]?.description || 'API Key inválida'}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao conectar com Asaas. Verifique sua conexão.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      addToast({ message: 'Por favor, insira a API Key', type: 'error' });
      return;
    }

    try {
      const config: Omit<AsaasConfig, 'id' | 'created_at' | 'updated_at'> = {
        api_key: apiKey,
        is_production: isProduction,
      };

      await localApi.upsert('asaas_config', [config], 'all', true);
      addToast({ message: 'Configuração do Asaas salva com sucesso!', type: 'success' });
      onSave();
      onClose();
    } catch (error) {
      addToast({ message: 'Erro ao salvar configuração', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configuração Asaas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Como obter sua API Key do Asaas:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Acesse sua conta no Asaas (apenas via web, não pelo app)</li>
              <li>Vá em "Minha Conta" → "Integração"</li>
              <li>Clique em "Gerar API Key"</li>
              <li>Copie a chave (ela será exibida apenas uma vez)</li>
              <li>Cole a chave abaixo</li>
            </ol>
          </div>

          {/* Ambiente */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ambiente
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isProduction}
                  onChange={() => setIsProduction(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sandbox (Testes)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isProduction}
                  onChange={() => setIsProduction(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Produção
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use Sandbox para testes. Mude para Produção apenas quando estiver pronto para processar pagamentos reais.
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Input
              label="API Key do Asaas"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ..."
              type="password"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sua API Key será armazenada de forma segura e nunca será exibida novamente.
            </p>
          </div>

          {/* Teste de conexão */}
          <div>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              variant="secondary"
              className="w-full"
            >
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                {testResult.success ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  testResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Salvar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
}
