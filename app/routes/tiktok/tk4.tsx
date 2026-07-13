import type { ActionFunctionArgs } from "react-router";
import { TikTokDownloader } from "tk4-downloader";
import { parse as localParse } from "../../lib/parser";

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

  const { u: url } = body ?? {};
  if (!url) {
    return Response.json({ error: "Missing u in body" }, { status: 400 });
  }

  try {
    // Validate URL
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes("tiktok.com")) {
        return Response.json({ error: "URL must be a tiktok.com link" }, { status: 400 });
      }
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    const downloader = new TikTokDownloader({ debug: false });

    // Optionally listen for progress events if available — collect them for debug
    const progress: any[] = [];
    if (typeof (downloader as any).on === "function") {
      try {
        (downloader as any).on("progress", (p: any) => progress.push(p));
      } catch { }
    }

    // Run the download; tk4's API returns a result object (docs show result.url)
    let result: any;
    try {
      result = await downloader.downloadVideo(String(url));
    } catch (err: any) {
      return Response.json({ error: "Download failed", detail: String(err) }, { status: 502 });
    }

    // Parse the raw result with our local parser
    let parsed: any = null;
    try {
      parsed = await localParse(result);
    } catch (pErr: any) {
      parsed = { parseError: String(pErr) };
    }

    // Return the raw result, optional parsed output, and a short progress trace to aid testing
    return Response.json({ ok: true, parsed, progress });
  } catch (err: any) {
    return Response.json({ error: "Unexpected error", detail: String(err) }, { status: 500 });
  }
};
