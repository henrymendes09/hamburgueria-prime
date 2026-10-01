import { expect, it } from "vitest";
import { toPublicUser, publicUserSelect } from "./public-user";
it("never transfers credential fields to client components", () => {
  const record = { name: "Teste", email: "test@example.invalid", phone: null, cpf: null, passwordHash: "private", isPlatformAdmin: true };
  expect(toPublicUser(record)).toEqual({ name: record.name, email: record.email, phone: null, cpf: null });
  expect(publicUserSelect).not.toHaveProperty("passwordHash");
});
