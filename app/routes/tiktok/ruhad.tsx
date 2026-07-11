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
    return Response.json(result);
  } catch (err: any) {
    console.error("[ruhad tiktok] error:", err);
    return Response.json(
      { error: "Failed to fetch video", detail: err?.message ?? String(err) },
      { status: 502 },
    );
  }
};

export default function RuhadTikTokTest() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!url) return;
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/tiktok/ruhad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u: url }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail ?? body.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult(body);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // The package returns a { data, metadata } shape; dig out common fields defensively.
  const data = result?.data ?? result;
  const videoUrl =
    data?.videoUrl ?? data?.video ?? data?.url ?? data?.play ?? data?.hdplay;
  const thumb = data?.thumbnail ?? data?.cover ?? data?.thumb;
  const title = data?.title ?? data?.desc ?? data?.caption;

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

      {result && (
        <div className="space-y-4">
          <div className="card card-side bg-base-200 shadow-sm overflow-hidden">
            <figure className="w-40 shrink-0 bg-base-300">
              {thumb ? (
                <img src={thumb} alt="" className="w-40 h-full object-cover" />
              ) : (
                <div className="w-40 h-24 flex items-center justify-center text-base-content/20 text-xs">
                  no thumb
                </div>
              )}
            </figure>
            <div className="card-body p-4 gap-2 min-w-0">
              {title && (
                <p className="font-medium text-sm leading-snug line-clamp-3">
                  {title}
                </p>
              )}
              {videoUrl ? (
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-primary"
                  >
                    Open video
                  </a>
                  <a href={videoUrl} download className="btn btn-sm btn-outline">
                    Download
                  </a>
                </div>
              ) : (
                <p className="text-xs text-base-content/50">
                  No video URL in response — see raw JSON.
                </p>
              )}
            </div>
          </div>

          <details className="collapse collapse-arrow bg-base-200" open>
            <summary className="collapse-title text-sm font-medium">
              Raw JSON
            </summary>
            <div className="collapse-content">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
