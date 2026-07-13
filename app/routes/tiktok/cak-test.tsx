import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { MergedMedia } from "./cak";

async function fetchCak(url: string): Promise<MergedMedia> {
  const res = await fetch("/tiktok/cak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ u: url }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.detail ?? body.error ?? `HTTP ${res.status}`);
  }
  return body.media as MergedMedia;
}

export default function CakTest() {
  const [url, setUrl] = useState("");

  const {
    mutate,
    data: media,
    error,
    isPending: loading,
  } = useMutation({ mutationFn: fetchCak });

  const run = () => {
    if (!url.trim()) return;
    mutate(url.trim());
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6 px-4">
      <h1 className="text-2xl font-bold">TikTok Test — cakkatrok</h1>

      <div className="space-y-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Video URL</span>
          </label>
          <input
            className="input input-bordered w-full"
            placeholder="https://www.tiktok.com/@user/video/123... or vt.tiktok.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={loading || !url.trim()}
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
          <span className="break-all">{(error as Error).message}</span>
        </div>
      )}

      {media && !media.status && (
        <div className="alert alert-warning">
          <span>Media not found or unavailable.</span>
        </div>
      )}

      {media && media.status && (
        <div className="space-y-4">
          {/* Meta card */}
          <div className="card card-side bg-base-200 shadow-sm overflow-hidden">
            <figure className="w-40 shrink-0 bg-base-300">
              {media.thumbnail ? (
                <img
                  src={media.thumbnail}
                  alt=""
                  className="w-40 h-full object-cover"
                />
              ) : (
                <div className="w-40 h-28 flex items-center justify-center text-base-content/20 text-xs">
                  no thumb
                </div>
              )}
            </figure>
            <div className="card-body p-4 gap-2 min-w-0">
              <p className="font-medium text-sm leading-snug line-clamp-3">
                {media.title || "(no title)"}
              </p>

              {/* Author from tk4 */}
              {media.author_meta?.uniqueId ? (
                <p className="text-xs text-base-content/60 truncate">
                  {media.author_meta.name}{" "}
                  <span className="opacity-60">
                    @{media.author_meta.uniqueId}
                  </span>
                </p>
              ) : media.author ? (
                <p className="text-xs text-base-content/60">{media.author}</p>
              ) : null}

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="badge badge-outline badge-sm capitalize">
                  {media.type}
                </span>
                {media.video_id && (
                  <span className="badge badge-ghost badge-sm font-mono">
                    ID: {media.video_id}
                  </span>
                )}
                {media.duration != null && (
                  <span className="badge badge-ghost badge-sm">
                    {media.duration}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex gap-2 flex-wrap">
            {media.type === "video" && media.video && (
              <a
                href={media.video}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-primary"
              >
                Download Video
              </a>
            )}
            {media.type === "audio" && media.audio && (
              <a
                href={media.audio}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-secondary"
              >
                Download Audio
              </a>
            )}
            {media.audio && media.type !== "audio" && (
              <a
                href={media.audio}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-secondary"
              >
                Audio
              </a>
            )}
            {media.type === "photo" &&
              media.photos.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-accent"
                >
                  Photo {i + 1}
                </a>
              ))}
            {media.links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-ghost btn-outline"
              >
                Link {i + 1}
              </a>
            ))}
          </div>

          {/* Photo grid */}
          {media.type === "photo" && media.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {media.photos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img
                    src={src}
                    alt={`photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Raw JSON */}
          <details className="collapse collapse-arrow bg-base-200">
            <summary className="collapse-title text-sm font-medium">
              Raw JSON
            </summary>
            <div className="collapse-content">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(media, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
