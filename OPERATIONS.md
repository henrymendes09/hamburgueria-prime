# Operação e recuperação

Aplicação: https://hamburgueria-prime.vercel.app

## Configuração e estado

- Imagens: Vercel Blob público `hamburgueria-prime-images`. A API exige administrador da loja, valida a imagem e regrava WebP antes do upload. O domínio desse armazenamento está autorizado no Next Image.
- Backups: Vercel Blob **privado** `hamburgueria-prime-backups`, com chave própria `BACKUP_READ_WRITE_TOKEN`.
- `BACKUP_ENCRYPTION_KEY`: chave AES-256 de 32 bytes em base64. Não a substitua sem guardar a anterior: os arquivos antigos dependem dela.
- `CRON_SECRET`: autentica o backup e o diagnóstico operacional. Nenhum desses segredos deve usar prefixo `NEXT_PUBLIC_`.
- E-mail: envio por Gmail SMTP com `GMAIL_USER` e `GMAIL_APP_PASSWORD` (senha de app, guardada como Secret de produção). A recuperação só é habilitada quando essas variáveis estão configuradas. Usa tokens v2 aleatórios, hash no banco, expiração de 30 minutos, consumo único e revogação das sessões. O envio ocorre após a resposta para não revelar a existência de contas pelo tempo do SMTP; há limites por IP e endereço. Falhas de envio invalidam o token e não expõem dados do provedor.
- Pix: depende de credencial válida e `MERCADOPAGO_WEBHOOK_SECRET` na produção. Configure no Mercado Pago o tópico `payment` e a URL `/api/webhooks/mercado-pago`. A assinatura deve ser a fornecida pelo Mercado Pago, nunca um valor inventado.
- Monitoramento externo: Checkly conectado pela Vercel. `scripts/configure-monitoring.mjs` cria ou atualiza três verificações: cardápio, saúde do banco e idade do backup. Cada uma executa a cada 15 minutos e alerta por e-mail após duas falhas, com aviso de recuperação. O backup usa `MONITORING_SECRET`, uma credencial somente de leitura, separada do segredo que autoriza executar backups. Configure `CHECKLY_API_KEY`, `CHECKLY_ACCOUNT_ID`, `ALERT_EMAIL` e `MONITORING_SECRET` ao executar o script; não inclua seus valores no Git.

## Backups

`vercel.json` agenda `/api/cron/backup` todos os dias às 06:00 UTC (03:00 em Brasília). A Vercel envia o `CRON_SECRET` como Bearer. O horário pode variar conforme o plano da Vercel.

A cópia é uma transação PostgreSQL Repeatable Read das tabelas da aplicação; sessões, tokens de recuperação/verificação e limites temporários são excluídos. O arquivo JSON é comprimido e criptografado com AES-256-GCM antes de ser enviado ao armazenamento privado. O processo baixa e verifica o objeto antes de confirmar sucesso e expirar cópias anteriores a 30 dias.

Esse backup cobre o **banco** e as imagens enviadas ao armazenamento dedicado da aplicação. Cada imagem é copiada criptografada para o armazenamento privado e incluída no manifesto do snapshot. Imagens de URLs externas e imagens antigas embutidas como data URL não são copiadas como objetos: as referências e os data URLs continuam no backup do banco. Contas/configurações dos provedores não fazem parte do arquivo. O banco pode perder até aproximadamente 24 horas de alterações entre cópias diárias. Não há promessa de recuperação ponto a ponto.

As cópias de imagens são mantidas independentemente da retenção de 30 dias dos snapshots, para permitir recuperar objetos excluídos. Acompanhe o uso do armazenamento. Para extrair as imagens de uma cópia: `npx tsx scripts/recover-media.ts copia.hpb diretorio-vazio`, com as duas credenciais de backup configuradas. O script verifica a criptografia e salva apenas no disco local, sem substituir arquivos existentes. Antes de republicar objetos, valide o conteúdo e as URLs do ambiente de recuperação.

Guarde a chave de criptografia em um cofre externo à Vercel, junto de instruções de acesso ao armazenamento e às credenciais de operação. Existe uma cópia local ignorada pelo Git em `.env.backup-recovery`. Ela não deve ser enviada por chat nem incluída em commits.

## Testar e restaurar

1. Baixe o arquivo `.hpb` do armazenamento privado, com credenciais autorizadas.
2. Prepare **outro banco vazio** com a mesma versão do schema (`prisma db push` apenas nesse banco vazio).
3. Configure `RESTORE_DATABASE_URL` para esse banco e `BACKUP_ENCRYPTION_KEY` para a chave da cópia. Mantenha `DATABASE_URL` apontando ao banco de origem para a proteção contra restauração acidental.
4. Execute `npx tsx scripts/restore-backup.ts caminho/copia.hpb --confirm-empty-target`.
5. O script recusa tabelas preenchidas, insere na ordem das relações e compara contagens e conteúdo de cada tabela. Uma falha reverte a transação.
6. Valide login, catálogo, pedidos e relatórios no ambiente de recuperação antes de planejar uma troca do banco da aplicação. Não altere a conexão de produção durante o ensaio.

Em 27/10/2026, uma cópia real de 21 tabelas e 810 registros foi criptografada, baixada e restaurada em PostgreSQL 17 isolado. As contagens e os conteúdos coincidiram. A leitura anônima do arquivo privado retornou 403. Esse resultado é um ensaio, não garante disponibilidade futura; repita periodicamente.

## Saúde e incidentes

- `GET /api/health`: consulta o banco e retorna 200 ou 503, sem detalhes internos ou dados pessoais.
- `GET /api/health/backup`, com Bearer `MONITORING_SECRET`: retorna 200 se existe backup com menos de 36 horas, ou 503 se estiver atrasado/indisponível. Não expõe os objetos, segredos ou registros do banco.
- `GET /api/operations`, com Bearer `CRON_SECRET`: verifica banco, backup com menos de 36 horas, configuração de armazenamento/e-mail, credencial do Mercado Pago e presença da assinatura do webhook. Não retorna segredos. Consulte o resultado autenticado; não use esse segredo em ferramentas públicas.
- Nos logs da Vercel, procure `database_backup_failed`, `database_backup_completed`, `database_health_failed`, `password_reset_delivery_failed`, `password_reset_request_failed`, `payment_webhook_processing_failed`, `payment_reconciliation_failed` e `orphan_payment_compensation_failed`.
- Falha de release: identifique a última produção saudável e use o rollback da Vercel. A migration adiciona um valor ao enum de pagamentos e mantém compatibilidade com a versão anterior. Não reverta o banco apagando registros.
- Falha do banco: confira o provedor e o endpoint de saúde. Restaure em banco separado, valide e só então planeje a troca de conexão. Preserve a origem para diagnóstico.

## Funcionamento, avisos e histórico administrativo

Em `/admin/funcionamento`, configure fuso, dias, abertura/fechamento e intervalo estimado de entrega. Ative o recebimento somente após revisar os horários. Configuração ausente ou recebimento pausado mantém novos pedidos bloqueados; pedidos existentes continuam em operação. O cliente recebe um aviso ao entrar e vê uma faixa de situação atualizada a cada 30 segundos. A finalização valida horário no servidor e novamente dentro da transação, inclusive para agendamento (até sete dias). Fechamento anterior à abertura representa um turno que termina no dia seguinte.

Notificações de pedido são gravadas na mesma transação que cria/altera o pedido, por trigger do banco com unicidade por pedido/status. O cliente consulta `/perfil/notificacoes`; o aviso no site/PWA verifica atualizações a cada 15 segundos enquanto a página estiver visível. E-mails transacionais usam o SMTP já configurado, sem expor credenciais. Envios são executados após a resposta, com bloqueio de concorrência por dois minutos, até três tentativas e intervalo mínimo de cinco minutos. Consultas autenticadas e mudanças de status processam a fila; `/api/cron/notifications` faz uma recuperação diária às 05:00 UTC, autenticada por `CRON_SECRET`. A aceitação SMTP não comprova leitura ou entrega na caixa principal. Não há garantia de envio exatamente uma vez diante de falha entre a aceitação SMTP e a atualização do banco. Investigue registros `order_notification_email_failed` e linhas `emailStatus=FAILED` com três tentativas antes de repetir manualmente. O SMTP Gmail está sujeito aos limites da conta.

Histórico em `/admin/historico`: triggers registram mudanças de produtos, vínculos de adicionais, categorias, cupons, pedidos, equipe e configurações. As ações administrativas definem autor em contexto local da transação; automações aparecem como sistema. Valores anteriores/novos usam lista permitida de campos; demais mudanças registram apenas nomes dos campos, sem senhas, tokens ou credenciais. Registros anteriores à ativação não são reconstruídos. Não existe exclusão/edição desse histórico pela aplicação. Na restauração, `scripts/restore-backup.ts` ativa `app.restore_mode` somente na transação para preservar os registros do snapshot sem gerar histórico ou notificações adicionais.

## Relatórios financeiros

O relatório em `/admin/financeiro` usa data de criação do pedido, dias completos de Brasília e intervalo máximo de 366 dias. Exibe a situação atual, não um livro-caixa por data de liquidação: pagamentos recebidos em outra data aparecem no período de criação do pedido. O recebido inclui somente pedidos pagos e válidos; cancelados/recusados, estornos e pendências são separados. Frete, descontos, repasses e taxas de pagamento aparecem separadamente. Taxas do provedor/maquininha são informadas manualmente por pedido, com histórico; ausência permanece desconhecida. O saldo recebido menos taxas informadas e repasses não representa lucro. Totais e CSV cobrem o período completo; tabela de pedidos tem 50 linhas por página. Exportações protegem contra fórmulas em planilhas e permanecem restritas à loja autenticada.

## Processamento de pagamentos

O checkout atual oferece Pix online; cartão e dinheiro são pagos presencialmente na entrega/retirada, sem processamento online de cartão.

O Pix usa referência do pedido, chave de idempotência, validade de 60 minutos e URL de notificação. O webhook valida HMAC e consulta a API antes de atualizar o pedido. Moeda, valor e vínculo são conferidos. Consultas autenticadas do cliente também reconciliam pagamentos pendentes, com limite de frequência. O painel recusa aceitar Pix sem confirmação.

Cancelar/recusar um pedido Pix consulta o provedor, cancela cobranças pendentes ou solicita estorno de pagamentos aprovados com chave de idempotência estável. O pedido só muda após a confirmação do resultado. Falhas não são apresentadas como estornos concluídos. Não há lançamento de estorno automático para pagamentos presenciais: a devolução física depende da loja.

O ciclo foi testado com respostas controladas do provedor. A homologação financeira real/sandbox continua pendente de credenciais utilizáveis, webhook e contas de teste do Mercado Pago. Não considerar cobrança/estorno reais homologados antes desse teste. Em aplicação com várias lojas, confirme o recebedor de cada loja antes de vender: a configuração atual usa uma credencial de plataforma, sem divisão automática de recebíveis.
