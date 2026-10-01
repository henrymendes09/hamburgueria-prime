# Segurança e publicação

Os pedidos usam preços e adicionais do catálogo no servidor. As alterações de
produtos, categorias, adicionais e pedidos são limitadas à loja da sessão.
O navegador recebe somente os campos necessários do perfil, sem hashes de senha.

As sessões consultam o estado atual da conta e são invalidadas quando a senha
muda ou a conta é bloqueada. Sessões anteriores a esta atualização exigem novo
login. Falhas na consulta de segurança negam o acesso.

A recuperação automática de senha permanece desativada até existir um canal
verificado de envio de e-mail. Nenhum token é devolvido publicamente e os tokens
antigos não são aceitos. A interface orienta o cliente a contatar a loja.

O limite de tentativas em produção usa PostgreSQL, compartilhado pelas instâncias
da Vercel. Antes de publicar esta atualização em um banco existente, execute
`npx tsx scripts/apply-security-migration.ts` com a conexão daquele ambiente.
O script cria somente a tabela de limites e seu índice, e invalida tokens antigos;
não executa seed, reset ou db push. A migration correspondente está em `prisma/migrations`.

Uploads exigem administrador autenticado, mesma origem, limites de tamanho e
decodificação real. Imagens são regravadas como WebP estático. Webhooks exigem
segredo configurado, HMAC válido e timestamp recente; sem segredo são rejeitados.

Os cabeçalhos incluem CSP, proteção contra enquadramento e contra detecção
indevida de tipo. A CSP permite scripts inline necessários ao Next.js; isso não
substitui validação de entradas e revisão de componentes.

Valide alterações com `npm test`, `npm run lint`, `npx tsc --noEmit`,
`npm run build` e `npm audit`. O override de deepmerge-ts atualiza a dependência
de configuração do Prisma para a versão com correção de recursão abusiva.
Uma auditoria sem avisos conhecidos não garante ausência de vulnerabilidades.

Credenciais e evidências privadas de auditoria ficam fora do Git, do build Docker
e da publicação Vercel. A infraestrutura, as contas dos provedores e os segredos
de produção também precisam de revisão periódica.
