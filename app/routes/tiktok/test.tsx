import { useState } from "react";

export default function ProfileTest() {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState("5");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!username) return;
    setResults([]);
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ u: username });
      const clampedLimit = Math.min(Number(limit) || 5, 50);
      params.set("limit", String(clampedLimit));

      const res = await fetch(`/tiktok?${params}`);
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) {
            try {
              setResults((prev) => [...prev, JSON.parse(line)]);
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Profile Endpoint Test</h1>

      <div className="flex gap-2 items-end flex-wrap">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Username / URL</span>
          </label>
          <input
            className="input input-bordered w-72"
            placeholder="@username or full URL"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Limit</span>
          </label>
          <input
            className="input input-bordered w-24"
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={loading || !username}
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
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-base-content/50">
            {results.length} video{results.length !== 1 ? "s" : ""} streamed
          </p>

          {results.map((item, i) => {
            const thumb =
              item.thumbnail ??
              item.thumbnails?.[item.thumbnails.length - 1]?.url;
            const url = item.webpage_url ?? item.url;

            return (
              <div
                key={i}
                className="card card-side bg-base-200 shadow-sm overflow-hidden"
              >
                {/* number badge */}
                <div className="flex items-center justify-center w-10 shrink-0 bg-base-300 text-base-content/40 font-mono text-sm font-bold">
                  {i + 1}
                </div>

                {/* thumbnail */}
                <figure className="w-24 shrink-0 bg-base-300">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="w-24 h-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-16 flex items-center justify-center text-base-content/20 text-xs">
                      no thumb
                    </div>
                  )}
                </figure>

                {/* info */}
                <div className="card-body p-3 gap-1 min-w-0">
                  <p className="font-medium text-sm leading-snug line-clamp-2">
                    {item.title ?? item.id}
                  </p>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary truncate hover:underline"
                    >
                      {url}
                    </a>
                  )}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {item.duration != null && (
                      <span className="badge badge-ghost badge-sm">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                    {item.view_count != null && (
                      <span className="badge badge-ghost badge-sm">
                        {item.view_count.toLocaleString()} views
                      </span>
                    )}
                    {item.like_count != null && (
                      <span className="badge badge-ghost badge-sm">
                        {item.like_count.toLocaleString()} likes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
