import type { LoaderFunctionArgs } from "react-router";
import { YtDlp } from "ytdlp-nodejs";
import { join } from "path";

const binaryPath = join(
  process.cwd(),
  "bin",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

const ytdlp = new YtDlp({ binaryPath });

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let buffer = "";

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
                controller.enqueue(encoder.encode(line + "\n"));
              }
            }
          },
        })
        .then(() => {
          if (buffer.trim()) controller.enqueue(encoder.encode(buffer + "\n"));
          controller.close();
        })
        .catch((err) => controller.error(err));
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
};
