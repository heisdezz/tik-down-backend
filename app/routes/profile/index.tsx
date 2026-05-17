import type { LoaderFunctionArgs } from "react-router";
import { YtDlp } from "ytdlp-nodejs";
import { join } from "path";

const binaryPath = join(
  process.cwd(),
  "bin",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

const ytdlp = new YtDlp({ binaryPath });

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
    profileUrl = profile;
  } else {
    const username = profile.startsWith("@") ? profile.slice(1) : profile;
    profileUrl = `https://www.tiktok.com/@${username}`;
  }

  const cacheKey = `${profileUrl}::${limit ?? ""}`;
  const cached = cache.get(cacheKey);

  const encoder = new TextEncoder();

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
