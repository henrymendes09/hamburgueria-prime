import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function menuImage(name: string): string {
  return `/images/menu/products/${slugify(name)}.webp`;
}

async function main() {
  console.log("Limpando banco de dados...");
  await prisma.orderStatusLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productAddon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.category.deleteMany();
  await prisma.card.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando categorias...");
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Hambúrguer", slug: "hamburguer", icon: "🍔", order: 1 } }),
    prisma.category.create({ data: { name: "Combos", slug: "combos", icon: "🍟", order: 2 } }),
    prisma.category.create({ data: { name: "Batatas", slug: "batatas", icon: "🥔", order: 3 } }),
    prisma.category.create({ data: { name: "Bebidas", slug: "bebidas", icon: "🥤", order: 4 } }),
    prisma.category.create({ data: { name: "Sobremesas", slug: "sobremesas", icon: "🍰", order: 5 } }),
  ]);
  const [catBurger, catCombo, catFries, catDrink, catDessert] = categories;

  console.log("Criando adicionais...");
  const [bacon, cheddarExtra, ovo, cebolaCaramelizada, molhoBarbecue, catupiry] = await Promise.all([
    prisma.addon.create({ data: { name: "Bacon crocante", price: 6, type: "EXTRA" } }),
    prisma.addon.create({ data: { name: "Cheddar extra", price: 5, type: "EXTRA" } }),
    prisma.addon.create({ data: { name: "Ovo", price: 4, type: "EXTRA" } }),
    prisma.addon.create({ data: { name: "Cebola caramelizada", price: 4.5, type: "EXTRA" } }),
    prisma.addon.create({ data: { name: "Molho barbecue", price: 3, type: "EXTRA" } }),
    prisma.addon.create({ data: { name: "Catupiry", price: 5.5, type: "EXTRA" } }),
  ]);
  const [cebola, tomate, picles, alface] = await Promise.all([
    prisma.addon.create({ data: { name: "cebola", price: 0, type: "REMOVER" } }),
    prisma.addon.create({ data: { name: "tomate", price: 0, type: "REMOVER" } }),
    prisma.addon.create({ data: { name: "picles", price: 0, type: "REMOVER" } }),
    prisma.addon.create({ data: { name: "alface", price: 0, type: "REMOVER" } }),
  ]);
  const [malPassado, aoPonto, bemPassado] = await Promise.all([
    prisma.addon.create({ data: { name: "Mal passado", price: 0, type: "PONTO" } }),
    prisma.addon.create({ data: { name: "Ao ponto", price: 0, type: "PONTO" } }),
    prisma.addon.create({ data: { name: "Bem passado", price: 0, type: "PONTO" } }),
  ]);

  const burgerAddonIds = [bacon.id, cheddarExtra.id, ovo.id, cebolaCaramelizada.id, molhoBarbecue.id, catupiry.id, cebola.id, tomate.id, picles.id, alface.id, malPassado.id, aoPonto.id, bemPassado.id];

  console.log("Criando 30 hambúrgueres...");
  const burgerNames: [string, string, string][] = [
    ["Prime Clássico", "O smash original: carne 150g, queijo prato, alface, tomate e maionese da casa.", "pão brioche, carne 150g, queijo prato, alface, tomate, maionese da casa"],
    ["Prime Bacon", "Duplo smash com bacon crocante e cheddar derretido.", "pão brioche, 2x carne 100g, bacon, queijo cheddar, cebola roxa"],
    ["Prime Cheddar Melt", "Explosão de cheddar cremoso com cebola caramelizada.", "pão brioche, carne 150g, cheddar cremoso, cebola caramelizada"],
    ["Prime BBQ", "Molho barbecue defumado, onion rings e queijo prato.", "pão brioche, carne 150g, onion rings, queijo prato, molho barbecue"],
    ["Prime Duplo Smash", "Dois discos de carne smash na chapa, queijo americano em dobro.", "pão brioche, 2x carne 100g, 2x queijo americano, picles, mostarda e ketchup"],
    ["Prime Egg", "Carne suculenta com ovo caipira e maionese trufada.", "pão brioche, carne 150g, ovo caipira, queijo prato, maionese trufada"],
    ["Prime Costela", "Carne de costela desfiada com queijo coalho grelhado.", "pão brioche, costela desfiada 150g, queijo coalho, cebola roxa"],
    ["Prime Catupiry", "Catupiry original derretido sobre carne smash.", "pão brioche, carne 150g, catupiry, tomate, rúcula"],
    ["Prime Picanha", "Blend de picanha grelhado no ponto, com queijo prato.", "pão brioche, blend de picanha 160g, queijo prato, cebola roxa"],
    ["Prime Frango Crispy", "Filé de frango empanado crocante com maionese de ervas.", "pão brioche, filé de frango empanado, alface, maionese de ervas"],
    ["Prime Veggie", "Hambúrguer de grão de bico e legumes grelhados.", "pão integral, hambúrguer de grão de bico, rúcula, tomate seco, maionese vegana"],
    ["Prime Fumaça", "Carne defumada na hora com queijo gouda.", "pão brioche, carne defumada 150g, queijo gouda, cebola crispy"],
    ["Prime Trufado", "Maionese trufada, cogumelos salteados e queijo brie.", "pão brioche, carne 150g, cogumelos salteados, queijo brie, maionese trufada"],
    ["Prime Texano", "Bacon extra, onion rings e molho barbecue picante.", "pão brioche, carne 150g, bacon extra, onion rings, molho barbecue picante"],
    ["Prime Mexicano", "Guacamole, pico de gallo e jalapeño.", "pão brioche, carne 150g, guacamole, pico de gallo, jalapeño, queijo prato"],
    ["Prime Suíço", "Queijo suíço derretido com cebola caramelizada.", "pão brioche, carne 150g, queijo suíço, cebola caramelizada"],
    ["Prime do Chef", "Criação especial da casa com molho secreto.", "pão brioche, carne 180g, queijo cheddar, bacon, ovo, molho secreto da casa"],
    ["Prime Duplo Bacon", "Dobro de bacon crocante para quem não abre mão.", "pão brioche, carne 150g, bacon em dobro, queijo prato"],
    ["Prime Rústico", "Pão australiano e carne 180g grelhada na brasa.", "pão australiano, carne 180g, queijo prato, rúcula, tomate seco"],
    ["Prime Barbecue Bacon", "Combinação clássica de bacon com molho barbecue.", "pão brioche, carne 150g, bacon, molho barbecue, cebola crispy"],
    ["Prime Cogumelos", "Cogumelos salteados na manteiga com queijo suíço.", "pão brioche, carne 150g, cogumelos salteados, queijo suíço"],
    ["Prime Apimentado", "Geleia de pimenta artesanal com queijo prato.", "pão brioche, carne 150g, geleia de pimenta, queijo prato, cebola roxa"],
    ["Prime Angus", "Blend 100% Angus grelhado no ponto perfeito.", "pão brioche, blend Angus 180g, queijo cheddar, picles"],
    ["Prime Caprese", "Muçarela de búfala, tomate confit e manjericão.", "pão australiano, carne 150g, muçarela de búfala, tomate confit, manjericão"],
    ["Prime do Mar", "Hambúrguer de camarão empanado com maionese de limão.", "pão brioche, hambúrguer de camarão, alface americana, maionese de limão"],
    ["Prime Bold", "Duplo smash, duplo cheddar, duplo bacon — para quem tem fome de verdade.", "pão brioche, 2x carne 120g, 2x queijo cheddar, 2x bacon"],
    ["Prime Original Kids", "Versão mini para os pequenos, sem pimenta.", "pão brioche, carne 90g, queijo prato, ketchup"],
    ["Prime Gorgonzola", "Queijo gorgonzola cremoso com nozes caramelizadas.", "pão brioche, carne 150g, gorgonzola, nozes caramelizadas, mel"],
    ["Prime Black", "Pão preto no carvão ativado com carne 180g.", "pão preto, carne 180g, queijo cheddar, cebola roxa, molho especial"],
    ["Prime Signature", "O topo de linha da casa: tudo que a Prime tem de melhor.", "pão brioche, carne 200g, bacon, cheddar, ovo, cebola caramelizada, molho secreto"],
  ];

  const burgers = [];
  for (let i = 0; i < burgerNames.length; i++) {
    const [name, description, ingredients] = burgerNames[i];
    const price = 24.9 + (i % 10) * 2.5;
    const hasPromo = i % 4 === 0;
    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        description,
        ingredients,
        image: menuImage(name),
        price: Number(price.toFixed(2)),
        promoPrice: hasPromo ? Number((price * 0.85).toFixed(2)) : null,
        categoryId: catBurger.id,
        available: true,
        featured: i < 8,
        soldCount: Math.floor(Math.random() * 300) + 20,
        rating: Number((4.3 + Math.random() * 0.7).toFixed(1)),
      },
    });
    await prisma.productAddon.createMany({
      data: burgerAddonIds.map((addonId) => ({ productId: product.id, addonId })),
    });
    burgers.push(product);
  }

  console.log("Criando 20 bebidas...");
  const drinkNames: [string, number][] = [
    ["Coca-Cola Lata 350ml", 6.5],
    ["Coca-Cola Zero Lata 350ml", 6.5],
    ["Guaraná Antarctica Lata 350ml", 6],
    ["Guaraná Zero Lata 350ml", 6],
    ["Fanta Laranja Lata 350ml", 6],
    ["Sprite Lata 350ml", 6],
    ["Água Mineral 500ml", 4],
    ["Água com Gás 500ml", 4.5],
    ["Suco de Laranja Natural 400ml", 9.9],
    ["Suco de Maracujá Natural 400ml", 9.9],
    ["Suco de Uva Natural 400ml", 9.9],
    ["Limonada Suíça 400ml", 10.9],
    ["Milk-shake de Chocolate 400ml", 16.9],
    ["Milk-shake de Morango 400ml", 16.9],
    ["Milk-shake de Ovomaltine 400ml", 18.9],
    ["Chá Gelado Limão 400ml", 7.9],
    ["Cerveja Artesanal IPA 350ml", 14.9],
    ["Cerveja Artesanal Pilsen 350ml", 12.9],
    ["Energético Lata 350ml", 10.9],
    ["Refrigerante Guaraná 2L", 14.9],
  ];
  const drinks = [];
  for (let i = 0; i < drinkNames.length; i++) {
    const [name, price] = drinkNames[i];
    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        description: "Gelado e pronto para acompanhar seu lanche.",
        ingredients: name,
        image: menuImage(name),
        price,
        categoryId: catDrink.id,
        available: true,
        featured: i < 2,
        soldCount: Math.floor(Math.random() * 400) + 30,
        rating: Number((4.4 + Math.random() * 0.6).toFixed(1)),
      },
    });
    drinks.push(product);
  }

  console.log("Criando batatas...");
  const friesNames: [string, string, number][] = [
    ["Batata Frita Prime", "Porção generosa de batatas crocantes por fora e macias por dentro.", 16.9],
    ["Batata com Cheddar e Bacon", "Batatas cobertas com cheddar cremoso e bacon crocante.", 22.9],
    ["Batata Rústica", "Batatas com casca temperadas com ervas finas.", 18.9],
    ["Onion Rings", "Anéis de cebola empanados e crocantes.", 19.9],
    ["Batata Doce Frita", "Batata doce crocante com toque de canela.", 17.9],
  ];
  const fries = [];
  for (let i = 0; i < friesNames.length; i++) {
    const [name, description, price] = friesNames[i];
    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        description,
        ingredients: "batata, sal, temperos da casa",
        image: menuImage(name),
        price,
        categoryId: catFries.id,
        available: true,
        featured: i === 1,
        soldCount: Math.floor(Math.random() * 250) + 20,
        rating: Number((4.2 + Math.random() * 0.7).toFixed(1)),
      },
    });
    fries.push(product);
  }

  console.log("Criando 15 sobremesas...");
  const dessertNames: [string, string, number][] = [
    ["Brownie com Sorvete", "Brownie de chocolate quente com bola de sorvete de creme.", 18.9],
    ["Petit Gateau", "Bolo de chocolate com recheio cremoso e sorvete.", 19.9],
    ["Cheesecake de Frutas Vermelhas", "Cheesecake cremoso com calda de frutas vermelhas.", 17.9],
    ["Sorvete 2 Bolas", "Sorvete artesanal, sabores a escolher.", 12.9],
    ["Milk-shake de Doce de Leite", "Cremoso milk-shake com doce de leite argentino.", 17.9],
    ["Torta de Limão", "Torta gelada de limão com merengue maçaricado.", 15.9],
    ["Mousse de Maracujá", "Mousse aerado de maracujá com calda da fruta.", 13.9],
    ["Banana Split", "Banana, sorvete, calda de chocolate e chantilly.", 16.9],
    ["Waffle com Nutella", "Waffle crocante com Nutella e morangos.", 19.9],
    ["Churros com Doce de Leite", "Churros crocantes recheados com doce de leite.", 14.9],
    ["Bolo de Cenoura com Chocolate", "Fatia generosa de bolo de cenoura com cobertura de chocolate.", 12.9],
    ["Pudim de Leite Condensado", "Clássico pudim cremoso com calda de caramelo.", 11.9],
    ["Cookie Recheado Quente", "Cookie gigante recheado com chocolate, servido quente.", 13.9],
    ["Açaí na Tigela", "Açaí cremoso com granola, banana e leite condensado.", 16.9],
    ["Torta Holandesa", "Fatia de torta holandesa com camadas de chocolate crocante.", 15.9],
  ];
  const desserts = [];
  for (let i = 0; i < dessertNames.length; i++) {
    const [name, description, price] = dessertNames[i];
    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        description,
        ingredients: "ingredientes selecionados da casa",
        image: menuImage(name),
        price,
        categoryId: catDessert.id,
        available: true,
        featured: i < 2,
        soldCount: Math.floor(Math.random() * 200) + 15,
        rating: Number((4.3 + Math.random() * 0.6).toFixed(1)),
      },
    });
    desserts.push(product);
  }

  console.log("Criando 15 combos...");
  const comboNames = [
    "Combo Prime Clássico", "Combo Prime Bacon", "Combo Prime Cheddar Melt", "Combo Prime BBQ",
    "Combo Duplo Smash", "Combo Prime Egg", "Combo Prime Costela", "Combo Prime Catupiry",
    "Combo Prime Picanha", "Combo Frango Crispy", "Combo Prime Veggie", "Combo Prime Fumaça",
    "Combo Prime Trufado", "Combo Prime Texano", "Combo Família Prime (4 lanches)",
  ];
  const combos = [];
  for (let i = 0; i < comboNames.length; i++) {
    const name = comboNames[i];
    const burger = burgers[i % burgers.length];
    const isFamily = name.includes("Família");
    const price = isFamily ? 129.9 : 39.9 + (i % 5) * 3;
    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        description: isFamily
          ? "4 hambúrgueres, 2 porções de batata grande e 4 refrigerantes — perfeito para compartilhar."
          : `${burger.name} + batata frita média + refrigerante lata.`,
        ingredients: isFamily
          ? "4 hambúrgueres da casa, batata frita, refrigerante"
          : `${burger.name}, batata frita, refrigerante`,
        image: menuImage(name),
        price: Number(price.toFixed(2)),
        promoPrice: i % 3 === 0 ? Number((price * 0.9).toFixed(2)) : null,
        categoryId: catCombo.id,
        available: true,
        featured: i < 4,
        soldCount: Math.floor(Math.random() * 220) + 25,
        rating: Number((4.4 + Math.random() * 0.5).toFixed(1)),
      },
    });
    combos.push(product);
  }

  console.log("Criando 10 cupons promocionais...");
  const couponDefs = [
    { code: "BEMVINDO10", type: "PERCENTUAL" as const, value: 10, minOrderValue: 0 },
    { code: "PRIME15", type: "PERCENTUAL" as const, value: 15, minOrderValue: 50 },
    { code: "FRETE0", type: "VALOR" as const, value: 7.9, minOrderValue: 40 },
    { code: "COMBO5OFF", type: "VALOR" as const, value: 5, minOrderValue: 30 },
    { code: "PRIME20", type: "PERCENTUAL" as const, value: 20, minOrderValue: 80 },
    { code: "SEXTAPRIME", type: "PERCENTUAL" as const, value: 12, minOrderValue: 0 },
    { code: "DOBRO10", type: "VALOR" as const, value: 10, minOrderValue: 60 },
    { code: "NOVOCLIENTE", type: "PERCENTUAL" as const, value: 25, minOrderValue: 0 },
    { code: "SOBREMESA5", type: "VALOR" as const, value: 5, minOrderValue: 25 },
    { code: "MEGAPRIME30", type: "PERCENTUAL" as const, value: 30, minOrderValue: 100 },
  ];
  for (const c of couponDefs) {
    await prisma.coupon.create({
      data: {
        ...c,
        maxUses: 500,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        singleUsePerUser: true,
      },
    });
  }

  console.log("Criando contas de acesso (admin, entregador, clientes)...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador Prime",
      email: "admin@hamburgueriaprime.com.br",
      passwordHash: adminPassword,
      role: "ADMIN",
      phone: "(12) 99999-0000",
    },
  });

  const entregadorPassword = await bcrypt.hash("entrega123", 10);
  const entregador = await prisma.user.create({
    data: {
      name: "Carlos Entregador",
      email: "entregador@hamburgueriaprime.com.br",
      passwordHash: entregadorPassword,
      role: "ENTREGADOR",
      phone: "(12) 98888-1111",
    },
  });

  const customerNames = [
    "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Alves", "Elaine Ferreira",
    "Felipe Costa", "Gabriela Rocha", "Henrique Dias", "Isabela Martins", "João Pedro Silva",
    "Karina Nunes", "Lucas Barbosa", "Mariana Teixeira", "Nathan Ribeiro", "Olívia Cardoso",
  ];
  const customerPassword = await bcrypt.hash("cliente123", 10);
  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i];
    const email = `${slugify(name)}@email.com`;
    const customer = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: customerPassword,
        role: "CLIENTE",
        phone: `(12) 9${String(7000 + i * 111).padStart(8, "0")}`,
        lastAccess: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: "Casa",
        cep: "12245-000",
        street: `Rua das Flores, ${100 + i}`,
        number: `${100 + i}`,
        neighborhood: "Jardim Aquarius",
        city: "São José dos Campos",
        state: "SP",
        isDefault: true,
      },
    });
    customers.push(customer);
  }

  console.log("Criando pedidos fictícios...");
  const allProducts = [...burgers, ...drinks, ...fries, ...desserts, ...combos];
  const statuses: ("ENTREGUE" | "SAIU_PARA_ENTREGA" | "PREPARANDO" | "ACEITO" | "RECEBIDO" | "CANCELADO")[] = [
    "ENTREGUE", "ENTREGUE", "ENTREGUE", "ENTREGUE", "SAIU_PARA_ENTREGA", "PREPARANDO", "ACEITO", "RECEBIDO", "CANCELADO",
  ];
  const paymentMethods: ("PIX" | "CARTAO" | "DINHEIRO")[] = ["PIX", "CARTAO", "DINHEIRO"];

  for (let i = 0; i < 45; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const address = await prisma.address.findFirst({ where: { userId: customer.id } });
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const chosenProducts = Array.from({ length: numItems }, () => allProducts[Math.floor(Math.random() * allProducts.length)]);
    const subtotal = chosenProducts.reduce((sum, p) => sum + (p.promoPrice ?? p.price), 0);
    const deliveryFee = subtotal >= 89.9 ? 0 : 7.9;
    const total = subtotal + deliveryFee;
    const createdAt = new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        number: 100 + i,
        userId: customer.id,
        addressId: address?.id,
        status,
        deliveryType: "ENTREGA",
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: status === "ENTREGUE" ? "PAGO" : "PENDENTE",
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        createdAt,
        updatedAt: createdAt,
        deliveredAt: status === "ENTREGUE" ? createdAt : null,
        entregadorId: status === "ENTREGUE" || status === "SAIU_PARA_ENTREGA" ? entregador.id : null,
        items: {
          create: chosenProducts.map((p) => ({
            productId: p.id,
            productName: p.name,
            quantity: 1,
            unitPrice: p.promoPrice ?? p.price,
          })),
        },
        statusLog: { create: { status, createdAt } },
      },
    });
    void order;
  }

  console.log("Criando avaliações...");
  const reviewComments = [
    "Melhor hambúrguer que já comi em São José dos Campos! Chega sempre quentinho.",
    "Entrega super rápida e o ponto da carne ficou perfeito. Recomendo muito.",
    "Atendimento excelente e o combo vale muito a pena.",
    "As batatas são as melhores da região, sempre crocantes.",
    "Já virou tradição pedir aqui toda sexta-feira com a família.",
    "Qualidade impecável, dá pra sentir que os ingredientes são frescos.",
  ];
  for (let i = 0; i < reviewComments.length; i++) {
    await prisma.review.create({
      data: {
        userId: customers[i % customers.length].id,
        rating: 5,
        comment: reviewComments[i],
      },
    });
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("——————————————————————————————");
  console.log("Contas de teste criadas:");
  console.log(`Admin:       ${admin.email} / admin123`);
  console.log(`Entregador:  ${entregador.email} / entrega123`);
  console.log(`Cliente:     ${customers[0].email} / cliente123`);
  console.log("——————————————————————————————");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
