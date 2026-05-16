import { helpers } from "ytdlp-nodejs";
import { existsSync, mkdirSync, copyFileSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const binDir = join(projectRoot, "bin");

if (!existsSync(binDir)) mkdirSync(binDir, { recursive: true });

console.log("Downloading yt-dlp binary...");
const downloadedPath = await helpers.downloadYtDlp();
console.log(`Downloaded to: ${downloadedPath}`);

const destName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const destPath = join(binDir, destName);

copyFileSync(downloadedPath, destPath);
if (process.platform !== "win32") chmodSync(destPath, 0o755);

console.log(`yt-dlp ready at: ${destPath}`);
