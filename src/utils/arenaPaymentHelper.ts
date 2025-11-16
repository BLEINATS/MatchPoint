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
  creditCardToken?: string;
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
  saveCard?: boolean;
}

export const checkAsaasConfigForArena = (arena: Arena): boolean => {
  return !!arena.asaas_api_key && arena.asaas_api_key.trim().length > 0;
};

export const validateCustomerCPF = (customer: Aluno | Profile): { valid: boolean; cpf?: string; error?: string } => {
  let cpf = '';
  
  if ('cpf' in customer && customer.cpf) {
    cpf = String(customer.cpf).replace(/\D/g, '');
  } else if ('cpf_cnpj' in customer && customer.cpf_cnpj) {
    cpf = String(customer.cpf_cnpj).replace(/\D/g, '');
  }
  
  if (!cpf || cpf.length === 0) {
    return {
      valid: false,
      error: 'CPF não cadastrado. Por favor, cadastre seu CPF antes de realizar o pagamento.'
    };
  }
  
  if (cpf.length !== 11 && cpf.length !== 14) {
    return {
      valid: false,
      error: 'CPF/CNPJ inválido. Verifique o cadastro.'
    };
  }
  
  if (cpf.length === 11) {
    const invalidCPFs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ];
    
    if (invalidCPFs.includes(cpf)) {
      return {
        valid: false,
        error: 'CPF inválido. Por favor, cadastre um CPF válido antes de realizar o pagamento.'
      };
    }
  }
  
  return { valid: true, cpf };
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
    const { arena, customer, description, amount, billingType, dueDate, externalReference, creditCard, creditCardHolderInfo, creditCardToken, saveCard } = options;
    
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

    const cpfValidation = validateCustomerCPF(customer);
    if (!cpfValidation.valid) {
      return {
        success: false,
        error: cpfValidation.error,
        isRealPayment: false
      };
    }

    let asaasCustomerId = ('asaas_customer_id' in customer) ? customer.asaas_customer_id : undefined;
    
    if (!asaasCustomerId) {
      const customerData = {
        name: customer.name,
        email: customer.email || `${customer.id}@matchplay.com`,
        cpfCnpj: cpfValidation.cpf!,
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

    if (billingType === 'CREDIT_CARD') {
      if (creditCardToken) {
        paymentData.creditCardToken = creditCardToken;
      } else if (creditCard && creditCardHolderInfo) {
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
    }

    const payment = await asaasProxyService.createPayment(paymentData);

    if (billingType === 'CREDIT_CARD' && saveCard && payment.creditCardToken && !creditCardToken) {
      const existingCards = customer.credit_cards || [];
      const cardExists = existingCards.some(card => card.asaas_token === payment.creditCardToken);
      
      if (!cardExists) {
        const newCard = {
          id: uuidv4(),
          asaas_token: payment.creditCardToken,
          last4: payment.creditCardNumber || creditCard?.number.slice(-4) || '****',
          brand: payment.creditCardBrand || 'UNKNOWN',
          cardholder_name: creditCard?.holderName || customer.name,
          created_at: new Date().toISOString(),
        };
        
        const updatedCustomer = {
          ...customer,
          credit_cards: [...existingCards, newCard]
        };
        
        if ('cpf' in customer) {
          await localApi.upsert('alunos', [updatedCustomer], arena.id);
        } else {
          await localApi.upsert('profiles', [updatedCustomer], 'all');
        }
      }
    }

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
