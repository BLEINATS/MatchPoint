import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.ASAAS_PORT || 3001;

app.use(cors());
app.use(express.json());

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/v3';
const CONFIG_FILE_PATH = path.resolve('.asaas-config.json');

let asaasConfig = { apiKey: '', isSandbox: true };

async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    asaasConfig = JSON.parse(data);
    console.log('✅ Configuração Asaas carregada');
  } catch (error) {
    console.log('ℹ️  Nenhuma configuração Asaas encontrada');
  }
}

async function saveConfig() {
  try {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(asaasConfig, null, 2), 'utf-8');
    console.log('✅ Configuração Asaas salva com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
    throw error;
  }
}

await loadConfig();

function getAsaasUrl(isSandbox) {
  return isSandbox ? ASAAS_SANDBOX_URL : ASAAS_PRODUCTION_URL;
}

async function makeAsaasRequest(url, method, body = null) {
  if (!asaasConfig.apiKey) {
    throw new Error('API key não configurada no servidor');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': asaasConfig.apiKey,
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || data.message || 'Erro na requisição');
  }

  return data;
}

app.post('/api/asaas/config', async (req, res) => {
  try {
    const { apiKey, isSandbox } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key não fornecida' });
    }

    const tempApiKey = apiKey;
    const tempIsSandbox = isSandbox;
    const baseUrl = getAsaasUrl(tempIsSandbox);
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': tempApiKey,
      },
    };

    const response = await fetch(`${baseUrl}/customers?limit=1`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.description || 'Erro ao conectar com Asaas');
    }

    asaasConfig = { apiKey: tempApiKey, isSandbox: tempIsSandbox };
    await saveConfig();

    res.json({ success: true, message: 'Configuração salva com sucesso!' });
  } catch (error) {
    console.error('Erro ao configurar Asaas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro ao conectar com Asaas' 
    });
  }
});

app.get('/api/asaas/config', async (req, res) => {
  res.json({ 
    configured: !!asaasConfig.apiKey,
    isSandbox: asaasConfig.isSandbox
  });
});

app.post('/api/asaas/customers', async (req, res) => {
  try {
    const { customerData } = req.body;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/customers`,
      'POST',
      customerData
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao criar cliente Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/asaas/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/customers/${id}`,
      'GET'
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar cliente Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/asaas/subscriptions', async (req, res) => {
  try {
    const { subscriptionData } = req.body;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/subscriptions`,
      'POST',
      subscriptionData
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao criar assinatura Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/asaas/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/subscriptions/${id}`,
      'GET'
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar assinatura Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/asaas/payments', async (req, res) => {
  try {
    const { paymentData } = req.body;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/payments`,
      'POST',
      paymentData
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao criar pagamento Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/asaas/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/payments/${id}`,
      'GET'
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar pagamento Asaas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/asaas/payments/:id/pixQrCode', async (req, res) => {
  try {
    const { id } = req.params;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/payments/${id}/pixQrCode`,
      'GET'
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar QR Code PIX:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/asaas/payments/:id/bankSlip', async (req, res) => {
  try {
    const { id } = req.params;

    if (!asaasConfig.apiKey) {
      return res.status(500).json({ error: 'API key não configurada no servidor' });
    }

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const pdfUrl = `${baseUrl}/payments/${id}/bankSlipPdf`;
    
    const options = {
      method: 'GET',
      headers: {
        'access_token': asaasConfig.apiKey,
      },
    };

    const response = await fetch(pdfUrl, options);
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.description || 'Erro ao buscar boleto');
      }
      throw new Error('Erro ao buscar boleto PDF');
    }

    const pdfBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="boleto-${id}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Erro ao buscar boleto PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor proxy Asaas rodando na porta ${PORT}`);
});
