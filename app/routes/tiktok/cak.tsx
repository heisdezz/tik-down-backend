// @ts-ignore
import { getMedia } from "cakkatrok-tiktok-downloader";
import { TikTokDownloader } from "tk4-downloader";
import { parse as localParse } from "../../lib/parser";
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

export type Tk4Author = {
  id: string | null;
  name: string | null;
  uniqueId: string | null;
};

type Tk4Meta = {
  id: string | null;
  title: string | null;
  duration: number | null;
  author: Tk4Author;
  thumbnails: string[];
};

export type MergedMedia = CakMedia & {
  video_id: string | null;
  duration: number | null;
  author_meta: Tk4Author | null;
};

// ─── tk4 metadata helper ──────────────────────────────────────────────────────

async function fetchTk4Meta(videoUrl: string): Promise<Tk4Meta | null> {
  try {
    const downloader = new TikTokDownloader({ debug: false });
    const result = await downloader.downloadVideo(String(videoUrl));
    const parsed = await localParse(result);
    if (!parsed || parsed.error) return null;
    return parsed as Tk4Meta;
  } catch {
    return null;
  }
}

// ─── Shared fetch helper ──────────────────────────────────────────────────────

export async function fetchMediaWithMeta(
  videoUrl: string,
): Promise<MergedMedia> {
  const [cakResult, tk4Result] = await Promise.allSettled([
    getMedia(videoUrl) as Promise<CakMedia>,
    fetchTk4Meta(videoUrl),
  ]);

  if (cakResult.status === "rejected") {
    throw cakResult.reason;
  }

  const cak = cakResult.value;
  const tk4 = tk4Result.status === "fulfilled" ? tk4Result.value : null;

  // Use the last thumbnail from tk4 (highest quality); fall back to cak's
  const tk4Thumb = tk4?.thumbnails?.length
    ? tk4.thumbnails[tk4.thumbnails.length - 1]
    : null;

  return {
    ...cak,
    title: tk4?.title || cak.title,
    thumbnail: tk4Thumb || cak.thumbnail,
    video_id: tk4?.id ?? null,
    duration: tk4?.duration ?? null,
    author_meta: tk4?.author ?? null,
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
