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

type RuhadOwner = { username: string; nickname: string; avatar: string };
type RuhadStats = {
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
};

export type MergedMedia = CakMedia & {
  owner: RuhadOwner | null;
  stats: RuhadStats | null;
};

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
