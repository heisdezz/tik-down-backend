function Badge({ children, color = "primary" }: { children: string; color?: "primary" | "secondary" | "warning" }) {
  const variants = {
    primary: "badge badge-primary",
    secondary: "badge badge-secondary",
    warning: "badge badge-warning",
  };
  return (
    <span className={`${variants[color]} font-mono text-xs`}>
      {children}
    </span>
  );
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

export default function ProfileDocs() {
  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Badge color="primary">GET</Badge>
          <h1 className="text-4xl font-bold font-mono">/profile</h1>
        </div>
        <p className="text-lg text-base-content/70">
          Streams all video entries from a TikTok profile as NDJSON using
          yt-dlp flat-playlist.
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
                TikTok username, <Code>@username</Code>, or full profile URL
              </span>
            </div>
            <div className="grid grid-cols-[150px_120px_1fr] gap-4 p-4 text-sm items-start">
              <Code>limit</Code>
              <Badge color="secondary">optional</Badge>
              <span className="text-base-content/70">
                Max number of videos to return. Fetches the most recent{" "}
                <Code>N</Code> videos. Omit to get all.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Requests</h2>
        <Block>{`GET /profile?u=charlidamelio
GET /profile?u=@charlidamelio
GET /profile?u=https://www.tiktok.com/@charlidamelio
GET /profile?u=charlidamelio&limit=30`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response</h2>
        <p className="text-base-content/70">
          Returns <Code>application/x-ndjson</Code>. Each line is a
          self-contained JSON object representing one video entry, emitted as
          yt-dlp discovers it.
        </p>
        <Block>{`{"id":"7123456789","title":"some video","webpage_url":"https://www.tiktok.com/@user/video/7123456789","thumbnail":"https://...","duration":15,"uploader":"charlidamelio",...}
{"id":"7123456788","title":"another video","webpage_url":"https://...","thumbnail":"https://...","duration":30,...}
...`}</Block>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Responses</h2>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-0">
            <div className="grid grid-cols-[80px_1fr] gap-4 p-4 text-sm">
              <Code>400</Code>
              <span className="text-base-content/70">Missing <Code>?u=</Code> parameter</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Consuming the Stream</h2>
        <p className="text-base-content/70">
          Read the response body as a stream and parse each line as JSON:
        </p>
        <Block>{`const res = await fetch('/profile?u=charlidamelio');
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

      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Streaming is ideal for large profiles. Start processing videos as they arrive without loading the entire profile into memory.</span>
      </div>
    </div>
  );
}

