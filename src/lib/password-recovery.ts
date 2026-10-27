import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export function resetTokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issuePasswordReset(email: string, deliver: (email: string, token: string) => Promise<void>) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, blocked: true, passwordHash: true } });
  if (!user || user.blocked || !user.passwordHash) return;
  const token = `v2.${randomBytes(32).toString("hex")}`;
  const digest = resetTokenDigest(token);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.create({ data: { userId: user.id, token: digest, expires: new Date(Date.now() + 30 * 60000) } });
  });
  try { await deliver(user.email, token); }
  catch {
    await prisma.passwordResetToken.deleteMany({ where: { token: digest } });
    // Never log the email, bearer token, delivery payload or provider response.
    console.error("password_reset_delivery_failed");
  }
}

export async function consumePasswordReset(token: string, password: string) {
  if (!/^v2\.[a-f0-9]{64}$/.test(token)) return false;
  const digest = resetTokenDigest(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { token: digest }, include: { user: { select: { blocked: true } } } });
  if (!record || record.expires <= new Date() || record.user.blocked) return false;
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${record.userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: record.userId }, select: { blocked: true } });
    if (!user || user.blocked) return false;
    const consumed = await tx.passwordResetToken.deleteMany({ where: { token: digest, expires: { gt: new Date() } } });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
    // Existing JWTs are revoked by the credentialVersion check on their next request.
    return true;
  });
}
