import { localApi } from '../lib/localApi';
import asaasProxyService from '../lib/asaasProxyService';
import { Aluno, Arena, Profile } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateArenaPaymentOptions {
  arena: Arena;
  customer: Aluno | Profile;
  description: string;
  amount: number;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  dueDate?: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export const checkAsaasConfigForArena = (arena: Arena): boolean => {
  return !!arena.asaas_api_key && arena.asaas_api_key.trim().length > 0;
};

export const checkAsaasConfig = async (): Promise<boolean> => {
  try {
    const config = await asaasProxyService.getConfig();
    return config.configured;
  } catch (error) {
    return false;
  }
};

export const createArenaPayment = async (options: CreateArenaPaymentOptions): Promise<{ success: boolean; payment?: any; error?: string; isRealPayment: boolean }> => {
  try {
    const { arena, customer, description, amount, billingType, dueDate, externalReference, creditCard, creditCardHolderInfo } = options;
    
    const arenaHasAsaas = checkAsaasConfigForArena(arena);
    const globalAsaasConfigured = await checkAsaasConfig();
    const shouldUseAsaas = arenaHasAsaas && globalAsaasConfigured;
    
    if (!shouldUseAsaas) {
      const mockPaymentId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockPayment = {
        id: mockPaymentId,
        invoiceUrl: null,
        bankSlipUrl: null,
        status: 'CONFIRMED',
        value: amount,
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billingType: billingType,
        identificationField: billingType === 'BOLETO' ? '34191.79001 01043.510047 91020.150008 1 84410000002000' : undefined,
        pixQrCode: billingType === 'PIX' ? {
          encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          payload: '00020126580014br.gov.bcb.pix0136' + mockPaymentId,
          expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        } : undefined,
      };
      
      return {
        success: true,
        payment: mockPayment,
        isRealPayment: false
      };
    }

    let asaasCustomerId = ('asaas_customer_id' in customer) ? customer.asaas_customer_id : undefined;
    
    if (!asaasCustomerId) {
      let cpfCnpj = '00000000000';
      if ('cpf' in customer && customer.cpf) {
        cpfCnpj = String(customer.cpf);
      } else if ('cpf_cnpj' in customer && customer.cpf_cnpj) {
        cpfCnpj = String(customer.cpf_cnpj);
      }
      
      const customerData = {
        name: customer.name,
        email: customer.email || `${customer.id}@matchplay.com`,
        cpfCnpj: cpfCnpj,
        phone: customer.phone || '',
        externalReference: customer.id,
      };

      const asaasCustomer = await asaasProxyService.createCustomer(customerData);
      asaasCustomerId = asaasCustomer.id!;

      const updatedCustomer = { ...customer, asaas_customer_id: asaasCustomerId };
      
      if ('cpf' in customer) {
        await localApi.upsert('alunos', [updatedCustomer], arena.id);
      } else {
        await localApi.upsert('profiles', [updatedCustomer], 'all');
      }
    }

    const paymentData: any = {
      customer: asaasCustomerId,
      billingType,
      value: amount,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description,
      externalReference: externalReference || uuidv4(),
    };

    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      paymentData.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\s/g, ''),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      };
      paymentData.creditCardHolderInfo = {
        name: creditCardHolderInfo.name,
        email: creditCardHolderInfo.email,
        cpfCnpj: creditCardHolderInfo.cpfCnpj.replace(/[^\d]/g, ''),
        postalCode: creditCardHolderInfo.postalCode.replace(/[^\d]/g, ''),
        addressNumber: creditCardHolderInfo.addressNumber,
        phone: creditCardHolderInfo.phone.replace(/[^\d]/g, ''),
      };
    }

    const payment = await asaasProxyService.createPayment(paymentData);

    return { 
      success: true, 
      payment: {
        id: payment.id,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        status: payment.status,
        value: payment.value,
        dueDate: payment.dueDate,
        billingType: payment.billingType,
      },
      isRealPayment: true
    };
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return { success: false, error: error.message || 'Erro ao processar pagamento', isRealPayment: false };
  }
};
