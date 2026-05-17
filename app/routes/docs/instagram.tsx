function Badge({ children, color = "primary" }: { children: string; color?: "primary" | "secondary" | "warning" }) {
  const variants = {
    primary: "badge badge-primary",
    secondary: "badge badge-secondary",
    warning: "badge badge-warning",
  };
  return <span className={`${variants[color]} font-mono text-xs`}>{children}</span>;
}

function Code({ children }: { children: string }) {
  return (
    <code className="text-xs bg-base-200 text-base-content/80 px-2 py-1 rounded font-mono border border-base-300">
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

export default function InstagramDocs() {
  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Badge color="secondary">GET</Badge>
          <h1 className="text-4xl font-bold font-mono">/instagram</h1>
        </div>
        <p className="text-lg text-base-content/70">
          Streams all post entries from an Instagram profile as NDJSON using
          yt-dlp. Requires a valid session cookie configured on the server.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Query Parameters</h2>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body divide-y divide-base-300 p-0">
            <div className="grid grid-cols-[150px_120px_1fr] gap-4 p-4 text-sm items-start">
              <Code>u</Code>
              <Badge color="warning">required</Badge>
              <span className="text-base-content/70">
                Instagram username, <Code>@username</Code>, or full profile URL
              </span>
            </div>
            <div className="grid grid-cols-[150px_120px_1fr] gap-4 p-4 text-sm items-start">
              <Code>limit</Code>
              <Badge color="secondary">optional</Badge>
              <span className="text-base-content/70">
                Max number of posts to return. Omit to get all.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Requests</h2>
        <Block>{`GET /instagram?u=natgeo
GET /instagram?u=@natgeo
GET /instagram?u=https://www.instagram.com/natgeo/
GET /instagram?u=natgeo&limit=20`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response</h2>
        <p className="text-base-content/70">
          Returns <Code>application/x-ndjson</Code>. Each line is a
          self-contained JSON object representing one post, emitted as yt-dlp
          discovers it.
        </p>
        <Block>{`{"id":"ABC123","title":"Caption text","webpage_url":"https://www.instagram.com/p/ABC123/","thumbnail":"https://...","duration":15,...}
...`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Responses</h2>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-0">
            {[
              ["400", "Missing ?u= parameter or invalid username/URL"],
              ["404", "Profile not found, private, or has no public posts"],
              ["500", "Session cookie not configured on server"],
              ["502", "Failed to reach Instagram"],
            ].map(([code, desc]) => (
              <div key={code} className="grid grid-cols-[80px_1fr] gap-4 p-4 text-sm border-b border-base-300 last:border-0">
                <Code>{code}</Code>
                <span className="text-base-content/70">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Consuming the Stream</h2>
        <Block>{`const res = await fetch('/instagram?u=natgeo&limit=20');
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
    </div>
  );
}
