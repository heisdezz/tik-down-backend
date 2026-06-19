function Badge({
  children,
  color = "primary",
}: {
  children: string;
  color?: "primary" | "secondary" | "warning";
}) {
  const variants = {
    primary: "badge badge-primary",
    secondary: "badge badge-secondary",
    warning: "badge badge-warning",
  };
  return (
    <span className={`${variants[color]} font-mono text-xs shrink-0`}>
      {children}
    </span>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="text-xs bg-base-200 text-base-content/80 px-2 py-1 rounded font-mono border border-base-300 break-all">
      {children}
    </code>
  );
}

function Block({ children }: { children: string }) {
  return (
    <pre className="bg-base-300 border border-base-300 rounded-lg px-4 py-4 text-sm font-mono text-base-content/80 overflow-x-auto">
      {children}
    </pre>
  );
}

export default function FacebookDocs() {
  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Badge color="secondary">POST</Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-mono">
            /facebook
          </h1>
        </div>
        <p className="text-lg text-base-content/70">
          Fetches metadata and download URLs for a single Facebook video.
          Returns a single JSON object (not streamed).
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Request Body</h2>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body divide-y divide-base-300 p-0 overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-[150px_100px_1fr] gap-4 p-4 text-sm items-start">
                <Code>u</Code>
                <Badge color="warning">required</Badge>
                <span className="text-base-content/70">
                  Full Facebook video URL (<Code>facebook.com</Code> or{" "}
                  <Code>fb.watch</Code>)
                </span>
              </div>
              <div className="grid grid-cols-[150px_100px_1fr] gap-4 p-4 text-sm items-start">
                <Code>fb_cookies</Code>
                <Badge color="secondary">optional</Badge>
                <span className="text-base-content/70">
                  Raw cookie header string copied from a logged-in browser
                  session (e.g. <Code>c_user=...; xs=...; datr=...</Code>).
                  Required only for private or restricted videos.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Request</h2>
        <Block>{`POST /facebook
Content-Type: application/json

{
  "u": "https://www.facebook.com/watch/?v=1234567890",
  "fb_cookies": "c_user=100012345; xs=1%3Aabc123..."
}`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response</h2>
        <p className="text-base-content/70">
          Returns the raw yt-dlp JSON metadata object for the video,
          including <Code>formats</Code> with direct download URLs.
        </p>
        <Block>{`{"id":"1234567890","title":"...","webpage_url":"https://www.facebook.com/watch/?v=1234567890","thumbnail":"https://...","duration":42,"formats":[...],...}`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Consuming</h2>
        <Block>{`const res = await fetch('/facebook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ u: 'https://www.facebook.com/watch/?v=1234567890' })
});

const data = await res.json();
console.log(data.title, data.formats);`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Responses</h2>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-0">
            {[
              ["400", "Missing u or invalid/non-Facebook URL"],
              ["401", "Video is private or requires login — pass fb_cookies"],
              ["500", "Failed to initialize yt-dlp"],
              ["502", "Failed to fetch video metadata"],
            ].map(([code, desc]) => (
              <div
                key={code}
                className="grid grid-cols-[80px_1fr] gap-4 p-4 text-sm border-b border-base-300 last:border-0"
              >
                <Code>{code}</Code>
                <span className="text-base-content/70">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
