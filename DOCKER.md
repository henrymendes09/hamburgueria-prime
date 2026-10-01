# Desenvolvimento local com Docker

Com Docker Desktop em execução, abra o PowerShell nesta pasta.

Na primeira configuração, crie `.env.docker` com `AUTH_SECRET` aleatório
(32 bytes ou mais). Não coloque credenciais de produção neste arquivo.
O ambiente desta máquina já foi configurado.

```powershell
docker compose up -d --build
```

Acesse http://localhost:3000. Node.js e PostgreSQL executam nos contêineres.
O banco não publica uma porta para o Windows. A aplicação fica disponível
somente nesta máquina. O serviço `setup` cria o schema atual e adiciona dados
de demonstração sem apagar dados existentes. Ele deve terminar com código 0.

Contas locais:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@hamburgueriaprime.com.br | admin123 |
| Entregador | entregador@hamburgueriaprime.com.br | entrega123 |
| Cliente | ana-souza@email.com | cliente123 |

```powershell
# Ver estado e logs
docker compose ps -a
docker compose logs --tail 80 app setup

# Parar sem apagar os dados
docker compose down

# Iniciar novamente
docker compose up -d
```

Depois de editar o código, execute `docker compose up -d --build` para
atualizar a imagem. O código está copiado na imagem, sem sincronização ao vivo.
Os dados do PostgreSQL e uploads ficam em volumes persistentes.
Não use `docker compose down -v` se quiser preservá-los.

Este ambiente é de desenvolvimento. Login Google, Mercado Pago e Vercel Blob
não estão configurados. O seed antigo (`npm run db:seed`) não é usado: além de
apagar registros, ele não inclui os vínculos de restaurante do schema atual.
O Compose utiliza `scripts/seed-docker.ts`, restrito ao banco Docker local.

## Acessar um banco existente

Crie `.env.remote` nesta pasta com a conexão PostgreSQL do ambiente publicado:

```dotenv
DATABASE_URL="postgresql://USUARIO:SENHA@HOST/BANCO?sslmode=require"
```

Não compartilhe esse arquivo ou envie as credenciais ao GitHub. Ele já está
ignorado pelo Git e pelo contexto de build do Docker.

Após conferir as credenciais, execute:

```powershell
docker compose -f compose.remote.yaml up -d app
```

Essa configuração substitui somente a aplicação local, usando a mesma porta.
Não executa `db push`, migrations ou seed no banco existente. O banco Docker
local continua preservado. Os usuários e senhas passam a ser os do banco remoto.
Operações na aplicação (incluindo login e alterações no painel) podem gravar
no banco publicado. Dados externos como arquivos do Blob e pagamentos exigem
suas próprias configurações; a conexão ao banco não restaura essas integrações.

Para voltar ao banco local:

```powershell
docker compose up -d app
```
