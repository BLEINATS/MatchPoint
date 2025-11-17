import { supabaseApi } from '../lib/supabaseApi';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const idMapping = new Map<string, string>();

function ensureUUID(id: string): string {
  if (!id) return uuidv4();
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  if (idMapping.has(id)) {
    return idMapping.get(id)!;
  }
  
  const newUuid = uuidv5(id, UUID_NAMESPACE);
  idMapping.set(id, newUuid);
  console.log(`🔄 Convertendo ID customizado: ${id} → ${newUuid}`);
  return newUuid;
}

function normalizeRecord(record: any): any {
  const normalized = { ...record };
  
  if (normalized.id) normalized.id = ensureUUID(normalized.id);
  if (normalized.arena_id) normalized.arena_id = ensureUUID(normalized.arena_id);
  if (normalized.owner_id) normalized.owner_id = ensureUUID(normalized.owner_id);
  if (normalized.user_id) normalized.user_id = ensureUUID(normalized.user_id);
  if (normalized.profile_id) normalized.profile_id = ensureUUID(normalized.profile_id);
  if (normalized.user_1_id) normalized.user_1_id = ensureUUID(normalized.user_1_id);
  if (normalized.user_2_id) normalized.user_2_id = ensureUUID(normalized.user_2_id);
  if (normalized.aluno_id) normalized.aluno_id = ensureUUID(normalized.aluno_id);
  if (normalized.professor_id) normalized.professor_id = ensureUUID(normalized.professor_id);
  if (normalized.quadra_id) normalized.quadra_id = ensureUUID(normalized.quadra_id);
  if (normalized.plan_id) normalized.plan_id = ensureUUID(normalized.plan_id);
  
  return normalized;
}

export async function migrateLocalStorageToSupabase() {
  console.log('🚀 Iniciando migração de dados do localStorage para Supabase...');
  console.log('🔄 Conversão automática de IDs customizados para UUIDs ativada');
  
  idMapping.clear();
  
  const results = {
    success: [] as string[],
    errors: [] as string[],
    skipped: [] as string[]
  };

  try {
    const GLOBAL_TABLES = ['profiles', 'arenas', 'subscriptions', 'plans', 'friendships'];
    const ARENA_TABLES = [
      'quadras', 'reservas', 'alunos', 'professores', 'turmas',
      'torneios', 'eventos', 'notificacoes', 'rental_items', 'products',
      'pricing_rules', 'duration_discounts', 'atletas_aluguel',
      'planos_aula', 'credit_transactions',
      'gamification_settings', 'gamification_levels', 'gamification_rewards',
      'gamification_achievements', 'aluno_achievements',
      'gamification_point_transactions', 'redeemed_vouchers'
    ];

    for (const tableName of GLOBAL_TABLES) {
      try {
        const dataStr = localStorage.getItem(`db_${tableName}`);
        if (!dataStr) {
          results.skipped.push(`${tableName} (sem dados)`);
          continue;
        }

        const data = JSON.parse(dataStr);
        if (!data || data.length === 0) {
          results.skipped.push(`${tableName} (vazio)`);
          continue;
        }

        const normalizedData = data.map(normalizeRecord);
        console.log(`📦 Migrando ${tableName}: ${normalizedData.length} registros...`);
        const { error } = await supabaseApi.upsert(tableName, normalizedData, 'all');

        if (error) {
          results.errors.push(`${tableName}: ${error.message}`);
          console.error(`❌ Erro ao migrar ${tableName}:`, error);
        } else {
          results.success.push(`${tableName} (${data.length} registros)`);
          console.log(`✅ ${tableName} migrado com sucesso`);
        }
      } catch (error: any) {
        results.errors.push(`${tableName}: ${error.message}`);
        console.error(`❌ Erro ao processar ${tableName}:`, error);
      }
    }

    const arenaIds: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('db_arena_')) {
        const arenaId = key.replace('db_arena_', '');
        arenaIds.push(arenaId);
      }
    }

    console.log(`🏟️ Encontradas ${arenaIds.length} arenas para migrar`);

    for (const arenaId of arenaIds) {
      const normalizedArenaId = ensureUUID(arenaId);
      console.log(`\n📍 Migrando dados da arena: ${arenaId} → ${normalizedArenaId}`);
      
      const arenaDataStr = localStorage.getItem(`db_arena_${arenaId}`);
      if (!arenaDataStr) continue;

      try {
        const arenaData = JSON.parse(arenaDataStr);

        for (const tableName of ARENA_TABLES) {
          if (!arenaData[tableName] || arenaData[tableName].length === 0) {
            continue;
          }

          try {
            const data = arenaData[tableName];
            const normalizedData = data.map(normalizeRecord);
            console.log(`  📦 Migrando ${tableName}: ${normalizedData.length} registros...`);

            const { error } = await supabaseApi.upsert(tableName, normalizedData, ensureUUID(arenaId));

            if (error) {
              results.errors.push(`Arena ${arenaId} - ${tableName}: ${error.message}`);
              console.error(`  ❌ Erro ao migrar ${tableName}:`, error);
            } else {
              results.success.push(`Arena ${arenaId} - ${tableName} (${data.length} registros)`);
              console.log(`  ✅ ${tableName} migrado com sucesso`);
            }
          } catch (error: any) {
            results.errors.push(`Arena ${arenaId} - ${tableName}: ${error.message}`);
            console.error(`  ❌ Erro ao processar ${tableName}:`, error);
          }
        }
      } catch (error: any) {
        results.errors.push(`Arena ${arenaId}: ${error.message}`);
        console.error(`❌ Erro ao processar arena ${arenaId}:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Sucesso: ${results.success.length} tabelas`);
    console.log(`⏭️  Ignoradas: ${results.skipped.length} tabelas`);
    console.log(`❌ Erros: ${results.errors.length} tabelas`);
    console.log('='.repeat(60));

    if (results.success.length > 0) {
      console.log('\n✅ Migradas com sucesso:');
      results.success.forEach(msg => console.log(`  - ${msg}`));
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      results.errors.forEach(msg => console.log(`  - ${msg}`));
    }

    return results;
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    throw error;
  }
}

export async function testSupabaseConnection(): Promise<boolean> {
  console.log('🔌 Testando conexão com Supabase...');
  
  try {
    const { data, error } = await supabaseApi.select('plans', 'all');
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    console.log(`📊 Planos encontrados: ${data?.length || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}
