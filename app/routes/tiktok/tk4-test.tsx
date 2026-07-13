import { useState } from "react";
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
  const [url, setUrl] = useState("");

  const {
    mutate,
    data: result,
    error,
    isPending: loading,
  } = useMutation({ mutationFn: fetchTk4 });

  const run = () => {
    if (!url) return;
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
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-sm">Result</h2>
            <div className="mockup-code text-xs max-h-96 overflow-auto">
              <pre>
                <code>{JSON.stringify(result, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
