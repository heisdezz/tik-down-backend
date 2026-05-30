import type { ActionFunctionArgs } from "react-router";
import { writeFile } from "fs/promises";
import { ensureYtDlp, ytdlp } from "../../lib/ytdlp.server";

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
    return Response.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const { u: url, tt_session_id } = body ?? {};

  if (!tt_session_id) {
    return Response.json(
      { error: "cookies/session auth required — pass tt_session_id in body" },
      { status: 401 },
    );
  }
  if (!url) {
    return Response.json({ error: "Missing u (video URL) in body" }, { status: 400 });
  }

  const sessionId = decodeURIComponent(String(tt_session_id));

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("tiktok.com")) {
      return Response.json({ error: "URL must be a tiktok.com link" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  let cookiesPath: string;
  try {
    await ensureYtDlp();
    cookiesPath = await writeCookies(sessionId);
  } catch (err: any) {
    return Response.json(
      { error: "Failed to initialize yt-dlp", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }

  try {
    let resultJson = "";
    await ytdlp!.execAsync(url, {
      dumpJson: true,
      cookies: cookiesPath,
      addHeaders: { "Referer": "https://www.tiktok.com/", "Accept-Language": "en-US,en;q=0.9" },
      onData: (chunk) => {
        resultJson += chunk;
      },
    });

    if (!resultJson.trim()) {
      throw new Error("No data returned from yt-dlp");
    }

    const data = JSON.parse(resultJson);
    return Response.json(data);
  } catch (err: any) {
    console.error("[tiktok download] error:", err);
    return Response.json(
      { error: "Failed to fetch video metadata", detail: err?.message ?? String(err) },
      { status: 502 },
    );
  }
};
