// @ts-ignore
import { getMedia } from "cakkatrok-tiktok-downloader";
import { Form, useLoaderData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────

type CakMedia = {
  status: boolean;
  source: string;
  input: string;
  title: string;
  author: string;
  thumbnail: string;
  type: "video" | "photo" | "audio";
  video: string | null;
  audio: string | null;
  photos: string[];
  links: string[];
};

type RuhadOwner = { username: string; nickname: string; avatar: string };
type RuhadStats = { likes: number; comments: number; plays: number; shares: number };
type RuhadData = {
  title: string;
  thumbnail: string;
  owner: RuhadOwner;
  stats: RuhadStats;
};

export type MergedMedia = CakMedia & {
  owner: RuhadOwner | null;
  stats: RuhadStats | null;
};

type LoaderData =
  | { media: MergedMedia; error: null }
  | { media: null; error: string }
  | null;

// ─── Shared fetch helper ─────────────────────────────────────────────────────

async function fetchRuhadMeta(videoUrl: string): Promise<RuhadData | null> {
  try {
    const mod: any = await import("rahad-all-downloader-v2");
    const alldl = mod.default?.alldl ?? mod.alldl;
    const result = await alldl.tiktok(videoUrl);
    if (!result?.success || !result.data) return null;
    return result.data as RuhadData;
  } catch {
    return null;
  }
}

async function fetchMediaWithMeta(videoUrl: string): Promise<MergedMedia> {
  const [cakResult, ruhadResult] = await Promise.allSettled([
    getMedia(videoUrl) as Promise<CakMedia>,
    fetchRuhadMeta(videoUrl),
  ]);

  if (cakResult.status === "rejected") {
    throw cakResult.reason;
  }

  const cak = cakResult.value;
  const ruhad = ruhadResult.status === "fulfilled" ? ruhadResult.value : null;

  return {
    ...cak,
    title: ruhad?.title || cak.title,
    thumbnail: ruhad?.thumbnail || cak.thumbnail,
    owner: ruhad?.owner ?? null,
    stats: ruhad?.stats ?? null,
  };
}

// ─── Action (POST — external API) ────────────────────────────────────────────

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

  const { u: videoUrl } = body ?? {};
  if (!videoUrl) {
    return Response.json({ error: "Missing u (video URL) in body" }, { status: 400 });
  }
  try {
    new URL(videoUrl);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const media = await fetchMediaWithMeta(String(videoUrl));
    return Response.json({ ok: true, media });
  } catch (err: any) {
    return Response.json(
      { error: "Failed to fetch media", detail: err?.message ?? String(err) },
      { status: 502 },
    );
  }
};

// ─── Loader (GET — UI) ───────────────────────────────────────────────────────

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const videoUrl = new URL(request.url).searchParams.get("videoUrl");
  if (!videoUrl) return null;

  try {
    const media = await fetchMediaWithMeta(videoUrl);
    return { media, error: null };
  } catch (err: any) {
    return { media: null, error: err?.message ?? String(err) };
  }
};

// ─── UI ──────────────────────────────────────────────────────────────────────

export default function CakTikTok() {
  const loaderData = useLoaderData() as LoaderData;
  const navigation = useNavigation();

  const loading = navigation.state === "loading";
  const media = loaderData && "media" in loaderData ? loaderData.media : null;
  const error = loaderData && "error" in loaderData ? loaderData.error : null;

  const authorLine = media?.owner
    ? `${media.owner.nickname} (@${media.owner.username})`
    : media?.author || null;

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6 px-4">
      <h1 className="text-2xl font-bold">TikTok Downloader — cakkatrok</h1>

      <Form method="get" className="space-y-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">TikTok Video URL</span>
          </label>
          <input
            className="input input-bordered w-full"
            name="videoUrl"
            placeholder="https://www.tiktok.com/@user/video/123..."
            defaultValue={
              typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("videoUrl") ?? ""
                : ""
            }
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Fetch"}
        </button>
      </Form>

      {error && (
        <div className="alert alert-error">
          <span className="break-all">{error}</span>
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
                <img src={media.thumbnail} alt="" className="w-40 h-full object-cover" />
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

              {/* Author row — avatar + name from ruhad when available */}
              {media.owner ? (
                <div className="flex items-center gap-2">
                  {media.owner.avatar && (
                    <img
                      src={media.owner.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  )}
                  <span className="text-xs text-base-content/60 truncate">
                    {media.owner.nickname}{" "}
                    <span className="opacity-60">@{media.owner.username}</span>
                  </span>
                </div>
              ) : authorLine ? (
                <p className="text-xs text-base-content/60">{authorLine}</p>
              ) : null}

              {/* Stats */}
              {media.stats && (
                <div className="flex gap-2 flex-wrap">
                  {media.stats.plays != null && (
                    <span className="badge badge-ghost badge-sm">
                      {media.stats.plays.toLocaleString()} plays
                    </span>
                  )}
                  {media.stats.likes != null && (
                    <span className="badge badge-ghost badge-sm">
                      {media.stats.likes.toLocaleString()} likes
                    </span>
                  )}
                  {media.stats.comments != null && (
                    <span className="badge badge-ghost badge-sm">
                      {media.stats.comments.toLocaleString()} comments
                    </span>
                  )}
                  {media.stats.shares != null && (
                    <span className="badge badge-ghost badge-sm">
                      {media.stats.shares.toLocaleString()} shares
                    </span>
                  )}
                </div>
              )}

              <span className="badge badge-outline badge-sm capitalize w-fit">
                {media.type}
              </span>
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex gap-2 flex-wrap">
            {media.type === "video" && media.video && (
              <a href={media.video} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                Download Video
              </a>
            )}
            {media.type === "audio" && media.audio && (
              <a href={media.audio} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                Download Audio
              </a>
            )}
            {media.audio && media.type !== "audio" && (
              <a href={media.audio} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                Audio
              </a>
            )}
            {media.type === "photo" &&
              media.photos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" className="btn btn-sm btn-accent">
                  Photo {i + 1}
                </a>
              ))}
            {media.links.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost btn-outline">
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
            <summary className="collapse-title text-sm font-medium">Raw JSON</summary>
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
