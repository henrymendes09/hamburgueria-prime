export const publicUserSelect = { name: true, email: true, phone: true, cpf: true } as const;
export type PublicUser = { name: string; email: string; phone: string | null; cpf: string | null };
export function toPublicUser(user: PublicUser): PublicUser {
  const { name, email, phone, cpf } = user;
  return { name, email, phone, cpf };
}
