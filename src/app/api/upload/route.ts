import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";
import { sanitizeImage } from "@/lib/image-security";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.blocked || session.user.role !== "ADMIN" || !session.user.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (Number(req.headers.get("content-length") || 0) > MAX_SIZE + 65536) return NextResponse.json({ error: "Arquivo muito grande." }, { status: 413 });
  const limited = await rateLimit(`upload:${session.user.restaurantId}`, { limit: 30, windowMs: 3600000 });
  if (!limited.success) return NextResponse.json({ error: "Aguarde antes de enviar mais imagens." }, { status: 429 });
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato de imagem não suportado." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 4MB)." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  let buffer: Buffer;
  try { buffer = await sanitizeImage(Buffer.from(bytes)); }
  catch { return NextResponse.json({ error: "Imagem inválida. Use uma imagem estática de até 4 MB." }, { status: 400 }); }
  const filename = `${crypto.randomUUID()}.webp`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`restaurants/${session.user.restaurantId}/${filename}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
    });
    return NextResponse.json({ url: blob.url });
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Armazenamento de imagens ainda não configurado." }, { status: 503 });
  }
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
