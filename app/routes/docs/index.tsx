export default function DocsIndex() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-3">tik-down API</h1>
        <p className="text-lg text-base-content/70">
          A high-performance API for fetching social media metadata using
          yt-dlp.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <div className="bg-base-200 border border-base-300 rounded-lg p-4">
          <code className="text-sm font-mono text-primary break-all">
            https://tik-down-backend.vercel.app
          </code>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Endpoints</h2>
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <div className="card-body divide-y divide-base-300 p-0">
            <div className="flex items-center gap-4 flex-wrap p-4">
              <span className="badge badge-primary font-mono text-sm">
                POST
              </span>
              <span className="font-mono text-lg font-semibold">/tiktok</span>
              <span className="text-base-content/70 text-sm md:ml-auto w-full md:w-auto">
                Stream videos from a TikTok profile
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap p-4">
              <span className="badge badge-primary font-mono text-sm">
                POST
              </span>
              <span className="font-mono text-lg font-semibold">
                /tiktok/download
              </span>
              <span className="text-base-content/70 text-sm md:ml-auto w-full md:w-auto">
                Get download URL for a single TikTok
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap p-4">
              <span className="badge badge-secondary font-mono text-sm">
                POST
              </span>
              <span className="font-mono text-lg font-semibold">
                /instagram
              </span>
              <span className="text-base-content/70 text-sm md:ml-auto w-full md:w-auto">
                Stream posts from an Instagram profile
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response Format</h2>
        <div className="bg-base-200 border border-base-300 rounded-lg p-4 space-y-3">
          <p className="text-base-content/70">
            Streaming endpoints return{" "}
            <span className="badge badge-outline">application/x-ndjson</span> —
            one JSON object per line, sent as data arrives. Non-streaming
            endpoints (like download) return standard JSON.
          </p>
          <div className="alert alert-info py-2 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>
              Check X-Cache header to see if response was served from the
              5-minute server-side cache.
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Authentication</h2>
        <p className="text-base-content/70">
          This API requires session IDs from the respective platforms to bypass
          rate limits and bot detection. Session IDs should be passed in the
          request body. No data is stored server-side beyond the 5-minute cache.
        </p>
      </section>
    </div>
  );
}
