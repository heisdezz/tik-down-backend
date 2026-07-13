// @ts-ignore
import { getMedia } from "cakkatrok-tiktok-downloader";
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

export type RuhadOwner = { username: string; nickname: string; avatar: string };
export type RuhadStats = {
  likes: number;
  comments: number;
  plays: number;
  shares: number;
};

type RuhadData = {
  title: string;
  thumbnail: string;
  owner: RuhadOwner;
  stats: RuhadStats;
  video_id: string | null;
};

export type MergedMedia = CakMedia & {
  video_id: string | null;
  owner: RuhadOwner | null;
  stats: RuhadStats | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetches ruhad metadata and extracts the video ID from the CDN download URL.
 * The `item_id` query param on the no-watermark CDN URL is the canonical TikTok
 * video ID — it works for both full URLs and short links (vt/vm.tiktok.com)
 * because ruhad resolves them internally.
 */
async function fetchRuhadMeta(videoUrl: string): Promise<RuhadData | null> {
  try {
    const mod: any = await import("rahad-all-downloader-v2");
    const alldl = mod.default?.alldl ?? mod.alldl;
    const result = await alldl.tiktok(videoUrl);
    if (!result?.success || !result.data) return null;

    const data = result.data;

    let video_id: string | null = null;
    const noWatermark: string | undefined = data?.download?.no_watermark;
    if (noWatermark) {
      try {
        video_id = new URL(noWatermark).searchParams.get("item_id");
      } catch {
        /* malformed URL */
      }
    }

    return {
      title: data.title,
      thumbnail: data.thumbnail,
      owner: data.owner,
      stats: data.stats,
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
    video_id: ruhad?.video_id ?? null,
    owner: ruhad?.owner ?? null,
    stats: ruhad?.stats ?? null,
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
