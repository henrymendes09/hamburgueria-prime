import { z } from "zod";
import { CARD_BRANDS, isCardPayment } from "@/lib/payment-options";
const password = z.string().min(10, "Use uma senha com pelo menos 10 caracteres").max(72).refine(value => new TextEncoder().encode(value).length <= 72, "Senha muito longa");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome completo").max(100),
    email: z.string().trim().email("Email inválido").max(254).toLowerCase(),
    phone: z.string().min(10, "Telefone inválido").max(30),
    password,
    confirmPassword: z.string().max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha").max(256),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido").max(254).toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().max(100).regex(/^v2\.[a-f0-9]{64}$/, "Link inválido ou expirado"),
    password,
    confirmPassword: z.string().max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  label: z.string().min(1).max(100).default("Casa"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(2, "Informe a rua").max(200),
  number: z.string().min(1, "Informe o número").max(20),
  complement: z.string().max(200).optional(),
  neighborhood: z.string().min(1, "Informe o bairro").max(100),
  city: z.string().min(1, "Informe a cidade").max(100),
  state: z.string().length(2, "UF").toUpperCase(),
  reference: z.string().max(300).optional(),
  isDefault: z.boolean().optional(),
});

export const cardSchema = z.object({
  brand: z.enum(["VISA", "MASTERCARD", "ELO", "AMEX", "OUTRO"]),
  holderName: z.string().trim().min(2, "Informe o nome impresso no cartão").max(100),
  last4: z.string().regex(/^\d{4}$/, "Informe somente os últimos 4 dígitos"),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 30),
}).strict();

export const checkoutSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10, "Telefone inválido").max(30),
  cpf: z.string().max(14).optional(),
  deliveryType: z.enum(["ENTREGA", "RETIRADA"]),
  addressId: z.string().max(64).optional(),
  newAddress: addressSchema.optional(),
  scheduledFor: z.string().max(40).refine(value => !value || Number.isFinite(Date.parse(value)), "Data inválida").optional(),
  paymentMethod: z.enum(["PIX", "PIX_ENTREGA", "CREDITO", "DEBITO", "DINHEIRO"]),
  paymentCardBrand: z.enum(CARD_BRANDS).optional(),
  changeFor: z.coerce.number().finite().min(0).max(100000).optional(),
  notes: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
}).superRefine((data, ctx) => {
  if (isCardPayment(data.paymentMethod) && !data.paymentCardBrand) ctx.addIssue({ code: "custom", path: ["paymentCardBrand"], message: "Selecione a bandeira do cartão." });
  if (!isCardPayment(data.paymentMethod) && data.paymentCardBrand) ctx.addIssue({ code: "custom", path: ["paymentCardBrand"], message: "Bandeira disponível apenas para pagamento com cartão." });
  if (data.paymentMethod !== "DINHEIRO" && data.changeFor !== undefined) ctx.addIssue({ code: "custom", path: ["changeFor"], message: "Troco disponível apenas para dinheiro." });
});

export const productSchema = z.object({
  name: z.string().min(2, "Informe o nome do produto"),
  description: z.string().min(5, "Informe a descrição"),
  ingredients: z.string().min(2, "Liste os ingredientes"),
  image: z.string().min(1, "Envie uma imagem"),
  price: z.coerce.number().positive("Preço deve ser maior que zero").max(100000),
  promoPrice: z.coerce.number().positive().max(100000).optional().nullable(),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  addonIds: z.array(z.string().min(1).max(64)).max(50).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  icon: z.string().min(1),
  order: z.coerce.number().int().min(0).max(10000).optional(),
});

export const addonSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0).max(100000),
  type: z.enum(["EXTRA", "REMOVER", "PONTO"]),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Código muito curto").toUpperCase(),
  type: z.enum(["PERCENTUAL", "VALOR"]),
  value: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().max(1000000).optional().nullable(),
  minOrderValue: z.coerce.number().min(0).max(100000).optional(),
  expiresAt: z.string().min(1, "Informe a validade").max(40).refine(value => Number.isFinite(Date.parse(value)), "Data inválida"),
  singleUsePerUser: z.boolean().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3, "Escreva um comentário").max(2000),
});

export const DELIVERY_FEE = 7.9;
export const FREE_DELIVERY_THRESHOLD = 89.9;
