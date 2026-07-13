import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";

async function fetchTk4(url: string) {
  const res = await fetch("/tiktok/tk4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ u: url }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.detail ?? body?.error ?? `HTTP ${res.status}`);
  }
  return body;
}

export default function Tk4Test() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [url, setUrl] = useState(() => searchParams.get("u") ?? "");

  const {
    mutate,
    data: result,
    error,
    isPending: loading,
  } = useMutation({ mutationFn: fetchTk4 });

  useEffect(() => {
    const u = searchParams.get("u");
    if (u && u !== url) setUrl(u);
  }, [searchParams]);

  const run = () => {
    if (!url) return;
    setSearchParams({ u: url });
    mutate(url);
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">tk4-downloader Test</h1>
      </div>

      <div className="flex gap-2 items-end flex-wrap">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Video or Profile URL</span>
          </label>
          <input
            className="input input-bordered w-96"
            placeholder="https://tiktok.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !url}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Test"}
        </button>
      </div>

      {error && <div className="alert alert-error"><span>{error.message}</span></div>}

      {result && (
        <div className="space-y-4">
          {result.parsed ? (
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-sm">Parsed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>ID:</strong> {String(result.parsed.id ?? "")}</p>
                    <p><strong>Title:</strong> {result.parsed.title ?? "—"}</p>
                    <p><strong>Author:</strong> {result.parsed.author?.name ?? result.parsed.author?.id ?? "—"}</p>
                    <p><strong>Duration:</strong> {result.parsed.duration ?? "—"}</p>
                    {result.parsed.url && (
                      <p>
                        <a className="link" href={result.parsed.url} target="_blank" rel="noreferrer">Source</a>
                      </p>
                    )}
                  </div>
                  <div>
                    {Array.isArray(result.parsed.thumbnails) && result.parsed.thumbnails.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {result.parsed.thumbnails.slice(0, 6).map((t: any, i: number) => (
                          <img key={i} src={typeof t === "string" ? t : t?.url} alt={`thumb-${i}`} className="w-24 h-24 object-cover rounded" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted">No thumbnails</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {result.result && (
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-sm">Downloader Result</h2>
                <div className="mockup-code text-xs max-h-64 overflow-auto">
                  <pre>
                    <code>{JSON.stringify(result.result, null, 2)}</code>
                  </pre>
                </div>
                {result.result?.url && (
                  <a href={result.result.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline mt-2">Open video</a>
                )}
              </div>
            </div>
          )}

          {result.progress && result.progress.length > 0 && (
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-sm">Progress</h2>
                <div className="mockup-code text-xs max-h-40 overflow-auto">
                  <pre>
                    <code>{JSON.stringify(result.progress, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-sm">Raw / Parsed JSON</h2>
              <div className="mockup-code text-xs max-h-96 overflow-auto">
                <pre>
                  <code>{JSON.stringify(result, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
