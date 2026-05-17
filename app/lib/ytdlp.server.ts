import { YtDlp } from "ytdlp-nodejs";
import { existsSync } from "fs";
import { writeFile, chmod } from "fs/promises";
import { join } from "path";

function getDownloadUrl(): string {
  if (process.platform === "win32")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
  if (process.arch === "arm64")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64";
  if (process.arch === "arm")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_armv7l";
  return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";
}

export const binaryPath =
  process.platform === "win32"
    ? join(process.cwd(), "bin", "yt-dlp.exe")
    : process.env.VERCEL
      ? "/tmp/yt-dlp"
      : join(process.cwd(), "bin", "yt-dlp");

export let ytdlp: YtDlp | null = null;

let initPromise: Promise<void> | null = null;

export function ensureYtDlp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!existsSync(binaryPath)) {
        console.log(`[yt-dlp] downloading for ${process.platform}/${process.arch}…`);
        const res = await fetch(getDownloadUrl());
        if (!res.ok) throw new Error(`Failed to download yt-dlp: HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        await writeFile(binaryPath, Buffer.from(buf));
        await chmod(binaryPath, 0o755);
        console.log("[yt-dlp] binary ready at", binaryPath);
      }
      ytdlp = new YtDlp({ binaryPath });
    })();
  }
  return initPromise;
}
