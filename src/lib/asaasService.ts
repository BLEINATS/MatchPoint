import axios, { AxiosInstance } from 'axios';

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  postalService?: boolean;
  split?: any[];
  callback?: {
    successUrl?: string;
    autoRedirect?: boolean;
  };
}

export interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  split?: any[];
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

export interface AsaasWebhookEvent {
  event: 'PAYMENT_CREATED' | 'PAYMENT_UPDATED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED' | 'PAYMENT_RESTORED' | 'PAYMENT_REFUNDED' | 'PAYMENT_RECEIVED_IN_CASH' | 'PAYMENT_CHARGEBACK_REQUESTED' | 'PAYMENT_CHARGEBACK_DISPUTE' | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL' | 'PAYMENT_DUNNING_RECEIVED' | 'PAYMENT_DUNNING_REQUESTED' | 'PAYMENT_BANK_SLIP_VIEWED' | 'PAYMENT_CHECKOUT_VIEWED';
  payment: {
    id: string;
    customer: string;
    subscription?: string;
    installment?: string;
    value: number;
    netValue: number;
    originalValue?: number;
    interestValue?: number;
    description?: string;
    billingType: string;
    status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE';
    dueDate: string;
    originalDueDate: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    externalReference?: string;
  };
}

export class AsaasService {
  private api: AxiosInstance;
  private isProduction: boolean;

  constructor(apiKey: string, production: boolean = false) {
    this.isProduction = production;
    const baseURL = production 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });
  }

  // Customer Methods
  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    const response = await this.api.post('/customers', customer);
    return response.data;
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    const response = await this.api.get(`/customers/${customerId}`);
    return response.data;
  }

  async listCustomers(filters?: { email?: string; cpfCnpj?: string; externalReference?: string }): Promise<{ data: AsaasCustomer[]; totalCount: number }> {
    const response = await this.api.get('/customers', { params: filters });
    return response.data;
  }

  async updateCustomer(customerId: string, customer: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    const response = await this.api.put(`/customers/${customerId}`, customer);
    return response.data;
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.api.delete(`/customers/${customerId}`);
  }

  // Payment Methods
  async createPayment(payment: AsaasPayment): Promise<any> {
    const response = await this.api.post('/payments', payment);
    return response.data;
  }

  async getPayment(paymentId: string): Promise<any> {
    const response = await this.api.get(`/payments/${paymentId}`);
    return response.data;
  }

  async listPayments(filters?: { customer?: string; subscription?: string; status?: string }): Promise<{ data: any[]; totalCount: number }> {
    const response = await this.api.get('/payments', { params: filters });
    return response.data;
  }

  async deletePayment(paymentId: string): Promise<void> {
    await this.api.delete(`/payments/${paymentId}`);
  }

  async getPaymentInvoiceUrl(paymentId: string): Promise<string> {
    const payment = await this.getPayment(paymentId);
    return payment.invoiceUrl || '';
  }

  async getPaymentBankSlipUrl(paymentId: string): Promise<string> {
    const payment = await this.getPayment(paymentId);
    return payment.bankSlipUrl || '';
  }

  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
    const response = await this.api.get(`/payments/${paymentId}/pixQrCode`);
    return response.data;
  }

  // Subscription Methods
  async createSubscription(subscription: AsaasSubscription): Promise<any> {
    const response = await this.api.post('/subscriptions', subscription);
    return response.data;
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    const response = await this.api.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  }

  async listSubscriptions(filters?: { customer?: string; status?: string }): Promise<{ data: any[]; totalCount: number }> {
    const response = await this.api.get('/subscriptions', { params: filters });
    return response.data;
  }

  async updateSubscription(subscriptionId: string, subscription: Partial<AsaasSubscription>): Promise<any> {
    const response = await this.api.put(`/subscriptions/${subscriptionId}`, subscription);
    return response.data;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.api.delete(`/subscriptions/${subscriptionId}`);
  }

  // Payment with Credit Card
  async createPaymentWithCreditCard(
    payment: AsaasPayment,
    creditCard: AsaasCreditCard,
    creditCardHolderInfo: AsaasCreditCardHolderInfo
  ): Promise<any> {
    const response = await this.api.post('/payments', {
      ...payment,
      creditCard,
      creditCardHolderInfo,
    });
    return response.data;
  }

  // Webhook verification
  verifyWebhook(webhookEvent: AsaasWebhookEvent): boolean {
    return !!(webhookEvent && webhookEvent.event && webhookEvent.payment);
  }

  // Helper: Get environment info
  getEnvironmentInfo(): { environment: string; baseURL: string } {
    return {
      environment: this.isProduction ? 'production' : 'sandbox',
      baseURL: this.api.defaults.baseURL || '',
    };
  }
}

export default AsaasService;
