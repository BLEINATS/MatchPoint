import { supabaseApi } from '../lib/supabaseApi';
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
    const { arena, plan, billingType, creditCard, creditCardHolderInfo } = options;
    
    console.log('[createAsaasSubscription] Iniciando com:', { arena: arena.name, plan: plan.name, billingType });

    // PLANO 100% GRÁTIS: Sem cobrança, apenas subscription local
    const isFreePlan = plan.price === 0;
    
    if (isFreePlan) {
      console.log('[createAsaasSubscription] Plano gratuito detectado, criando subscription local');
      
      // Para planos totalmente grátis, criar apenas subscription local sem Asaas
      const { data: existingSubs } = await supabaseApi.select<Subscription>('subscriptions', 'all');
      const existingSub = existingSubs?.find(s => s.arena_id === arena.id);

      const trialDuration = plan.trial_days || plan.duration_days || 7;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + trialDuration);

      const subscription: Subscription = {
        id: existingSub?.id || uuidv4(),
        arena_id: arena.id,
        plan_id: plan.id,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        asaas_subscription_id: null,
        asaas_customer_id: null,
        next_payment_date: null,
      };

      await supabaseApi.upsert('subscriptions', [subscription], 'all');
      console.log('[createAsaasSubscription] Subscription gratuita salva com sucesso');

      return { 
        success: true, 
        payment: { 
          status: 'CONFIRMED',
          value: 0,
          description: `Plano ${plan.name} - ${trialDuration} dias grátis (sem cobrança)`
        }
      };
    }

    // PLANOS PAGOS: Criar no Asaas
    console.log('[createAsaasSubscription] Plano pago detectado, verificando configuração Asaas');
    
    const configured = await checkAsaasConfig();
    if (!configured) {
      console.error('[createAsaasSubscription] Asaas não configurado');
      return { success: false, error: 'Asaas não configurado. Configure a API key primeiro.' };
    }

    // Buscar ou criar cliente no Asaas
    let asaasCustomerId = arena.asaas_customer_id;
    
    if (!asaasCustomerId) {
      console.log('[createAsaasSubscription] Criando novo cliente no Asaas');
      
      const customerData = {
        name: arena.name,
        email: arena.public_email || arena.owner_id + '@matchplay.com',
        cpfCnpj: arena.cnpj_cpf || '00000000000',
        phone: arena.contact_phone || '',
        externalReference: arena.id,
      };

      const customer = await asaasProxyService.createCustomer(customerData);
      asaasCustomerId = customer.id!;
      
      console.log('[createAsaasSubscription] Cliente criado:', asaasCustomerId);

      // Atualizar arena com customer ID no Supabase
      const updatedArena = { ...arena, asaas_customer_id: asaasCustomerId };
      await supabaseApi.upsert('arenas', [updatedArena], 'all');
    } else {
      console.log('[createAsaasSubscription] Usando customer ID existente:', asaasCustomerId);
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

    // Calcular próxima data de vencimento (considerar período trial se houver)
    const nextDueDate = new Date();
    const daysUntilFirstCharge = plan.trial_days || 7;
    nextDueDate.setDate(nextDueDate.getDate() + daysUntilFirstCharge);

    console.log('[createAsaasSubscription] Criando assinatura no Asaas:', {
      customer: asaasCustomerId,
      billingType,
      value: plan.price,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle
    });

    // Criar assinatura no Asaas (inclui dados do cartão se fornecidos)
    const subscriptionData: any = {
      customer: asaasCustomerId,
      billingType,
      value: plan.price,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle,
      description: `Plano ${plan.name} - ${arena.name}`,
      externalReference: arena.id,
    };

    // Se for cartão, incluir dados do cartão na criação da subscription
    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      subscriptionData.creditCard = creditCard;
      subscriptionData.creditCardHolderInfo = creditCardHolderInfo;
    }

    const asaasSubscription = await asaasProxyService.createSubscription(subscriptionData);
    console.log('[createAsaasSubscription] Assinatura criada no Asaas:', asaasSubscription.id);

    // Buscar o primeiro payment criado automaticamente pela subscription
    // Tenta 2 vezes com delay porque o Asaas pode demorar alguns segundos para gerar o payment
    console.log('[createAsaasSubscription] Buscando payments da subscription');
    let payment = null;
    let attempt = 0;
    const maxAttempts = 2;
    
    while (attempt < maxAttempts && !payment) {
      try {
        if (attempt > 0) {
          // Aguardar 2 segundos antes de tentar novamente
          console.log('[createAsaasSubscription] Aguardando 2s antes de tentar novamente...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const paymentsResponse = await asaasProxyService.getSubscriptionPayments(asaasSubscription.id);
        const payments = paymentsResponse.data || paymentsResponse;
        
        if (payments && payments.length > 0) {
          payment = payments[0];
          console.log('[createAsaasSubscription] Payment encontrado:', payment.id, 'Status:', payment.status);
          
          // Para cartão de crédito, verificar se o pagamento foi autorizado
          if (billingType === 'CREDIT_CARD' && payment.status === 'PAYMENT_LIMIT_EXCEEDED') {
            console.error('[createAsaasSubscription] Pagamento com cartão recusado');
            return { 
              success: false, 
              error: 'Pagamento com cartão recusado. Verifique os dados do cartão e tente novamente.' 
            };
          }
        } else {
          console.warn(`[createAsaasSubscription] Tentativa ${attempt + 1}/${maxAttempts}: Nenhum payment encontrado ainda`);
        }
      } catch (error: any) {
        console.error(`[createAsaasSubscription] Erro na tentativa ${attempt + 1}:`, error.message);
      }
      
      attempt++;
    }
    
    // Se não conseguiu buscar payment após 2 tentativas, retornar erro
    if (!payment) {
      console.error('[createAsaasSubscription] Não foi possível buscar o payment da subscription após', maxAttempts, 'tentativas');
      return { 
        success: false, 
        error: 'Assinatura criada, mas não foi possível buscar os detalhes do pagamento. Tente acessar novamente em alguns instantes ou verifique na área de Configurações > Plano e Assinatura.' 
      };
    }

    console.log('[createAsaasSubscription] Salvando subscription no Supabase');

    // Atualizar subscription no Supabase
    const { data: existingSubs } = await supabaseApi.select<Subscription>('subscriptions', 'all');
    const existingSub = existingSubs?.find(s => s.arena_id === arena.id);

    const subscription: Subscription = {
      id: existingSub?.id || uuidv4(),
      arena_id: arena.id,
      plan_id: plan.id,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: null,
      asaas_subscription_id: asaasSubscription.id,
      asaas_customer_id: asaasCustomerId,
      next_payment_date: nextDueDate.toISOString(),
    };

    await supabaseApi.upsert('subscriptions', [subscription], 'all');
    console.log('[createAsaasSubscription] Subscription salva com sucesso');

    // Atualizar arena com o novo plan_id
    const updatedArena = { ...arena, plan_id: plan.id };
    await supabaseApi.upsert('arenas', [updatedArena], 'all');
    console.log('[createAsaasSubscription] Arena atualizada com novo plan_id');

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

    const { data: subs } = await supabaseApi.select<Subscription>('subscriptions', 'all');
    const subscription = subs?.find(s => s.id === subscriptionId);

    if (!subscription || !subscription.asaas_subscription_id) {
      return { success: false, error: 'Assinatura não encontrada ou não vinculada ao Asaas' };
    }

    const updatedSub: Subscription = {
      ...subscription,
      status: 'canceled',
      end_date: new Date().toISOString(),
    };

    await supabaseApi.upsert('subscriptions', [updatedSub], 'all');

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    return { success: false, error: error.message || 'Erro ao cancelar assinatura' };
  }
};
