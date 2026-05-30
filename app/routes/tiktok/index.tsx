import type { ActionFunctionArgs } from "react-router";
import { writeFile } from "fs/promises";
import { ensureYtDlp, ytdlp } from "../../lib/ytdlp.server";

const TTL = 5 * 60 * 1000;
const cache = new Map<string, { lines: string[]; expiresAt: number }>();

async function writeCookies(sessionId: string): Promise<string> {
  const path = `/tmp/tt_cookies_${Buffer.from(sessionId).toString("base64url").slice(0, 16)}.txt`;
  const content = [
    "# Netscape HTTP Cookie File",
    `.tiktok.com\tTRUE\t/\tTRUE\t2147483647\tsessionid\t${sessionId}`,
  ].join("\n");
  await writeFile(path, content);
  return path;
}

export const loader = async () =>
  Response.json({ error: "Method not allowed — use POST" }, { status: 405 });

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const { u: profile, limit: rawLimit, tt_session_id } = body ?? {};
  const limit = Number(rawLimit) || undefined;

  if (!profile) {
    return Response.json({ error: "Missing u in body" }, { status: 400 });
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

  let cookiesPath: string | undefined;
  try {
    await ensureYtDlp();
    if (tt_session_id) {
      const sessionId = decodeURIComponent(String(tt_session_id));
      cookiesPath = await writeCookies(sessionId);
    }
  } catch (err: any) {
    console.error("[tiktok init] failed:", err?.message ?? err);
    return Response.json(
      {
        error: "Failed to initialize yt-dlp",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }

  const cacheKey = `tiktok::${tt_session_id ? String(tt_session_id).slice(-8) : "anon"}::${profileUrl}::${limit ?? ""}`;
  const cached = cache.get(cacheKey);
  const encoder = new TextEncoder();

  if (!cached || cached.expiresAt <= Date.now()) {
    let probeHit = false;
    try {
      const options: any = {
        flatPlaylist: true,
        dumpJson: true,
        playlistEnd: 1,
        addHeaders: {
          Referer: "https://www.tiktok.com/",
          "Accept-Language": "en-US,en;q=0.9",
        },
        onData: () => {
          probeHit = true;
        },
      };
      if (cookiesPath) {
        options.cookies = cookiesPath;
      }

      await ytdlp!.execAsync(profileUrl, options);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      console.error("[tiktok probe] error:", msg);
      const isNotFound =
        msg.includes("does not exist") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("Unable to find");
      return Response.json(
        {
          error: isNotFound
            ? "TikTok profile not found"
            : "Failed to reach TikTok",
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
        for (const line of cached.lines)
          controller.enqueue(encoder.encode(line + "\n"));
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

      const options: any = {
        flatPlaylist: true,
        dumpJson: true,
        addHeaders: {
          Referer: "https://www.tiktok.com/",
          "Accept-Language": "en-US,en;q=0.9",
        },
        ...(limit ? { playlistEnd: limit } : {}),
        onData: (chunk: string) => {
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
      };
      if (cookiesPath) {
        options.cookies = cookiesPath;
      }

      ytdlp!
        .execAsync(profileUrl, options)
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
