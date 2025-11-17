import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.ASAAS_PORT || 3001;

app.use(cors());
app.use(express.json());

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/v3';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase não configurado - configuração Asaas não será persistida');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

let asaasConfig = { apiKey: '', isSandbox: true };

async function loadConfig() {
  try {
    if (!supabase) {
      console.log('ℹ️  Supabase não disponível - usando configuração em memória');
      return;
    }

    const { data, error } = await supabase
      .from('asaas_config')
      .select('api_key, is_sandbox')
      .single();

    if (error) {
      console.log('ℹ️  Nenhuma configuração Asaas encontrada no Supabase');
      return;
    }

    if (data && data.api_key) {
      asaasConfig = { 
        apiKey: data.api_key, 
        isSandbox: data.is_sandbox 
      };
      console.log('✅ Configuração Asaas carregada do Supabase');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar configuração do Supabase:', error);
  }
}

async function saveConfig() {
  try {
    if (!supabase) {
      console.log('⚠️  Supabase não disponível - configuração apenas em memória');
      return;
    }

    // Buscar ID existente (se houver) - maybeSingle() não lança erro se vazio
    const { data: existing } = await supabase
      .from('asaas_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Atualizar registro existente
      const { error } = await supabase
        .from('asaas_config')
        .update({ 
          api_key: asaasConfig.apiKey, 
          is_sandbox: asaasConfig.isSandbox,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Inserir novo registro
      const { error } = await supabase
        .from('asaas_config')
        .insert({ 
          api_key: asaasConfig.apiKey, 
          is_sandbox: asaasConfig.isSandbox
        });

      if (error) throw error;
    }
    
    console.log('✅ Configuração Asaas salva no Supabase');
  } catch (error) {
    console.error('❌ Erro ao salvar configuração no Supabase:', error);
    throw error;
  }
}

await loadConfig();

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'MatchPlay API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

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

app.get('/api/asaas/subscriptions/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;

    const baseUrl = getAsaasUrl(asaasConfig.isSandbox);
    const data = await makeAsaasRequest(
      `${baseUrl}/subscriptions/${id}/payments`,
      'GET'
    );

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar pagamentos da assinatura:', error);
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
