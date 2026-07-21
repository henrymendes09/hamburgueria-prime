import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  label: z.string().min(1).default("Casa"),
  cep: z.string().min(8, "CEP inválido"),
  street: z.string().min(2, "Informe a rua"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Informe o bairro"),
  city: z.string().min(1, "Informe a cidade"),
  state: z.string().min(2, "UF"),
  reference: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const cardSchema = z.object({
  brand: z.enum(["VISA", "MASTERCARD", "ELO", "AMEX", "OUTRO"]),
  holderName: z.string().min(2, "Informe o nome impresso no cartão"),
  number: z.string().min(13, "Número do cartão inválido"),
  expMonth: z.coerce.number().min(1).max(12),
  expYear: z.coerce.number().min(new Date().getFullYear()),
  cvv: z.string().min(3).max(4),
});

export const checkoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().optional(),
  deliveryType: z.enum(["ENTREGA", "RETIRADA"]),
  addressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  scheduledFor: z.string().optional(),
  paymentMethod: z.enum(["PIX", "CARTAO", "DINHEIRO"]),
  changeFor: z.coerce.number().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Informe o nome do produto"),
  description: z.string().min(5, "Informe a descrição"),
  ingredients: z.string().min(2, "Liste os ingredientes"),
  image: z.string().min(1, "Envie uma imagem"),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  promoPrice: z.coerce.number().optional().nullable(),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  addonIds: z.array(z.string()).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  icon: z.string().min(1),
  order: z.coerce.number().optional(),
});

export const addonSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  type: z.enum(["EXTRA", "REMOVER", "PONTO"]),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Código muito curto").toUpperCase(),
  type: z.enum(["PERCENTUAL", "VALOR"]),
  value: z.coerce.number().positive(),
  maxUses: z.coerce.number().optional().nullable(),
  minOrderValue: z.coerce.number().optional(),
  expiresAt: z.string().min(1, "Informe a validade"),
  singleUsePerUser: z.boolean().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(3, "Escreva um comentário"),
});

export const DELIVERY_FEE = 7.9;
export const FREE_DELIVERY_THRESHOLD = 89.9;
