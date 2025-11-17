import { supabase } from './supabaseClient';

const GLOBAL_TABLES = ['profiles', 'arenas', 'subscriptions', 'plans', 'friendships', 'credit_cards'];

export const supabaseApi = {
  select: async <T>(tableName: string, arenaId: string): Promise<{ data: T[], error: any }> => {
    try {
      if (arenaId === 'all') {
        if (GLOBAL_TABLES.includes(tableName)) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });
          
          return { data: (data as T[]) || [], error };
        } else {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });
          
          return { data: (data as T[]) || [], error };
        }
      }

      if (GLOBAL_TABLES.includes(tableName)) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });
        
        return { data: (data as T[]) || [], error };
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('arena_id', arenaId)
        .order('created_at', { ascending: false });
      
      return { data: (data as T[]) || [], error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error selecting from ${tableName}:`, error);
      return { data: [], error };
    }
  },

  upsert: async <T extends { id?: string }>(
    tableName: string,
    items: T[],
    arenaId: string,
    overwrite: boolean = false
  ): Promise<{ data: T[], error: any }> => {
    try {
      if (overwrite) {
        console.warn(`[SupabaseAPI] Overwrite mode not fully supported in Supabase. Use with caution.`);
      }

      const itemsWithArenaId = items.map(item => {
        if (!GLOBAL_TABLES.includes(tableName) && arenaId !== 'all') {
          return { ...item, arena_id: arenaId };
        }
        return item;
      });

      const { data, error } = await supabase
        .from(tableName)
        .upsert(itemsWithArenaId, { onConflict: 'id' })
        .select();

      return { data: (data as T[]) || [], error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error upserting to ${tableName}:`, error);
      return { data: [], error };
    }
  },

  delete: async (
    tableName: string,
    ids: string[]
  ): Promise<{ data: null, error: any }> => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      return { data: null, error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error deleting from ${tableName}:`, error);
      return { data: null, error };
    }
  },

  selectWithFilter: async <T>(
    tableName: string,
    arenaId: string,
    filters: Record<string, any>
  ): Promise<{ data: T[], error: any }> => {
    try {
      let query = supabase.from(tableName).select('*');

      if (!GLOBAL_TABLES.includes(tableName) && arenaId !== 'all') {
        query = query.eq('arena_id', arenaId);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.order('created_at', { ascending: false });
      
      return { data: (data as T[]) || [], error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error selecting with filter from ${tableName}:`, error);
      return { data: [], error };
    }
  },

  selectSingle: async <T>(
    tableName: string,
    id: string
  ): Promise<{ data: T | null, error: any }> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      return { data: (data as T) || null, error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error selecting single from ${tableName}:`, error);
      return { data: null, error };
    }
  },

  updateFields: async <T>(
    tableName: string,
    id: string,
    updates: Partial<T>
  ): Promise<{ data: T | null, error: any }> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { data: (data as T) || null, error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error updating ${tableName}:`, error);
      return { data: null, error };
    }
  },

  rpc: async <T>(functionName: string, params: Record<string, any> = {}): Promise<{ data: T | null, error: any }> => {
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      return { data: (data as T) || null, error };
    } catch (error) {
      console.error(`[SupabaseAPI] Error calling RPC ${functionName}:`, error);
      return { data: null, error };
    }
  }
};

export const insertInitialData = async () => {
  console.log('🌱 Seeding initial data to Supabase...');
  
  try {
    const { data: existingPlans } = await supabase.from('plans').select('id').limit(1);
    
    if (!existingPlans || existingPlans.length === 0) {
      const defaultPlans = [
        {
          name: 'Starter',
          price: 99.00,
          billing_cycle: 'monthly',
          features: ['3 quadras', '5 membros', 'Suporte básico'],
          is_active: true
        },
        {
          name: 'Professional',
          price: 299.00,
          billing_cycle: 'monthly',
          features: ['10 quadras', '20 membros', 'Gamificação', 'Relatórios avançados'],
          is_active: true
        },
        {
          name: 'Enterprise',
          price: 599.00,
          billing_cycle: 'monthly',
          features: ['Quadras ilimitadas', 'Membros ilimitados', 'Suporte prioritário', 'API'],
          is_active: true
        }
      ];

      await supabase.from('plans').insert(defaultPlans);
      console.log('✅ Default plans inserted');
    }
  } catch (error) {
    console.error('❌ Error seeding data:', error);
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
