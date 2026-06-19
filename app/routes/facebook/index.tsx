import type { ActionFunctionArgs } from "react-router";
import { writeFile } from "fs/promises";
import { ensureYtDlp, ytdlp } from "../../lib/ytdlp.server";

function parseCookieString(cookieStr: string): Array<[string, string]> {
  return cookieStr
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf("=");
      return [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()] as [string, string];
    });
}

async function writeCookies(cookieStr: string): Promise<string> {
  const pairs = parseCookieString(cookieStr);
  const lines = [
    "# Netscape HTTP Cookie File",
    ...pairs.map(([name, value]) => `.facebook.com\tTRUE\t/\tTRUE\t2147483647\t${name}\t${value}`),
  ];
  const hash = Buffer.from(cookieStr).toString("base64url").slice(0, 16);
  const path = `/tmp/fb_cookies_${hash}.txt`;
  await writeFile(path, lines.join("\n"));
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

  const { u: url, fb_cookies } = body ?? {};

  if (!url) {
    return Response.json({ error: "Missing u (video URL) in body" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const validHosts = ["facebook.com", "fb.watch"];
    if (!validHosts.some((h) => parsed.hostname.endsWith(h))) {
      return Response.json(
        { error: "URL must be a facebook.com or fb.watch link" },
        { status: 400 },
      );
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  let cookiesPath: string | undefined;
  try {
    await ensureYtDlp();
    if (fb_cookies) {
      cookiesPath = await writeCookies(String(fb_cookies));
    }
  } catch (err: any) {
    return Response.json(
      { error: "Failed to initialize yt-dlp", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }

  try {
    let resultJson = "";
    const options: any = {
      dumpJson: true,
      addHeaders: {
        Referer: "https://www.facebook.com/",
        "Accept-Language": "en-US,en;q=0.9",
      },
      onData: (chunk: string) => {
        resultJson += chunk;
      },
    };
    if (cookiesPath) {
      options.cookies = cookiesPath;
    }

    await ytdlp!.execAsync(url, options);

    if (!resultJson.trim()) {
      throw new Error("No data returned from yt-dlp");
    }

    const data = JSON.parse(resultJson);
    return Response.json(data);
  } catch (err: any) {
    console.error("[facebook] error:", err);
    const msg: string = err?.message ?? "";
    const needsAuth =
      msg.includes("login") || msg.includes("private") || msg.includes("permission");
    return Response.json(
      {
        error: needsAuth
          ? "Video is private or requires login — pass fb_cookies in body"
          : "Failed to fetch video metadata",
        detail: msg,
      },
      { status: needsAuth ? 401 : 502 },
    );
  }
};
