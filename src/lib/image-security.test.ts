import { expect, it } from "vitest";
import sharp from "sharp";
import { sanitizeImage } from "./image-security";
it("rejects disguised active content and oversized files", async () => {
  await expect(sanitizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'))).rejects.toThrow();
  await expect(sanitizeImage(Buffer.from("<script>alert(1)</script>"))).rejects.toThrow();
  await expect(sanitizeImage(Buffer.alloc(4 * 1024 * 1024 + 1))).rejects.toThrow();
});
it("decodes and rewrites real images as static WebP", async () => {
  const source = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().toBuffer();
  expect((await sharp(await sanitizeImage(source)).metadata()).format).toBe("webp");
});
