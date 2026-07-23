import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const commercialPlans = [
  {
    name: "Plano Básico",
    description: "Para começar a vender diretamente aos seus clientes.",
    monthlyPrice: 99.9,
    yearlyPrice: 999,
    launchMonthlyPrice: 79.9,
    launchSlots: 20,
    maxUsers: 3,
    features: [
      "Loja online personalizada",
      "Cardápio, adicionais e pedidos",
      "Cupons e promoções",
      "Gestão de clientes",
    ],
  },
  {
    name: "Plano Profissional",
    description: "Para operações em crescimento que precisam de mais controle.",
    monthlyPrice: 179.9,
    yearlyPrice: 1799,
    launchMonthlyPrice: 149.9,
    launchSlots: 20,
    maxUsers: 10,
    features: [
      "Tudo do Plano Básico",
      "Domínio próprio",
      "Painel financeiro",
      "Gestão ampliada da equipe",
      "Personalização completa",
    ],
  },
  {
    name: "Plano Premium",
    description: "Para hamburguerias com equipes e operação maiores.",
    monthlyPrice: 299.9,
    yearlyPrice: 2999,
    launchMonthlyPrice: 249.9,
    launchSlots: 20,
    maxUsers: null,
    features: [
      "Tudo do Plano Profissional",
      "Usuários ilimitados",
      "Gestão de entregadores",
      "Relatórios completos",
      "Atendimento prioritário",
    ],
  },
];

async function main() {
  const plans = await prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
  if (plans.length !== commercialPlans.length) {
    throw new Error(`Esperados 3 planos existentes; encontrados ${plans.length}.`);
  }

  for (const [index, plan] of plans.entries()) {
    await prisma.plan.update({ where: { id: plan.id }, data: commercialPlans[index] });
  }

  console.log("Planos comerciais atualizados com preços mensal, anual e de lançamento.");
}

main().finally(() => prisma.$disconnect());
