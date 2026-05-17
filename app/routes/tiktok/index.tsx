import type { LoaderFunctionArgs } from "react-router";
import { ensureYtDlp, ytdlp } from "../../lib/ytdlp.server";

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

  const cacheKey = `tiktok::${profileUrl}::${limit ?? ""}`;
  const cached = cache.get(cacheKey);
  const encoder = new TextEncoder();

  if (!cached || cached.expiresAt <= Date.now()) {
    let probeHit = false;
    try {
      await ytdlp!.execAsync(profileUrl, {
        flatPlaylist: true,
        dumpJson: true,
        playlistEnd: 1,
        addHeaders: ["Referer:https://www.tiktok.com/", "Accept-Language:en-US,en;q=0.9"],
        onData: () => { probeHit = true; },
      });
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      console.error("[tiktok probe] error:", msg);
      const isNotFound =
        msg.includes("does not exist") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("Unable to find");
      return Response.json(
        { error: isNotFound ? "TikTok profile not found" : "Failed to reach TikTok", detail: msg },
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
          addHeaders: ["Referer:https://www.tiktok.com/", "Accept-Language:en-US,en;q=0.9"],
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
