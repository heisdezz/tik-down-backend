# Agents / Tooling Guide

This document lists recommended developer and runtime tooling for agent-style features and client integrations.

## Package manager
- Bun (bun.sh) — preferred for local development and fast installs.

Install packages with bun, e.g.:

```bash
# core client deps
bun add axios @tanstack/react-query daisyui@^5.0.0

# typecheck / dev deps
bun add -d tsgo typescript @types/node

# optional: tk4-downloader CLI (already installed in this repo)
bun add tk4-downloader
```

## Typechecking
- tsgo is recommended for fast typechecks. Project also uses tsc via npm scripts.

Example scripts (package.json already contains react-router typegen + tsc):

```json
{
  "scripts": {
    "dev": "react-router dev",
    "build": "node scripts/setup-ytdlp.mjs && react-router build",
    "typecheck": "react-router typegen && tsc"
  }
}
```

Use `bun` to run scripts where supported or `npm run <script>`.

## Client libraries
- axios — HTTP client for server and browser
- @tanstack/react-query — client-side data fetching and caching

Example usage (React):

```ts
// app/lib/api.ts
import axios from "axios";
export const api = axios.create({ baseURL: "/api" });
```

## Styling
- DaisyUI v5 — utility components on top of Tailwind CSS

Include in your CSS and Tailwind config as the project already does.

## Parser & tk4-downloader
- tk4-downloader is installed (CLI `tk4` available). The project route `app/routes/tiktok/tk4.tsx` uses it.
- A local parser was added at `app/lib/parser.ts` which exports `parse(result)` and a default export. The tk4 route prefers this parser and falls back to optional external parsers.

Example parser usage inside routes:

```ts
import { parse as localParse } from "../../lib/parser";
const parsed = await localParse(result);
```

## Notes
- The repository still uses npm scripts for build/typecheck; using bun to install deps is fine. Adjust CI if you switch to bun fully.
- If different parser behavior is needed, edit `app/lib/parser.ts` to normalize fields returned by tk4-downloader.
