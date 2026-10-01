import sharp from "sharp";

export async function sanitizeImage(input: Buffer) {
  if (!input.length || input.length > 4 * 1024 * 1024) throw new Error("Imagem inválida (máximo 4 MB).");
  const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp", "gif"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
    throw new Error("Use uma imagem estática JPEG, PNG, WebP ou GIF.");
  }
  return image.rotate().resize(2048, 2048, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
}
