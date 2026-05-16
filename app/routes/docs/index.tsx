export default function DocsIndex() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-3">tik-down API</h1>
        <p className="text-lg text-base-content/70">
          A REST API for fetching TikTok profile video metadata using yt-dlp.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <div className="bg-base-200 border border-base-300 rounded-lg p-4">
          <code className="text-sm font-mono text-primary">
            https://tik-down-backend.vercel.app
          </code>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Endpoints</h2>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="badge badge-primary font-mono text-sm">
                GET
              </span>
              <span className="font-mono text-lg font-semibold">/profile</span>
              <span className="text-base-content/70 text-sm ml-auto">
                Stream all videos from a TikTok profile
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response Format</h2>
        <div className="bg-base-200 border border-base-300 rounded-lg p-4 space-y-3">
          <p className="text-base-content/70">
            All streaming endpoints return{" "}
            <span className="badge badge-outline">application/x-ndjson</span> — one JSON object per line, sent as data arrives. This means your client starts receiving video entries immediately without waiting for the full profile to be scanned.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-2 text-base-content/70">
          <li>Choose an endpoint from the navigation</li>
          <li>Read the documentation and query parameters</li>
          <li>Try the example requests</li>
          <li>Implement in your application using fetch streams</li>
        </ol>
      </section>
    </div>
  );
}

