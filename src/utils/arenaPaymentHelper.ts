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

const validateCPFChecksum = (cpf: string): boolean => {
  if (cpf.length !== 11) return false;
  
  const invalidCPFs = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ];
  
  if (invalidCPFs.includes(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

const validateCNPJChecksum = (cnpj: string): boolean => {
  if (cnpj.length !== 14) return false;
  
  const invalidCNPJs = [
    '00000000000000', '11111111111111', '22222222222222', '33333333333333',
    '44444444444444', '55555555555555', '66666666666666', '77777777777777',
    '88888888888888', '99999999999999'
  ];
  
  if (invalidCNPJs.includes(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
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
    if (!validateCPFChecksum(cpf)) {
      return {
        valid: false,
        error: 'CPF inválido (dígitos verificadores incorretos). Por favor, verifique o CPF cadastrado.'
      };
    }
  } else if (cpf.length === 14) {
    if (!validateCNPJChecksum(cpf)) {
      return {
        valid: false,
        error: 'CNPJ inválido (dígitos verificadores incorretos). Por favor, verifique o CNPJ cadastrado.'
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
