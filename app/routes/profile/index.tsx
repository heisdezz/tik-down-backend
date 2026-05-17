import type { LoaderFunctionArgs } from "react-router";
import { YtDlp } from "ytdlp-nodejs";
import { existsSync } from "fs";
import { writeFile, chmod } from "fs/promises";
import { join } from "path";

// Pick the right yt-dlp binary for the current platform/arch
function getDownloadUrl(): string {
  if (process.platform === "win32")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
  if (process.arch === "arm64")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64";
  if (process.arch === "arm")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_armv7l";
  return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
}

// On Vercel, process.cwd() (/var/task) is read-only. /tmp is the only writable dir.
const binaryPath =
  process.platform === "win32"
    ? join(process.cwd(), "bin", "yt-dlp.exe")
    : "/tmp/yt-dlp";

// Defer instantiation until after the binary is confirmed present on disk.
let ytdlp: YtDlp | null = null;

let initPromise: Promise<void> | null = null;
function ensureYtDlp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!existsSync(binaryPath)) {
        console.log(`[yt-dlp] downloading for ${process.platform}/${process.arch}…`);
        const url = getDownloadUrl();
        const res = await fetch(url);
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

const TTL = 5 * 60 * 1000;
const cache = new Map<string, { lines: string[]; expiresAt: number }>();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const profile = searchParams.get("u");
  const limit = Number(searchParams.get("limit")) || undefined;

  if (!profile) {
    return Response.json(
      { error: "Missing required query param: ?u=<username|url>" },
      { status: 400 },
    );
  }

  let profileUrl: string;

  if (profile.startsWith("https://")) {
    let parsed: URL;
    try {
      parsed = new URL(profile);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }
    if (!parsed.hostname.endsWith("tiktok.com")) {
      return Response.json(
        { error: "URL must be a tiktok.com link" },
        { status: 400 },
      );
    }
    profileUrl = profile;
  } else {
    const username = profile.startsWith("@") ? profile.slice(1) : profile;
    if (!/^[a-zA-Z0-9_.]{1,24}$/.test(username)) {
      return Response.json(
        {
          error:
            "Invalid TikTok username — must be 1–24 characters (letters, numbers, _ or .)",
        },
        { status: 400 },
      );
    }
    profileUrl = `https://www.tiktok.com/@${username}`;
  }

  try {
    await ensureYtDlp();
  } catch (err: any) {
    console.error("[ensureYtDlp] failed:", err?.message ?? err);
    return Response.json(
      { error: "Failed to initialize yt-dlp", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }

  const cacheKey = `${profileUrl}::${limit ?? ""}`;
  const cached = cache.get(cacheKey);

  const encoder = new TextEncoder();

  if (!cached || cached.expiresAt <= Date.now()) {
    // Probe with a single item to confirm the profile exists before streaming
    let probeHit = false;
    try {
      await ytdlp!.execAsync(profileUrl, {
        flatPlaylist: true,
        dumpJson: true,
        playlistEnd: 1,
        onData: () => {
          probeHit = true;
        },
      });
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      console.error("[yt-dlp probe] error:", msg);
      const isNotFound =
        msg.includes("does not exist") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("Unable to find");
      return Response.json(
        {
          error: isNotFound ? "TikTok profile not found" : "Failed to reach TikTok",
          detail: msg,
        },
        { status: isNotFound ? 404 : 502 },
      );
    }
    if (!probeHit) {
      return Response.json(
        { error: "Profile exists but has no public videos" },
        { status: 404 },
      );
    }
  }

  if (cached && cached.expiresAt > Date.now()) {
    const stream = new ReadableStream({
      start(controller) {
        for (const line of cached.lines) {
          controller.enqueue(encoder.encode(line + "\n"));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson", "X-Cache": "HIT" },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      let buffer = "";
      const collected: string[] = [];

      ytdlp
        .execAsync(profileUrl, {
          flatPlaylist: true,
          dumpJson: true,
          ...(limit ? { playlistEnd: limit } : {}),
          onData: (chunk) => {
            buffer += chunk;
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (line.trim()) {
                collected.push(line);
                controller.enqueue(encoder.encode(line + "\n"));
              }
            }
          },
        })
        .then(() => {
          if (buffer.trim()) {
            collected.push(buffer);
            controller.enqueue(encoder.encode(buffer + "\n"));
          }
          cache.set(cacheKey, {
            lines: collected,
            expiresAt: Date.now() + TTL,
          });
          controller.close();
        })
        .catch((err) => controller.error(err));
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "X-Cache": "MISS" },
  });
};
