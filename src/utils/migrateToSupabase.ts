import { supabaseApi } from '../lib/supabaseApi';

export async function migrateLocalStorageToSupabase() {
  console.log('🚀 Iniciando migração de dados do localStorage para Supabase...');
  
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

        console.log(`📦 Migrando ${tableName}: ${data.length} registros...`);
        const { error } = await supabaseApi.upsert(tableName, data, 'all');

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
      console.log(`\n📍 Migrando dados da arena: ${arenaId}`);
      
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
            console.log(`  📦 Migrando ${tableName}: ${data.length} registros...`);

            const { error } = await supabaseApi.upsert(tableName, data, arenaId);

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

export async function testSupabaseConnection() {
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
