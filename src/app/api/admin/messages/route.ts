import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.blocked || user.role !== "ADMIN" || !user.restaurantId) {
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const restaurantId = user.restaurantId;
  const headers = { "Cache-Control": "private, no-store" };
  if (params.get("view") !== "list") {
    const [unread, latest] = await Promise.all([
      prisma.contactMessage.count({ where: { restaurantId, read: false } }),
      prisma.contactMessage.findFirst({ where: { restaurantId, read: false }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } }),
    ]);
    return Response.json({ unread, latestId: latest?.id ?? null }, { headers });
  }
  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(10000, requestedPage)) : 1;
  const filter = params.get("filter");
  const where = { restaurantId, ...(filter === "unread" ? { read: false } : filter === "read" ? { read: true } : {}) };
  const [messages, count] = await prisma.$transaction([
    prisma.contactMessage.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20,
      select: { id: true, name: true, email: true, phone: true, subject: true, message: true, read: true, createdAt: true } }),
    prisma.contactMessage.count({ where }),
  ]);
  return Response.json({ messages, count, page }, { headers });
}
