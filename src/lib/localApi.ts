import { v4 as uuidv4 } from 'uuid';

// This is a simple local storage API to mimic Supabase for local development.

const getArenaData = (arenaId: string): Record<string, any[]> => {
  try {
    const data = localStorage.getItem(`db_arena_${arenaId}`);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to parse arena data from localStorage", e);
    return {};
  }
};

const saveArenaData = (arenaId: string, data: Record<string, any[]>) => {
  try {
    localStorage.setItem(`db_arena_${arenaId}`, JSON.stringify(data));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.error("LocalStorage quota exceeded. Cannot save data.");
      throw new Error("O armazenamento local do navegador está cheio. Isso pode ocorrer ao salvar muitas imagens. Tente remover algumas imagens ou dados antigos.");
    }
    throw error;
  }
};

export const localApi = {
  select: async <T>(tableName: string, arenaId: string): Promise<{ data: T[], error: null }> => {
    if (arenaId === 'all') {
        const allData = localStorage.getItem(`db_${tableName}`);
        return { data: allData ? JSON.parse(allData) : [], error: null };
    }
    const arenaData = getArenaData(arenaId);
    const tableData = arenaData[tableName] || [];
    return { data: tableData as T[], error: null };
  },

  upsert: async <T extends { id?: string }>(tableName: string, items: T[], arenaId: string, overwrite: boolean = false): Promise<{ data: T[], error: null }> => {
    if (arenaId === 'all') {
        if (overwrite) {
            localStorage.setItem(`db_${tableName}`, JSON.stringify(items));
            return { data: items, error: null };
        }
        
        const allDataStr = localStorage.getItem(`db_${tableName}`);
        let allData: T[] = allDataStr ? JSON.parse(allDataStr) : [];
        const savedItems: T[] = [];

        items.forEach(item => {
            const index = item.id ? allData.findIndex(i => i.id === item.id) : -1;
            if (index > -1) {
                const updatedItem = { ...allData[index], ...item, updated_at: new Date().toISOString() };
                allData[index] = updatedItem;
                savedItems.push(updatedItem);
            } else {
                const newItem = { ...item, id: (item.id || uuidv4()), created_at: (item as any).created_at || new Date().toISOString() } as T;
                allData.push(newItem);
                savedItems.push(newItem);
            }
        });

        localStorage.setItem(`db_${tableName}`, JSON.stringify(allData));
        return { data: savedItems, error: null };
    }
    
    if (overwrite) {
        const arenaData = getArenaData(arenaId);
        const newTableData = items.map(item => ({
            ...item,
            id: item.id || uuidv4(),
            created_at: (item as any).created_at || new Date().toISOString()
        }));
        arenaData[tableName] = newTableData;
        saveArenaData(arenaId, arenaData);
        return { data: newTableData as T[], error: null };
    }

    const arenaData = getArenaData(arenaId);
    let tableData: T[] = arenaData[tableName] || [];
    const savedItems: T[] = [];

    items.forEach(item => {
      const index = item.id ? tableData.findIndex(i => i.id === item.id) : -1;
      if (index > -1) {
        const updatedItem = { ...tableData[index], ...item, updated_at: new Date().toISOString() };
        tableData[index] = updatedItem;
        savedItems.push(updatedItem);
      } else {
        const newItem = { ...item, id: uuidv4(), created_at: new Date().toISOString() } as T;
        tableData.push(newItem);
        savedItems.push(newItem);
      }
    });

    arenaData[tableName] = tableData;
    saveArenaData(arenaId, arenaData);
    return { data: savedItems, error: null };
  },

  delete: async (tableName: string, ids: string[], arenaId: string): Promise<{ error: null }> => {
    if (arenaId === 'all') {
        const allDataStr = localStorage.getItem(`db_${tableName}`);
        let allData: any[] = allDataStr ? JSON.parse(allDataStr) : [];
        allData = allData.filter(item => !ids.includes(item.id));
        localStorage.setItem(`db_${tableName}`, JSON.stringify(allData));
        return { error: null };
    }
    const arenaData = getArenaData(arenaId);
    let tableData: any[] = arenaData[tableName] || [];
    tableData = tableData.filter(item => !ids.includes(item.id));
    arenaData[tableName] = tableData;
    saveArenaData(arenaId, arenaData);
    return { error: null };
  },
  
  rpc: async (name: string, params: any) => {
    console.warn(`[localApi] Mock RPC call ignored: ${name}`, params);
    return { data: null, error: null };
  }
};

export const localUploadPhoto = async (file: File): Promise<{ publicUrl: string }> => {
    const blobUrl = URL.createObjectURL(file);
    return Promise.resolve({ publicUrl: blobUrl });
};

export const localDeletePhoto = async (url: string): Promise<void> => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
    return Promise.resolve();
};
