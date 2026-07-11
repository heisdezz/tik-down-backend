import { useState } from "react";
import type { ActionFunctionArgs } from "react-router";

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
    return Response.json({ error: "Missing u (video URL) in body" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Dynamic import keeps the server-only package out of the client bundle.
    const { alldl } = await import("rahad-all-downloader-v2");
    const result = await alldl.tiktok(url);
    const html = typeof result === "string" ? result : JSON.stringify(result);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("[ruhad tiktok] error:", err);
    return new Response(
      `<div style="color:red">Failed to fetch video: ${err?.message ?? String(err)}</div>`,
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
};

export default function RuhadTikTokTest() {
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!url) return;
    setHtml(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/tiktok/ruhad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u: url }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text || `HTTP ${res.status}`);
        return;
      }
      setHtml(text);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">TikTok Test — rahad-all-downloader-v2</h1>

      <div className="space-y-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Video URL</span>
          </label>
          <input
            className="input input-bordered w-full"
            placeholder="https://www.tiktok.com/@user/video/123..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={loading || !url}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Fetch"
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="break-all">{error}</span>
        </div>
      )}

      {html && (
        <div
          className="border border-base-300 rounded-lg p-4 bg-base-100 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
