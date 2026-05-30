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

export default function TikTokDocs() {
  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Badge color="primary">POST</Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-mono">/tiktok</h1>
        </div>
        <p className="text-lg text-base-content/70">
          Streams video metadata from a TikTok profile as NDJSON.
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
                  Username, <Code>@username</Code>, or full profile URL
                </span>
              </div>
              <div className="grid grid-cols-[150px_100px_1fr] gap-4 p-4 text-sm items-start">
                <Code>tt_session_id</Code>
                <Badge color="warning">required</Badge>
                <span className="text-base-content/70">
                  TikTok <Code>sessionid</Code> cookie value
                </span>
              </div>
              <div className="grid grid-cols-[150px_100px_1fr] gap-4 p-4 text-sm items-start">
                <Code>limit</Code>
                <Badge color="secondary">optional</Badge>
                <span className="text-base-content/70">
                  Max videos to return (Recommended max: 50)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Request</h2>
        <Block>{`POST /tiktok
Content-Type: application/json

{
  "u": "charlidamelio",
  "tt_session_id": "abc123...",
  "limit": 20
}`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Consuming the Stream</h2>
        <Block>{`const res = await fetch('/tiktok', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ u: 'username', tt_session_id: '...', limit: 20 })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  const lines = buf.split('\\n');
  buf = lines.pop();
  for (const line of lines) {
    if (line) console.log(JSON.parse(line));
  }
}`}</Block>
      </section>

      <div className="divider" id="tiktok-download"></div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <Badge color="primary">POST</Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-mono break-all">
            /tiktok/download
          </h1>
        </div>
        <p className="text-lg text-base-content/70">
          Fetches full metadata and download URLs for a single TikTok video.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Request</h2>
        <Block>{`POST /tiktok/download
Content-Type: application/json

{
  "u": "https://www.tiktok.com/@user/video/123456789",
  "tt_session_id": "abc123..."
}`}</Block>
      </section>
    </div>
  );
}
