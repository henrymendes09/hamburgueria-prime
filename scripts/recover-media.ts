import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { get } from "@vercel/blob";
import { decryptBackup } from "../src/lib/backup-crypto";

// Extracts media to a local directory. Does not write or overwrite production objects.
async function main() {
  const [snapshotPath, outputPath] = process.argv.slice(2);
  const secret = process.env.BACKUP_ENCRYPTION_KEY;
  const token = process.env.BACKUP_READ_WRITE_TOKEN;
  if (!snapshotPath || !outputPath || !secret || !token) throw new Error("Missing snapshot, output directory or backup credentials");
  const snapshot = JSON.parse(decryptBackup(readFileSync(snapshotPath), secret).toString());
  if (snapshot.version !== 1 || !Array.isArray(snapshot.media)) throw new Error("Snapshot has no media manifest");
  const root = resolve(outputPath);
  for (const media of snapshot.media as { originalPath: string; backupPath: string }[]) {
    const target = resolve(root, media.originalPath);
    const path = relative(root, target);
    if (!path || path.startsWith("..") || !media.backupPath.startsWith("media/restaurants/")) throw new Error("Unsafe media path");
    const stored = await get(media.backupPath, { access: "private", token, useCache: false });
    if (!stored || stored.statusCode !== 200) throw new Error("Media unavailable");
    const decrypted = decryptBackup(Buffer.from(await new Response(stored.stream).arrayBuffer()), secret);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, decrypted, { flag: "wx" });
  }
  console.log(JSON.stringify({ recoveredImages: snapshot.media.length }));
}
main().catch(() => { console.error("Media recovery failed; existing files are never overwritten."); process.exitCode = 1; });
