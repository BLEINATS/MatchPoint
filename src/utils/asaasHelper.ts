import { localApi } from '../lib/localApi';
import asaasProxyService from '../lib/asaasProxyService';
import { Arena, Plan, Subscription } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSubscriptionOptions {
  arena: Arena;
  plan: Plan;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
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

export const checkAsaasConfig = async (): Promise<boolean> => {
  try {
    const config = await asaasProxyService.getConfig();
    return config.configured;
  } catch (error) {
    return false;
  }
};

export const createAsaasSubscription = async (options: CreateSubscriptionOptions): Promise<{ success: boolean; payment?: any; error?: string }> => {
  try {
    const configured = await checkAsaasConfig();
    if (!configured) {
      return { success: false, error: 'Asaas não configurado. Configure a API key primeiro.' };
    }

    const { arena, plan, billingType, creditCard, creditCardHolderInfo } = options;

    // Buscar ou criar cliente no Asaas
    let asaasCustomerId = arena.asaas_customer_id;
    
    if (!asaasCustomerId) {
      // Criar cliente no Asaas
      const customerData = {
        name: arena.name,
        email: arena.public_email || arena.owner_id + '@matchplay.com',
        cpfCnpj: arena.cnpj_cpf || '00000000000',
        phone: arena.contact_phone || '',
        externalReference: arena.id,
      };

      const customer = await asaasProxyService.createCustomer(customerData);
      asaasCustomerId = customer.id!;

      // Atualizar arena com customer ID
      const updatedArena = { ...arena, asaas_customer_id: asaasCustomerId };
      await localApi.upsert('arenas', [updatedArena], 'all');
    }

    // Determinar ciclo de cobrança
    let cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
    switch (plan.billing_cycle) {
      case 'monthly':
        cycle = 'MONTHLY';
        break;
      case 'quarterly':
        cycle = 'QUARTERLY';
        break;
      case 'semiannual':
        cycle = 'SEMIANNUALLY';
        break;
      case 'annual':
        cycle = 'YEARLY';
        break;
      default:
        cycle = 'MONTHLY';
    }

    // Calcular próxima data de vencimento
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 7); // 7 dias a partir de hoje

    // Criar assinatura no Asaas
    const subscriptionData = {
      customer: asaasCustomerId,
      billingType,
      value: plan.price,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle,
      description: `Plano ${plan.name} - ${arena.name}`,
      externalReference: arena.id,
    };

    const asaasSubscription = await asaasProxyService.createSubscription(subscriptionData);

    // Criar o primeiro pagamento (charge)
    let payment = null;
    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      const paymentData = {
        customer: asaasCustomerId,
        billingType: 'CREDIT_CARD' as const,
        value: plan.price,
        dueDate: nextDueDate.toISOString().split('T')[0],
        description: `Primeira cobrança - Plano ${plan.name}`,
        creditCard,
        creditCardHolderInfo,
      };

      payment = await asaasProxyService.createPayment(paymentData);
    } else {
      // Para boleto e PIX, criar o pagamento normal
      const paymentData = {
        customer: asaasCustomerId,
        billingType,
        value: plan.price,
        dueDate: nextDueDate.toISOString().split('T')[0],
        description: `Primeira cobrança - Plano ${plan.name}`,
      };

      payment = await asaasProxyService.createPayment(paymentData);

      // Se for PIX, buscar o QR Code
      if (billingType === 'PIX' && payment.id) {
        try {
          const pixData = await asaasProxyService.getPixQrCode(payment.id);
          payment.pixQrCode = pixData;
        } catch (error) {
          console.error('Erro ao buscar QR Code PIX:', error);
        }
      }
    }

    // Atualizar subscription local
    const { data: existingSubs } = await localApi.select<Subscription>('subscriptions', 'all');
    const existingSub = existingSubs?.find(s => s.arena_id === arena.id);

    const subscription: Subscription = {
      id: existingSub?.id || `sub_${uuidv4()}`,
      arena_id: arena.id,
      plan_id: plan.id,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: null,
      asaas_subscription_id: asaasSubscription.id,
      asaas_customer_id: asaasCustomerId,
      next_payment_date: nextDueDate.toISOString(),
    };

    await localApi.upsert('subscriptions', [subscription], 'all');

    return { success: true, payment };
  } catch (error: any) {
    console.error('Erro ao criar assinatura Asaas:', error);
    return { success: false, error: error.message || 'Erro ao criar assinatura' };
  }
};

export const cancelAsaasSubscription = async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const configured = await checkAsaasConfig();
    if (!configured) {
      return { success: false, error: 'Asaas não configurado' };
    }

    const { data: subs } = await localApi.select<Subscription>('subscriptions', 'all');
    const subscription = subs?.find(s => s.id === subscriptionId);

    if (!subscription || !subscription.asaas_subscription_id) {
      return { success: false, error: 'Assinatura não encontrada ou não vinculada ao Asaas' };
    }

    const updatedSub: Subscription = {
      ...subscription,
      status: 'canceled',
      end_date: new Date().toISOString(),
    };

    await localApi.upsert('subscriptions', [updatedSub], 'all');

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    return { success: false, error: error.message || 'Erro ao cancelar assinatura' };
  }
};
