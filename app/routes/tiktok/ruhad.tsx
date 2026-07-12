import { useState } from "react";

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
      const res = await fetch("/tiktok/ruhad-api", {
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

  const data = result?.data;
  const downloads: Array<[string, string]> = data?.download
    ? Object.entries(data.download).filter(([, v]) => typeof v === "string" && v)
        .map(([k, v]) => [k, v as string])
    : [];

  const labels: Record<string, string> = {
    no_watermark: "No watermark",
    watermark: "Watermark",
    music: "Audio",
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

      {data && (
        <div className="space-y-4">
          <div className="card card-side bg-base-200 shadow-sm overflow-hidden">
            <figure className="w-40 shrink-0 bg-base-300">
              {data.thumbnail ? (
                <img
                  src={data.thumbnail}
                  alt=""
                  className="w-40 h-full object-cover"
                />
              ) : (
                <div className="w-40 h-24 flex items-center justify-center text-base-content/20 text-xs">
                  no thumb
                </div>
              )}
            </figure>
            <div className="card-body p-4 gap-2 min-w-0">
              <p className="font-medium text-sm leading-snug line-clamp-3">
                {data.title}
              </p>
              {data.owner?.nickname && (
                <p className="text-xs text-base-content/60">
                  {data.owner.nickname} (@{data.owner.username})
                </p>
              )}
              {data.stats && (
                <div className="flex gap-2 flex-wrap">
                  {data.stats.plays != null && (
                    <span className="badge badge-ghost badge-sm">
                      {data.stats.plays.toLocaleString()} plays
                    </span>
                  )}
                  {data.stats.likes != null && (
                    <span className="badge badge-ghost badge-sm">
                      {data.stats.likes.toLocaleString()} likes
                    </span>
                  )}
                  {data.stats.comments != null && (
                    <span className="badge badge-ghost badge-sm">
                      {data.stats.comments.toLocaleString()} comments
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {downloads.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {downloads.map(([key, link]) => (
                <a
                  key={key}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  {labels[key] ?? key}
                </a>
              ))}
            </div>
          )}

          <details className="collapse collapse-arrow bg-base-200">
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
