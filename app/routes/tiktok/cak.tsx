// @ts-ignore
import { getMedia } from "cakkatrok-tiktok-downloader";
// @ts-ignore — no types for ttsave
import type { ActionFunctionArgs } from "react-router";

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

export type TtsaveAuthor = {
  name: string | null;
  username: string | null;
};

export type TtsaveStats = {
  views: string | null;
  likes: string | null;
  comments: string | null;
  shares: string | null;
};

type TtsaveMeta = {
  title: string | null;
  thumbnail: string | null;
  author_meta: TtsaveAuthor;
  stats: TtsaveStats;
  video_id: string | null;
};

export type MergedMedia = CakMedia & {
  video_id: string | null;
  author_meta: TtsaveAuthor | null;
  stats: TtsaveStats | null;
};

// ─── ttsave metadata helper ───────────────────────────────────────────────────

async function fetchTtsaveMeta(videoUrl: string): Promise<TtsaveMeta | null> {
  try {
    // @ts-ignore
    const mod: any = await import("ttsave");
    const { getInfo } = mod.default ?? mod;
    const result = await getInfo(videoUrl);
    if (!result?.success) return null;

    // Try to pull video_id from the no-watermark CDN URL first,
    // then fall back to a regex on the original input URL.
    let video_id: string | null = null;
    const noWm: string | undefined = result.video?.url?.no_wm;
    if (noWm) {
      // tikcdn.io/ssstik/<video_id>
      const tikcdnMatch = noWm.match(/tikcdn\.io\/ssstik\/(\d+)/);
      if (tikcdnMatch) video_id = tikcdnMatch[1];

      if (!video_id) {
        // item_id query param on TikTok CDN URLs
        try {
          video_id = new URL(noWm).searchParams.get("item_id");
        } catch {
          /* malformed URL */
        }
      }
    }
    // Last resort: extract from full URL path (works for non-short URLs)
    if (!video_id) {
      const pathMatch = videoUrl.match(/\/video\/(\d+)/);
      if (pathMatch) video_id = pathMatch[1];
    }

    return {
      title: result.author?.judul || null,
      thumbnail: result.video?.thumbnail || null,
      author_meta: {
        name: result.author?.name || null,
        username: result.author?.username || null,
      },
      stats: {
        views: result.video?.views || null,
        likes: result.video?.loves || null,
        comments: result.video?.comments || null,
        shares: result.video?.shares || null,
      },
      video_id,
    };
  } catch {
    return null;
  }
}

// ─── Shared fetch helper ──────────────────────────────────────────────────────

export async function fetchMediaWithMeta(
  videoUrl: string,
): Promise<MergedMedia> {
  const [cakResult, ttsaveResult] = await Promise.allSettled([
    getMedia(videoUrl) as Promise<CakMedia>,
    fetchTtsaveMeta(videoUrl),
  ]);

  if (cakResult.status === "rejected") {
    throw cakResult.reason;
  }

  const cak = cakResult.value;
  const tt = ttsaveResult.status === "fulfilled" ? ttsaveResult.value : null;

  return {
    ...cak,
    title: tt?.title || cak.title,
    thumbnail: tt?.thumbnail || cak.thumbnail,
    video_id: tt?.video_id ?? null,
    author_meta: tt?.author_meta ?? null,
    stats: tt?.stats ?? null,
  };
}

// ─── Action (POST — external API) ────────────────────────────────────────────

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
    return Response.json(
      { error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const { u: videoUrl } = body ?? {};
  if (!videoUrl) {
    return Response.json(
      { error: "Missing u (video URL) in body" },
      { status: 400 },
    );
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
