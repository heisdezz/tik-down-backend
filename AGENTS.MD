# Agent Guide: tik-down-backend

## System Overview
`tik-down-backend` is a high-performance API server built with **React Router 7** that streams social media profile metadata (TikTok, Instagram) using `yt-dlp`. It is designed for low-latency delivery via **NDJSON (Newline Delimited JSON)** streaming and is optimized for deployment on **Vercel**.

## Tech Stack
- **Framework:** React Router 7 (Vite-based)
- **Engine:** `yt-dlp` via `ytdlp-nodejs`
- **Language:** TypeScript
- **Styling:** Tailwind CSS + DaisyUI (for the documentation/landing pages)
- **Runtime:** Node.js

## Core Architecture

### 1. yt-dlp Integration (`app/lib/ytdlp.server.ts`)
- **Binary Management:** Automatically downloads the correct `yt-dlp` binary for the current platform/architecture.
- **Vercel Compatibility:** On Vercel, binaries and temporary cookie files are stored in `/tmp` because the rest of the filesystem is read-only.
- **Execution:** Uses `ytdlp.execAsync` with `onData` callbacks to enable real-time streaming of metadata as it's parsed.

### 2. API Endpoints (`app/routes/*/index.tsx`)
- **Streaming Logic:** Endpoints return a `ReadableStream` wrapped in a `Response` with `Content-Type: application/x-ndjson`.
- **Authentication:** Users must provide `tt_session_id` (TikTok) or `ig_session_id` (Instagram) in the POST body. These are used to generate temporary Netscape-formatted cookie files for `yt-dlp`.
- **Caching:** In-memory caching using a `Map`. Cache keys include the profile URL, limit, and a tail portion of the session ID to ensure privacy while allowing hits for identical requests. TTL is 5 minutes.
- **Probe Phase:** Before starting a full stream, a "probe" (requesting 1 item) is performed to verify profile existence and public status.

### 3. Routing (`app/routes.ts`)
- Uses `rr-next-routes` to enable a Next.js-style file-system routing within React Router.
- Routes are located in `app/routes/`.

## Development & Maintenance

### Setup
- `npm install` runs `scripts/setup-ytdlp.mjs` as a `postinstall` hook to ensure `yt-dlp` is available in `bin/`.
- Local development: `npm run dev`.

### Adding New Platforms
To add a new platform (e.g., YouTube):
1. Create a new route folder in `app/routes/`.
2. Implement an `action` that validates input and sets up `yt-dlp` cookies if needed.
3. Follow the NDJSON streaming pattern used in `tiktok/index.tsx`.
4. Update `app/lib/ytdlp.server.ts` if platform-specific binary requirements emerge.

### yt-dlp Updates
- The `ytdlp-nodejs` helper and `scripts/setup-ytdlp.mjs` handle fetching the latest releases.
- If `yt-dlp` breaks due to platform changes, updating the package or re-running the setup script usually resolves it.

## Key Files
- `app/lib/ytdlp.server.ts`: The heart of the `yt-dlp` wrapper.
- `app/routes/tiktok/index.tsx`: TikTok profile streaming implementation.
- `app/routes/tiktok/download.tsx`: Single TikTok video metadata/download implementation.
- `app/routes/instagram/index.tsx`: Instagram profile streaming implementation.
- `TikDown.md`: Public API documentation.
- `scripts/setup-ytdlp.mjs`: Build-time binary downloader.

## Design Principles
- **Stateless:** No user data or cookies are stored on the server beyond the request lifecycle (except for the 5-minute cache).
- **Reactive:** Stream data as soon as it's available to provide a fast user experience.
- **Surgical:** Keep `yt-dlp` arguments minimal to reduce resource usage.
