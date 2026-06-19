import { useState } from "react";

export default function FacebookTest() {
  const [url, setUrl] = useState("");
  const [cookies, setCookies] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!url) return;
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u: url, ...(cookies ? { fb_cookies: cookies } : {}) }),
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

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "";
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const thumb =
    result?.thumbnail ?? result?.thumbnails?.[result?.thumbnails?.length - 1]?.url;

  // Only real downloadable formats (with a URL and a video/audio extension)
  const formats: any[] = (result?.formats ?? []).filter(
    (f: any) => f.url && f.ext && f.ext !== "mhtml",
  );

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Facebook Endpoint Test</h1>

      <div className="space-y-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Video URL</span>
          </label>
          <input
            className="input input-bordered w-full"
            placeholder="https://www.facebook.com/watch/?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Cookies (optional — for private videos)</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full font-mono text-xs h-20"
            placeholder="c_user=...; xs=...; datr=..."
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
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
            <div className="card-body p-4 gap-1 min-w-0">
              <p className="font-medium text-sm leading-snug line-clamp-2">
                {result.title ?? result.id}
              </p>
              {result.uploader && (
                <p className="text-xs text-base-content/60">{result.uploader}</p>
              )}
              <div className="flex gap-2 mt-1 flex-wrap">
                {result.duration != null && (
                  <span className="badge badge-ghost badge-sm">
                    {formatDuration(result.duration)}
                  </span>
                )}
                {result.view_count != null && (
                  <span className="badge badge-ghost badge-sm">
                    {result.view_count.toLocaleString()} views
                  </span>
                )}
              </div>
            </div>
          </div>

          {formats.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-base-content/50">
                {formats.length} format{formats.length !== 1 ? "s" : ""}
              </p>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Quality</th>
                      <th>Ext</th>
                      <th>Size</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formats.map((f, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs">
                          {f.format_note ?? f.height ? `${f.height}p` : f.format_id}
                        </td>
                        <td className="text-xs">{f.ext}</td>
                        <td className="text-xs text-base-content/60">
                          {formatBytes(f.filesize ?? f.filesize_approx)}
                        </td>
                        <td>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-primary"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
