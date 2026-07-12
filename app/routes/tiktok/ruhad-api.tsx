import type { ActionFunctionArgs } from "react-router";

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
    return Response.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const { u: url } = body ?? {};
  if (!url) {
    return Response.json({ error: "Missing u (video URL) in body" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // The package is CommonJS: alldl lives on the default export, not as a named export.
    const mod: any = await import("rahad-all-downloader-v2");
    const alldl = mod.default?.alldl ?? mod.alldl;
    const result = await alldl.tiktok(url);
    return Response.json(result);
  } catch (err: any) {
    console.error("[ruhad tiktok] error:", err);
    return Response.json(
      { error: "Failed to fetch video", detail: err?.message ?? String(err) },
      { status: 502 },
    );
  }
};
