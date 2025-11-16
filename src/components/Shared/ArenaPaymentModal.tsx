import { useState } from 'react';
import { X, CreditCard, FileText, QrCode, Loader2, CheckCircle, AlertCircle, Copy, Download } from 'lucide-react';
import { Aluno, Arena, Profile } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { createArenaPayment } from '../../utils/arenaPaymentHelper';
import asaasProxyService from '../../lib/asaasProxyService';
import { formatCurrency } from '../../utils/formatters';

interface ArenaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  arena: Arena;
  customer: Aluno | Profile;
  amount: number;
  description: string;
  dueDate?: string;
  externalReference?: string;
}

export default function ArenaPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  arena, 
  customer, 
  amount, 
  description,
  dueDate,
  externalReference 
}: ArenaPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'BOLETO' | 'PIX' | 'CREDIT_CARD'>('PIX');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string; payment?: any } | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const { addToast } = useToast();

  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  const [holderInfo, setHolderInfo] = useState({
    name: customer.name || '',
    email: customer.email || '',
    cpfCnpj: ('cpf' in customer ? customer.cpf : 'cpf_cnpj' in customer ? customer.cpf_cnpj : '') || '',
    postalCode: '',
    addressNumber: '',
    phone: customer.phone || '',
  });

  const fetchPaymentDetails = async (paymentId: string) => {
    setIsFetchingDetails(true);
    setDetailsError(null);
    try {
      const details = await asaasProxyService.getPayment(paymentId);
      setPaymentDetails(details);

      if (paymentMethod === 'PIX') {
        const pix = await asaasProxyService.getPixQrCode(paymentId);
        setPixData(pix);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao buscar detalhes do pagamento';
      console.error('Erro ao buscar detalhes do pagamento:', error);
      setDetailsError(errorMsg);
      addToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setPaymentResult(null);
    setPaymentDetails(null);
    setPixData(null);
    setDetailsError(null);

    try {
      const options: any = {
        arena,
        customer,
        description,
        amount,
        billingType: paymentMethod,
        dueDate,
        externalReference,
      };

      if (paymentMethod === 'CREDIT_CARD') {
        if (!cardData.holderName || !cardData.number || !cardData.expiryMonth || !cardData.expiryYear || !cardData.ccv) {
          addToast({ message: 'Preencha todos os dados do cartão', type: 'error' });
          setIsProcessing(false);
          return;
        }

        if (!holderInfo.name || !holderInfo.email || !holderInfo.cpfCnpj || !holderInfo.postalCode || !holderInfo.addressNumber || !holderInfo.phone) {
          addToast({ message: 'Preencha todos os dados do titular do cartão', type: 'error' });
          setIsProcessing(false);
          return;
        }

        options.creditCard = cardData;
        options.creditCardHolderInfo = holderInfo;
      }

      const result = await createArenaPayment(options);

      if (result.success) {
        setPaymentResult({
          success: true,
          message: paymentMethod === 'CREDIT_CARD' 
            ? 'Pagamento processado com sucesso!' 
            : paymentMethod === 'BOLETO'
            ? 'Boleto gerado com sucesso!'
            : 'PIX gerado com sucesso!',
          payment: result.payment,
        });

        if (result.payment?.id) {
          await fetchPaymentDetails(result.payment.id);
        }

        addToast({ message: 'Pagamento criado com sucesso!', type: 'success' });
        onSuccess();
      } else {
        setPaymentResult({
          success: false,
          message: result.error || 'Erro ao processar pagamento',
        });
        addToast({ message: result.error || 'Erro ao processar pagamento', type: 'error' });
      }
    } catch (error: any) {
      setPaymentResult({
        success: false,
        message: error.message || 'Erro inesperado',
      });
      addToast({ message: 'Erro ao processar pagamento', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Processar Pagamento
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {customer.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumo do pagamento */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Resumo do Pagamento
            </h3>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Descrição:</strong> {description}</p>
              <p><strong>Valor:</strong> {formatCurrency(amount)}</p>
              {dueDate && <p><strong>Vencimento:</strong> {new Date(dueDate).toLocaleDateString('pt-BR')}</p>}
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('PIX')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'PIX'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <QrCode className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">PIX</p>
              </button>
              <button
                onClick={() => setPaymentMethod('BOLETO')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'BOLETO'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Boleto</p>
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Cartão</p>
              </button>
            </div>
          </div>

          {/* Formulário de cartão de crédito */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Dados do Cartão</h4>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Nome no Cartão"
                  value={cardData.holderName}
                  onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
                  placeholder="NOME COMPLETO"
                />
                <Input
                  label="Número do Cartão"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, '') })}
                  placeholder="0000 0000 0000 0000"
                  maxLength={16}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Mês"
                    value={cardData.expiryMonth}
                    onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value.replace(/\D/g, '') })}
                    placeholder="MM"
                    maxLength={2}
                  />
                  <Input
                    label="Ano"
                    value={cardData.expiryYear}
                    onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value.replace(/\D/g, '') })}
                    placeholder="AAAA"
                    maxLength={4}
                  />
                  <Input
                    label="CVV"
                    value={cardData.ccv}
                    onChange={(e) => setCardData({ ...cardData, ccv: e.target.value.replace(/\D/g, '') })}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-white mt-6">Dados do Titular</h4>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Nome Completo"
                  value={holderInfo.name}
                  onChange={(e) => setHolderInfo({ ...holderInfo, name: e.target.value })}
                />
                <Input
                  label="Email"
                  value={holderInfo.email}
                  onChange={(e) => setHolderInfo({ ...holderInfo, email: e.target.value })}
                  type="email"
                />
                <Input
                  label="CPF/CNPJ"
                  value={holderInfo.cpfCnpj}
                  onChange={(e) => setHolderInfo({ ...holderInfo, cpfCnpj: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="CEP"
                    value={holderInfo.postalCode}
                    onChange={(e) => setHolderInfo({ ...holderInfo, postalCode: e.target.value })}
                  />
                  <Input
                    label="Número"
                    value={holderInfo.addressNumber}
                    onChange={(e) => setHolderInfo({ ...holderInfo, addressNumber: e.target.value })}
                  />
                </div>
                <Input
                  label="Telefone"
                  value={holderInfo.phone}
                  onChange={(e) => setHolderInfo({ ...holderInfo, phone: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Resultado do pagamento */}
          {paymentResult && (
            <div className={`p-4 rounded-lg ${
              paymentResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                {paymentResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm font-medium ${
                  paymentResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {paymentResult.message}
                </p>
              </div>

              {isFetchingDetails && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando detalhes do pagamento...</span>
                </div>
              )}

              {detailsError && paymentResult.payment?.id && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Não foi possível carregar os detalhes do pagamento
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        {detailsError}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fetchPaymentDetails(paymentResult.payment.id)}
                      disabled={isFetchingDetails}
                      size="sm"
                    >
                      {isFetchingDetails ? 'Tentando...' : 'Tentar Novamente'}
                    </Button>
                    {paymentResult.payment.bankSlipUrl && (
                      <a
                        href={paymentResult.payment.bankSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Ver no Asaas
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {paymentResult.success && paymentDetails && (
                <div className="space-y-4 mt-4">
                  {/* Boleto */}
                  {paymentMethod === 'BOLETO' && paymentDetails.identificationField && (
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Boleto Bancário</h4>
                      </div>
                      
                      {paymentDetails.dueDate && (
                        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                          <p className="text-yellow-800 dark:text-yellow-200">
                            <strong>Vencimento:</strong> {new Date(paymentDetails.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-yellow-800 dark:text-yellow-200">
                            <strong>Valor:</strong> {formatCurrency(paymentDetails.value)}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            Linha Digitável:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={paymentDetails.identificationField}
                              readOnly
                              className="flex-1 px-3 py-2 text-sm font-mono border rounded bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(paymentDetails.identificationField);
                                addToast({ message: 'Linha digitável copiada!', type: 'success' });
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar
                            </button>
                          </div>
                        </div>

                        <a
                          href={asaasProxyService.getBankSlipPdfUrl(paymentDetails.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Baixar/Imprimir Boleto (PDF)
                        </a>

                        {paymentDetails.bankSlipUrl && (
                          <a
                            href={paymentDetails.bankSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 ml-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            Ver no Asaas
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PIX */}
                  {paymentMethod === 'PIX' && pixData && (
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <QrCode className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Pagamento via PIX</h4>
                      </div>

                      {paymentDetails.value && (
                        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                          <p className="text-green-800 dark:text-green-200">
                            <strong>Valor:</strong> {formatCurrency(paymentDetails.value)}
                          </p>
                        </div>
                      )}
                      
                      {pixData.encodedImage && (
                        <div className="flex justify-center mb-4 p-4 bg-white dark:bg-gray-800 rounded">
                          <img 
                            src={`data:image/png;base64,${pixData.encodedImage}`}
                            alt="QR Code PIX"
                            className="w-64 h-64"
                          />
                        </div>
                      )}
                      
                      {pixData.payload && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                            Ou copie o código PIX:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={pixData.payload}
                              readOnly
                              className="flex-1 px-3 py-2 text-xs font-mono border rounded bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(pixData.payload);
                                addToast({ message: 'Código PIX copiado!', type: 'success' });
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {pixData.expirationDate && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          ⏰ Expira em: {new Date(pixData.expirationDate).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Cartão de Crédito */}
                  {paymentMethod === 'CREDIT_CARD' && paymentDetails && (
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Pagamento Processado</h4>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Status:</strong> <span className="text-green-600 dark:text-green-400">{paymentDetails.status === 'CONFIRMED' ? 'Confirmado' : paymentDetails.status}</span>
                        </p>
                        {paymentDetails.value && (
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Valor:</strong> {formatCurrency(paymentDetails.value)}
                          </p>
                        )}
                        {paymentDetails.creditCard && (
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Cartão:</strong> **** **** **** {paymentDetails.creditCard.creditCardNumber?.slice(-4)}
                          </p>
                        )}
                        <p className="text-green-600 dark:text-green-400 font-medium mt-3">
                          ✓ Pagamento confirmado com sucesso!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary">
            {paymentResult?.success ? 'Fechar' : 'Cancelar'}
          </Button>
          {!paymentResult?.success && (
            <Button onClick={handleProcessPayment} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
