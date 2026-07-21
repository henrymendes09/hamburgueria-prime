# 🍔 Hamburgueria Prime

Aplicação full stack completa de delivery para hamburgueria, construída com Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM e Auth.js (NextAuth v5).

> **Identidade visual:** preto, vermelho e branco — tipografia condensada (Anton) para títulos e Inter para texto, com uma assinatura visual de "borda rasgada" (estilo embalagem de lanchonete) e selos rotacionados.

---

## ⚡ Como rodar o projeto

### Pré-requisitos
- Node.js 20+
- npm

### Passo a passo

```bash
# 1. Instale as dependências
npm install

# 2. Gere o Prisma Client (roda automaticamente no passo 1 via "postinstall",
#    mas pode rodar manualmente se precisar)
npx prisma generate

# 3. Crie o banco de dados SQLite local e as tabelas
npx prisma db push

# 4. Popule o banco com dados de demonstração
#    (30 hambúrgueres, 20 bebidas, 15 sobremesas, 15 combos, 10 cupons,
#    15 clientes fictícios, ~45 pedidos fictícios e contas de teste)
npm run db:seed

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse **http://localhost:3000**

> Se `npx prisma generate` ou `db push` falharem por causa de firewall/proxy corporativo, é porque esses comandos baixam os "engines" do Prisma de `binaries.prisma.sh` na primeira execução. Em uma rede doméstica ou CI normal isso funciona sem configuração extra.

---

## 🔑 Contas de teste (criadas pelo seed)

| Papel | Email | Senha |
|---|---|---|
| Administrador | `admin@hamburgueriaprime.com.br` | `admin123` |
| Entregador | `entregador@hamburgueriaprime.com.br` | `entrega123` |
| Cliente | `ana-souza@email.com` | `cliente123` |

- Painel administrativo: **http://localhost:3000/admin**
- Área do entregador: **http://localhost:3000/entregador**

Todos os outros clientes fictícios seguem o padrão `nome-sobrenome@email.com` / `cliente123` (veja `prisma/seed.ts` para a lista completa).

---

## 🧩 O que está implementado (de verdade, sem mocks)

### Loja (site público)
- Home com hero, categorias, produtos em destaque, banner de promoção, depoimentos e mapa (Google Maps embed)
- Cardápio com abas por categoria, busca e modal de customização (remover ingredientes, adicionar extras, ponto da carne, observações, quantidade)
- Carrinho lateral persistente (Zustand + localStorage) com cupom, frete grátis acima de R$ 89,90 e cálculo de total em tempo real
- Cadastro/Login (credenciais + Google OAuth opcional), recuperação de senha
- Checkout completo: dados pessoais, endereço (com autopreenchimento por CEP via ViaCEP), entrega/retirada, agendamento, Pix/Cartão/Dinheiro com troco
- Acompanhamento de pedido em tempo real (polling a cada 4s) com linha do tempo animada
- Área do cliente: perfil, histórico de pedidos, favoritos, endereços, cartões salvos (últimos 4 dígitos apenas — CVV nunca é armazenado)
- Sobre, Contato (formulário funcional), Promoções, FAQ
- SEO: metadata dinâmico, Open Graph, sitemap.xml, robots.txt

### Painel administrativo (`/admin`)
- Login exclusivo com verificação de papel (role)
- Dashboard com estatísticas (pedidos hoje, em andamento, faturamento, clientes) e gráficos (Recharts)
- **Gestão de pedidos em tempo real** via Server-Sent Events (SSE) — novos pedidos tocam um alerta sonoro gerado via Web Audio API (sem arquivo de áudio externo) e aparecem instantaneamente, sem precisar recarregar a página
- Fluxo de status: Novo → Aceito/Recusado → Preparando → Saiu para entrega → Entregue/Cancelado
- Gestão de cardápio: produtos, categorias e adicionais (CRUD completo, upload de imagem real salvo em `/public/uploads`)
- Gestão de cupons (percentual ou valor fixo, limite de usos, validade, uso único por cliente)
- Gestão de clientes (bloquear/desbloquear)
- Financeiro: relatórios, produtos mais vendidos, exportação em CSV (abre no Excel) e PDF (via impressão do navegador)
- Gestão de equipe (criar contas de administrador e entregador)

### Área do entregador (`/entregador`)
- Login exclusivo
- Lista de entregas atribuídas, aceitar/finalizar entrega, link direto para rota no Google Maps

### Backend
- Server Actions para tudo (sem API REST desnecessária): checkout, cupons, pedidos, produtos, clientes, endereços, cartões, favoritos/avaliações
- Autenticação com Auth.js v5 (JWT), senha com bcrypt, roles (CLIENTE/ADMIN/ENTREGADOR)
- Middleware protegendo `/admin`, `/perfil`, `/checkout`, `/entregador`
- Rate limiting em memória para login, cadastro, checkout e formulário de contato
- Validação de dados com Zod em todas as entradas

---

## ⚠️ Limitações conhecidas (transparência total)

Este projeto é 100% funcional no fluxo que **não depende de serviços externos pagos**. Os pontos abaixo dependem de credenciais que só você pode fornecer:

| Funcionalidade | Status | O que falta |
|---|---|---|
| Login com Google | Código completo, desligado por padrão | Preencher `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` |
| Cobrança real via Pix/Cartão | Fluxo de pedido funciona, pagamento fica como "pendente" | Integrar um gateway (Mercado Pago, Stripe, etc.) — a estrutura já está pronta em `src/actions/checkout.ts` para receber isso |
| Recuperação de senha por email | Token gerado e funcional, mas exibido na tela em vez de enviado por email | Configurar um provedor de email (Resend, SendGrid, SMTP) — o ponto de integração está em `src/actions/auth.ts` |
| Chat online | Não implementado (fora do escopo desta primeira entrega) | — |

Nenhuma dessas limitações envolve "funcionalidade simulada": o que está implementado funciona de ponta a ponta com banco de dados real; o que falta são apenas credenciais de serviços de terceiros que só você pode gerar.

---

## 🗄️ Banco de dados

Por padrão usa **SQLite** (`prisma/dev.db`), zero configuração. Para produção, troque para PostgreSQL:

1. Em `prisma/schema.prisma`, mude `provider = "sqlite"` para `provider = "postgresql"`
2. Em `.env`, aponte `DATABASE_URL` para sua instância Postgres (Neon, Supabase, RDS, etc.)
3. Rode `npx prisma generate && npx prisma db push` novamente

---

## 📁 Estrutura do projeto

```
src/
  actions/          Server Actions (checkout, produtos, cupons, pedidos, etc.)
  app/
    (site)/         Rotas públicas: home, cardápio, checkout, perfil...
    admin/           Painel administrativo (protegido por middleware)
    entregador/      Área do entregador (protegido por middleware)
    api/             Rotas de API: upload de imagem, SSE, status de pedido
  components/
    ui/              Componentes de base (botão, input, dialog, etc.)
    site/            Componentes da loja
    admin/           Componentes do painel admin
  lib/               Prisma client, auth, utils, validações, rate limit
  types/             Tipos compartilhados
prisma/
  schema.prisma      Modelo de dados completo
  seed.ts            Script de dados de demonstração
```

---

## 🚀 Scripts disponíveis

```bash
npm run dev          # Ambiente de desenvolvimento
npm run build        # Build de produção
npm run start         # Servidor de produção
npm run lint          # ESLint
npm run db:generate   # Gera o Prisma Client
npm run db:push       # Sincroniza o schema com o banco
npm run db:seed       # Popula o banco com dados de demonstração
npm run db:studio     # Abre o Prisma Studio (interface visual do banco)
```
