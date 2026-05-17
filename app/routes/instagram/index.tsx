import type { LoaderFunctionArgs } from "react-router";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { ensureYtDlp, ytdlp } from "../../lib/ytdlp.server";

const COOKIES_PATH = "/tmp/ig_cookies.txt";
const TTL = 5 * 60 * 1000;
const cache = new Map<string, { lines: string[]; expiresAt: number }>();

async function ensureIgCookies() {
  if (existsSync(COOKIES_PATH)) return;
  const raw = process.env.ig_session_id;
  if (!raw) throw new Error("ig_session_id env var is not set");
  const sessionId = decodeURIComponent(raw);
  const cookieFile = [
    "# Netscape HTTP Cookie File",
    `.instagram.com\tTRUE\t/\tTRUE\t2147483647\tsessionid\t${sessionId}`,
  ].join("\n");
  await writeFile(COOKIES_PATH, cookieFile);
}

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
    if (!parsed.hostname.endsWith("instagram.com")) {
      return Response.json(
        { error: "URL must be an instagram.com link" },
        { status: 400 },
      );
    }
    profileUrl = profile;
  } else {
    const username = profile.startsWith("@") ? profile.slice(1) : profile;
    if (!/^[a-zA-Z0-9_.]{1,30}$/.test(username)) {
      return Response.json(
        {
          error:
            "Invalid Instagram username — must be 1–30 characters (letters, numbers, _ or .)",
        },
        { status: 400 },
      );
    }
    profileUrl = `https://www.instagram.com/${username}/`;
  }

  try {
    await Promise.all([ensureYtDlp(), ensureIgCookies()]);
  } catch (err: any) {
    console.error("[instagram init] failed:", err?.message ?? err);
    return Response.json(
      { error: "Failed to initialize", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }

  const cacheKey = `instagram::${profileUrl}::${limit ?? ""}`;
  const cached = cache.get(cacheKey);
  const encoder = new TextEncoder();

  if (!cached || cached.expiresAt <= Date.now()) {
    let probeHit = false;
    try {
      await ytdlp!.execAsync(profileUrl, {
        flatPlaylist: true,
        dumpJson: true,
        playlistEnd: 1,
        cookies: COOKIES_PATH,
        onData: () => { probeHit = true; },
      });
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      console.error("[instagram probe] error:", msg);
      const isNotFound =
        msg.includes("does not exist") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("Unable to find") ||
        msg.includes("login required");
      return Response.json(
        {
          error: isNotFound ? "Instagram profile not found or private" : "Failed to reach Instagram",
          detail: msg,
        },
        { status: isNotFound ? 404 : 502 },
      );
    }
    if (!probeHit) {
      return Response.json(
        { error: "Profile exists but has no public posts" },
        { status: 404 },
      );
    }
  }

  if (cached && cached.expiresAt > Date.now()) {
    const stream = new ReadableStream({
      start(controller) {
        for (const line of cached.lines) controller.enqueue(encoder.encode(line + "\n"));
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

      ytdlp!
        .execAsync(profileUrl, {
          flatPlaylist: true,
          dumpJson: true,
          cookies: COOKIES_PATH,
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
          cache.set(cacheKey, { lines: collected, expiresAt: Date.now() + TTL });
          controller.close();
        })
        .catch((err) => controller.error(err));
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "X-Cache": "MISS" },
  });
};
