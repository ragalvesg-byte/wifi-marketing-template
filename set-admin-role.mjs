import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.NEW_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Erro: Defina as variáveis de ambiente NEW_SUPABASE_URL e NEW_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TARGET_EMAIL = 'rag.alvesg@gmail.com';

async function main() {
  console.log('=== Configuração de Role Administrativa ===');
  console.log(`Buscando usuário: ${TARGET_EMAIL}`);

  // 1. Listar usuários cadastrados no Auth para localizar o ID correspondente
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao buscar lista de usuários:', listError.message);
    process.exit(1);
  }

  const targetUser = listData?.users?.find(u => u.email === TARGET_EMAIL);

  if (!targetUser) {
    console.error(`Erro: Usuário ${TARGET_EMAIL} não foi encontrado na base do Supabase.`);
    console.error('Por favor, cadastre o usuário pelo painel Authentication > Users antes de rodar o script.');
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log('Usuário encontrado com sucesso.');

  // 2. Atualizar o app_metadata para definir a role como 'admin'
  console.log('Atualizando app_metadata.role para "admin"...');
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      role: 'admin'
    }
  });

  if (updateError) {
    console.error('Erro ao atualizar usuário:', updateError.message);
    process.exit(1);
  }

  // 3. Validar a atualização com getUserById
  const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(userId);

  if (verifyError) {
    console.error('Erro ao verificar atualização de role:', verifyError.message);
    process.exit(1);
  }

  const role = verifyData.user?.app_metadata?.role;
  if (role === 'admin') {
    console.log('✅ Sucesso! app_metadata.role = "admin" configurado com sucesso.');
  } else {
    console.error(`❌ Erro: A role não foi configurada corretamente. Valor atual: "${role}"`);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('⚠️  ATENÇÃO: Se o usuário já estava logado no painel administrativo,');
  console.log('   o token JWT atual dele não contém a role "admin" atualizada.');
  console.log('   É OBRIGATÓRIO fazer logout e realizar um novo login para renovar o JWT.');
  console.log('========================================================================\n');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
