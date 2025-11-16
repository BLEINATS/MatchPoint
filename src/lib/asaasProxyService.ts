import axios from 'axios';
import type { AsaasCustomer, AsaasPayment, AsaasSubscription } from './asaasService';

const PROXY_BASE_URL = '/api/asaas';

export class AsaasProxyService {
  async saveConfig(apiKey: string, isSandbox: boolean): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await axios.post(`${PROXY_BASE_URL}/config`, {
        apiKey,
        isSandbox
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao salvar configuração');
    }
  }

  async getConfig(): Promise<{ configured: boolean; isSandbox: boolean }> {
    try {
      const response = await axios.get(`${PROXY_BASE_URL}/config`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar configuração');
    }
  }

  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      const response = await axios.post(`${PROXY_BASE_URL}/customers`, {
        customerData
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao criar cliente');
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    try {
      const response = await axios.get(`${PROXY_BASE_URL}/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar cliente');
    }
  }

  async createSubscription(subscriptionData: AsaasSubscription): Promise<any> {
    try {
      const response = await axios.post(`${PROXY_BASE_URL}/subscriptions`, {
        subscriptionData
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao criar assinatura');
    }
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await axios.get(`${PROXY_BASE_URL}/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar assinatura');
    }
  }

  async createPayment(paymentData: AsaasPayment): Promise<any> {
    try {
      const response = await axios.post(`${PROXY_BASE_URL}/payments`, {
        paymentData
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao criar pagamento');
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(`${PROXY_BASE_URL}/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar pagamento');
    }
  }

  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
    try {
      const response = await axios.get(`${PROXY_BASE_URL}/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar QR Code PIX');
    }
  }

  getBankSlipPdfUrl(paymentId: string): string {
    return `${PROXY_BASE_URL}/payments/${paymentId}/bankSlip`;
  }
}

export default new AsaasProxyService();
