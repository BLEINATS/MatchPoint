import React, { useState } from 'react';
import { X, CreditCard, FileText, QrCode, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Arena, Plan } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { createAsaasSubscription } from '../../utils/asaasHelper';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  arena: Arena;
  plan: Plan;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, arena, plan }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'BOLETO' | 'PIX' | 'CREDIT_CARD'>('BOLETO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string; payment?: any } | null>(null);
  const { addToast } = useToast();

  // Dados do cartão
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });

  // Dados do titular do cartão
  const [holderInfo, setHolderInfo] = useState({
    name: arena.responsible_name || '',
    email: arena.public_email || '',
    cpfCnpj: arena.cnpj_cpf || '',
    postalCode: arena.cep || '',
    addressNumber: arena.number || '',
    phone: arena.contact_phone || '',
  });

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const options: any = {
        arena,
        plan,
        billingType: paymentMethod,
      };

      if (paymentMethod === 'CREDIT_CARD') {
        // Validar dados do cartão
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

      const result = await createAsaasSubscription(options);

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
        addToast({ message: 'Assinatura criada com sucesso!', type: 'success' });
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
              Assinar Plano {plan.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Arena: {arena.name}
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
          {/* Resumo do plano */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Resumo do Plano
            </h3>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Plano:</strong> {plan.name}</p>
              <p><strong>Valor:</strong> R$ {plan.price.toFixed(2)}</p>
              <p><strong>Ciclo:</strong> {
                plan.billing_cycle === 'monthly' ? 'Mensal' :
                plan.billing_cycle === 'quarterly' ? 'Trimestral' :
                plan.billing_cycle === 'semiannual' ? 'Semestral' : 'Anual'
              }</p>
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-3 gap-3">
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
                onClick={() => setPaymentMethod('PIX')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'PIX'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <QrCode className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">PIX</p>
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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
              
              {paymentResult.success && paymentResult.payment && (
                <div className="space-y-3 mt-4">
                  {/* Boleto */}
                  {paymentResult.payment.bankSlipUrl && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium mb-2">Boleto Bancário:</p>
                      <a
                        href={paymentResult.payment.bankSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Visualizar/Imprimir Boleto
                      </a>
                      {paymentResult.payment.dueDate && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Vencimento: {new Date(paymentResult.payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* PIX */}
                  {paymentResult.payment.pixQrCode && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium mb-3">Pagar com PIX:</p>
                      {paymentResult.payment.pixQrCode.encodedImage && (
                        <div className="flex justify-center mb-3">
                          <img 
                            src={`data:image/png;base64,${paymentResult.payment.pixQrCode.encodedImage}`}
                            alt="QR Code PIX"
                            className="w-48 h-48"
                          />
                        </div>
                      )}
                      {paymentResult.payment.pixQrCode.payload && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Ou copie o código PIX:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={paymentResult.payment.pixQrCode.payload}
                              readOnly
                              className="flex-1 px-3 py-2 text-xs border rounded bg-gray-50 dark:bg-gray-800"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(paymentResult.payment.pixQrCode.payload);
                                addToast({ message: 'Código PIX copiado!', type: 'success' });
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      )}
                      {paymentResult.payment.pixQrCode.expirationDate && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Expira em: {new Date(paymentResult.payment.pixQrCode.expirationDate).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Invoice URL (para outros casos) */}
                  {paymentResult.payment.invoiceUrl && !paymentResult.payment.bankSlipUrl && (
                    <a
                      href={paymentResult.payment.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                    >
                      Ver fatura completa →
                    </a>
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
