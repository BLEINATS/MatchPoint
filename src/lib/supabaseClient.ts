// ATENÇÃO: O CLIENTE SUPABASE FOI DESATIVADO.
// A aplicação está operando em modo local utilizando 'src/lib/localApi.ts'.
// Não adicione código a este arquivo. As chamadas estão sendo interceptadas
// e redirecionadas para a API local para garantir a persistência dos dados no navegador.

// Mock channel para evitar crashes em modo local
const mockChannel = {
  on: () => mockChannel,
  subscribe: (callback?: (status: string) => void) => {
    if (callback) {
      // Simula uma subscrição bem-sucedida, se necessário.
      // callback('SUBSCRIBED');
    }
    return mockChannel;
  },
};

// Mock do cliente Supabase para modo local
export const supabase = {
  from: (tableName: string) => {
    console.warn(`[MOCK] supabase.from('${tableName}') called directly. Use localApi instead.`);
    return {
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      rpc: () => Promise.resolve({ data: null, error: null }),
      eq: () => Promise.resolve({ data: [], error: null }),
      in: () => Promise.resolve({ data: [], error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    };
  },
  channel: (name: string) => {
    console.warn(`[MOCK] supabase.channel('${name}') called in local mode. Real-time features are disabled.`);
    return mockChannel;
  },
  removeChannel: (channel: any) => {
    console.warn(`[MOCK] supabase.removeChannel() called in local mode.`);
  },
  rpc: async (name: string, params: any) => {
    console.warn(`[MOCK] supabase.rpc('${name}') called directly. Use localApi instead.`);
    return { data: null, error: null };
  },
  storage: {
    from: (bucket: string) => ({
      upload: () => Promise.resolve({ data: null, error: { message: 'Upload desativado em modo local' } }),
      remove: () => Promise.resolve({ data: null, error: { message: 'Remoção desativada em modo local' } }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
    }),
  },
};

export const supabaseWithRetry = async (operation: () => Promise<any>) => {
  console.warn("[MOCK] supabaseWithRetry was called, but is disabled in local mode.");
  return operation();
};
