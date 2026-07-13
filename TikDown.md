# TikDown API

Backend that streams social media profile video metadata via yt-dlp.

**Base URL:** `https://tik-down-backend.vercel.app`

---

## Endpoints

### `POST /tiktok`

Streams video metadata from a TikTok profile as NDJSON.
Session cookie is passed per-request in the JSON body — nothing is stored server-side.

#### Request Body (JSON)

| Field           | Required | Description |
|-----------------|----------|-------------|
| `u`             | Yes      | Username, `@username`, or full `https://www.tiktok.com/@username` URL |
| `tt_session_id` | Yes      | TikTok `sessionid` cookie value |
| `limit`         | No       | Max videos to return. Recommended max: 50. |

#### Example

```
POST /tiktok
Content-Type: application/json

{
  "u": "charlidamelio",
  "tt_session_id": "abc123...",
  "limit": 20
}
```

---

### `POST /instagram`

Streams post metadata from an Instagram profile as NDJSON.
Session cookie is passed per-request in the JSON body — nothing is stored server-side.

#### Request Body (JSON)

| Field           | Required | Description |
|-----------------|----------|-------------|
| `u`             | Yes      | Username, `@username`, or full `https://www.instagram.com/username/` URL |
| `ig_session_id` | Yes      | Instagram `sessionid` cookie value |
| `limit`         | No       | Max posts to return. Recommended max: 50. |

#### Example

```
POST /instagram
Content-Type: application/json

{
  "u": "natgeo",
  "ig_session_id": "49476777829%3Ajp9...",
  "limit": 20
}
```

### `POST /tiktok/download`

Fetches full metadata and download URLs for a single TikTok video.
Returns a single JSON object (not streamed).

#### Request Body (JSON)

| Field           | Required | Description |
|-----------------|----------|-------------|
| `u`             | Yes      | Full TikTok video URL |
| `tt_session_id` | Yes      | TikTok `sessionid` cookie value |

#### Example

```
POST /tiktok/download
Content-Type: application/json

{
  "u": "https://www.tiktok.com/@charlidamelio/video/1234567890",
  "tt_session_id": "abc123..."
}
```

---

### `POST /facebook`

Fetches full metadata and download URLs for a single Facebook video.
Returns a single JSON object (not streamed).

#### Request Body (JSON)

| Field        | Required | Description |
|--------------|----------|-------------|
| `u`          | Yes      | Full Facebook video URL (`facebook.com` or `fb.watch`) |
| `fb_cookies` | No       | Raw cookie header string from a logged-in browser session (e.g. `"c_user=...; xs=...; datr=..."`). Only needed for private/restricted videos. |

#### Example

```
POST /facebook
Content-Type: application/json

{
  "u": "https://www.facebook.com/watch/?v=1234567890",
  "fb_cookies": "c_user=100012345; xs=1%3Aabc123..."
}
```

---

### `POST /tiktok/ruhad-api`

Fetches direct download links for a single TikTok video via the
`rahad-all-downloader-v2` third-party service (no yt-dlp, no cookies required).
Returns a single JSON object (not streamed).

#### Request Body (JSON)

| Field | Required | Description |
|-------|----------|-------------|
| `u`   | Yes      | Full TikTok video URL |

#### Example

```
POST /tiktok/ruhad-api
Content-Type: application/json

{
  "u": "https://www.tiktok.com/@tiktok/video/7106594312292453675"
}
```

#### Response Shape

```json
{
  "success": true,
  "data": {
    "title": "Video caption",
    "thumbnail": "https://...",
    "owner": { "username": "tiktok", "nickname": "TikTok", "avatar": "https://..." },
    "stats": { "likes": 98697, "comments": 1282, "plays": 564067, "shares": 127 },
    "download": {
      "no_watermark": "https://...mp4",
      "watermark": "https://...mp4",
      "music": "https://...mp3"
    },
    "source": "tiktok"
  }
}
```

> Note: this endpoint depends on an external service and does not use the
> shared 5-minute cache. Use `/tiktok/download` (yt-dlp) if you need cookie
> auth or consistent behaviour.

---

### `POST /tiktok/tk4`

Fetches TikTok video or profile metadata using the `tk4-downloader` library.
Returns a single JSON object (not streamed) containing the raw download data and parsed video details.

#### Request Body (JSON)

| Field | Required | Description |
|-------|----------|-------------|
| `u`   | Yes      | Full TikTok video or profile URL |

#### Example

```
POST /tiktok/tk4
Content-Type: application/json

{
  "u": "https://www.tiktok.com/@999.ian/video/7660657467071745293"
}
```

#### Response Shape

```json
{
  "ok": true,
  "result": {
    "id": "7660657467071745293",
    "url": "https://www.tiktok.com/@999.ian/video/7660657467071745293",
    "data": "<!DOCTYPE html>..."
  },
  "parsed": {
    "id": "7660657467071745293",
    "title": "maybe||#999#juicewrld#999forever#viral",
    "description": "maybe||#999#juicewrld#999forever#viral",
    "url": "https://v16-webapp-prime.tiktok.com/video/tos/alisg/...",
    "duration": 25,
    "author": {
      "id": "7340081979545109546",
      "name": "734",
      "uniqueId": "999.ian"
    },
    "thumbnails": [
      "https://p16-common-sign.tiktokcdn.com/..."
    ]
  },
  "progress": []
}
```

---

### `POST /tiktok/cak`

Fetches media info and direct download URLs for a single TikTok video via the
`cakkatrok-tiktok-downloader` library (no yt-dlp, no cookies required).
Detects content type automatically — video, slideshow photos, or audio.
Returns a single JSON object (not streamed).

#### Request Body (JSON)

| Field | Required | Description |
|-------|----------|-------------|
| `u`   | Yes      | Full TikTok video URL |

#### Example

```
POST /tiktok/cak
Content-Type: application/json

{
  "u": "https://www.tiktok.com/@user/video/7106594312292453675"
}
```

#### Response Shape

```json
{
  "ok": true,
  "media": {
    "status": true,
    "source": "savetik",
    "input": "https://www.tiktok.com/@user/video/7106594312292453675",
    "title": "Video caption",
    "author": "@username",
    "thumbnail": "https://...",
    "type": "video",
    "video": "https://...mp4",
    "audio": "https://...mp3",
    "photos": [],
    "links": ["https://..."]
  }
}
```

`type` is one of `"video"`, `"photo"`, or `"audio"`.
For slideshow posts, `photos` contains an array of image URLs and `video` is `null`.

> Note: this endpoint proxies through SaveTik (`savetik.io`) and does not use
> yt-dlp or a session cookie. Use `/tiktok/download` if you need cookie auth.

---

## Response Format (streaming endpoints)

- **Content-Type:** `application/x-ndjson`
- **X-Cache:** `HIT` or `MISS` (5-minute server-side cache)
- Each newline-delimited line is a complete JSON object for one video/post.

### Video / Post Object Fields

| Field         | Type    | Description |
|---------------|---------|-------------|
| `id`          | string  | Unique video/post ID |
| `title`       | string  | Caption/title |
| `webpage_url` | string  | Full URL to the post |
| `url`         | string  | Fallback if `webpage_url` is absent |
| `thumbnail`   | string  | Thumbnail image URL |
| `thumbnails`  | array   | All thumbnails — last entry is highest quality |
| `duration`    | number  | Duration in seconds |
| `uploader`    | string  | Username of the uploader |
| `view_count`  | number? | View count (may be absent) |
| `like_count`  | number? | Like count (may be absent) |

### Error Response Shape

```json
{ "error": "Human-readable message", "detail": "Raw error (debug)" }
```

| Status | Condition |
|--------|-----------|
| `400`  | Missing or invalid `u` / malformed body |
| `401`  | Missing session cookie (`tt_session_id` / `ig_session_id`), or Facebook video is private and needs `fb_cookies` |
| `404`  | Profile not found / no public posts |
| `405`  | Wrong HTTP method (GET on these routes) |
| `500`  | yt-dlp failed to initialize |
| `502`  | Could not reach TikTok / Instagram / Facebook |

---

## Consuming the Stream

### Dart / Flutter

**TikTok**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> fetchTikTok(
  String username,
  String sessionId, {
  int limit = 20,
}) async {
  final uri = Uri.https('tik-down-backend.vercel.app', '/tiktok');
  final request = http.Request('POST', uri)
    ..headers['Content-Type'] = 'application/json'
    ..body = jsonEncode({'u': username, 'tt_session_id': sessionId, 'limit': limit});

  final response = await http.Client().send(request);
  if (response.statusCode != 200) {
    final body = await response.stream.bytesToString();
    throw Exception(jsonDecode(body)['error']);
  }

  final lines = response.stream
      .transform(utf8.decoder)
      .transform(const LineSplitter());

  await for (final line in lines) {
    if (line.trim().isEmpty) continue;
    final video = jsonDecode(line) as Map<String, dynamic>;
    // add to your state list
  }
}
```

**Instagram**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> fetchInstagram(
  String username,
  String sessionId, {
  int limit = 20,
}) async {
  final uri = Uri.https('tik-down-backend.vercel.app', '/instagram');
  final request = http.Request('POST', uri)
    ..headers['Content-Type'] = 'application/json'
    ..body = jsonEncode({'u': username, 'ig_session_id': sessionId, 'limit': limit});

  final response = await http.Client().send(request);
  if (response.statusCode != 200) {
    final body = await response.stream.bytesToString();
    throw Exception(jsonDecode(body)['error']);
  }

  final lines = response.stream
      .transform(utf8.decoder)
      .transform(const LineSplitter());

  await for (final line in lines) {
    if (line.trim().isEmpty) continue;
    final post = jsonDecode(line) as Map<String, dynamic>;
    // add to your state list
  }
}
```

---

### React Native / JavaScript

**TikTok**

```js
async function fetchTikTok(username, sessionId, limit = 20) {
  const res = await fetch('https://tik-down-backend.vercel.app/tiktok', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: username, tt_session_id: sessionId, limit }),
  });

  if (!res.ok) throw new Error((await res.json()).error);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) {
        const video = JSON.parse(line);
        // append to your state array
      }
    }
  }
}
```

**Instagram**

```js
async function fetchInstagram(username, sessionId, limit = 20) {
  const res = await fetch('https://tik-down-backend.vercel.app/instagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: username, ig_session_id: sessionId, limit }),
  });

  if (!res.ok) throw new Error((await res.json()).error);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) {
        const post = JSON.parse(line);
        // append to your state array
      }
    }
  }
}
```

---

### Swift (iOS)

**TikTok**

```swift
func fetchTikTok(username: String, sessionId: String, limit: Int = 20) async throws {
    let url = URL(string: "https://tik-down-backend.vercel.app/tiktok")!
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONSerialization.data(withJSONObject: [
        "u": username, "tt_session_id": sessionId, "limit": limit
    ])
    let (stream, response) = try await URLSession.shared.bytes(for: req)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
    for try await line in stream.lines {
        guard !line.isEmpty, let data = line.data(using: .utf8),
              let video = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { continue }
        // append to your @Published array
    }
}
```

**Instagram**

```swift
func fetchInstagram(username: String, sessionId: String, limit: Int = 20) async throws {
    let url = URL(string: "https://tik-down-backend.vercel.app/instagram")!
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONSerialization.data(withJSONObject: [
        "u": username, "ig_session_id": sessionId, "limit": limit
    ])
    let (stream, response) = try await URLSession.shared.bytes(for: req)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
    for try await line in stream.lines {
        guard !line.isEmpty, let data = line.data(using: .utf8),
              let post = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { continue }
        // append to your @Published array
    }
}
```

---

## Fetching Single Video (Non-Streaming)

For `POST /tiktok/download`, `POST /facebook`, `POST /tiktok/ruhad-api`, and `POST /tiktok/cak`, the response is a single JSON object containing full metadata and all available formats/URLs.

### JavaScript

```js
async function fetchVideoDownload(videoUrl, sessionId) {
  const res = await fetch('https://tik-down-backend.vercel.app/tiktok/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: videoUrl, tt_session_id: sessionId }),
  });

  if (!res.ok) throw new Error((await res.json()).error);
  const data = await res.json();
  console.log('Download URL:', data.url);
  return data;
}

async function fetchFacebookVideo(videoUrl, cookies) {
  const res = await fetch('https://tik-down-backend.vercel.app/facebook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: videoUrl, ...(cookies ? { fb_cookies: cookies } : {}) }),
  });

  if (!res.ok) throw new Error((await res.json()).error);
  const data = await res.json();
  console.log('Formats:', data.formats);
  return data;
}

// TikTok via rahad-all-downloader-v2 (no cookies)
async function fetchTikTokRuhad(videoUrl) {
  const res = await fetch('https://tik-down-backend.vercel.app/tiktok/ruhad-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: videoUrl }),
  });

  if (!res.ok) throw new Error((await res.json()).error);
  const { data } = await res.json();
  console.log('No-watermark URL:', data.download.no_watermark);
  return data;
}

// TikTok via cakkatrok-tiktok-downloader (no cookies, supports video/photo/audio)
async function fetchTikTokCak(videoUrl) {
  const res = await fetch('https://tik-down-backend.vercel.app/tiktok/cak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ u: videoUrl }),
  });

  if (!res.ok) throw new Error((await res.json()).error);
  const { media } = await res.json();
  // media.type === 'video' | 'photo' | 'audio'
  if (media.type === 'video') console.log('Video URL:', media.video);
  if (media.type === 'photo') console.log('Photos:', media.photos);
  if (media.type === 'audio') console.log('Audio URL:', media.audio);
  return media;
}
```

### Dart / Flutter

```dart
Future<Map<String, dynamic>> fetchVideoDownload(String url, String sessionId) async {
  final uri = Uri.https('tik-down-backend.vercel.app', '/tiktok/download');
  final res = await http.post(
    uri,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'u': url, 'tt_session_id': sessionId}),
  );

  if (res.statusCode != 200) throw Exception(jsonDecode(res.body)['error']);
  return jsonDecode(res.body);
}

Future<Map<String, dynamic>> fetchFacebookVideo(String url, {String? cookies}) async {
  final uri = Uri.https('tik-down-backend.vercel.app', '/facebook');
  final res = await http.post(
    uri,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'u': url, if (cookies != null) 'fb_cookies': cookies}),
  );

  if (res.statusCode != 200) throw Exception(jsonDecode(res.body)['error']);
  return jsonDecode(res.body);
}

// TikTok via cakkatrok-tiktok-downloader (no cookies, supports video/photo/audio)
Future<Map<String, dynamic>> fetchTikTokCak(String videoUrl) async {
  final uri = Uri.https('tik-down-backend.vercel.app', '/tiktok/cak');
  final res = await http.post(
    uri,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'u': videoUrl}),
  );

  if (res.statusCode != 200) throw Exception(jsonDecode(res.body)['error']);
  final body = jsonDecode(res.body) as Map<String, dynamic>;
  final media = body['media'] as Map<String, dynamic>;
  // media['type'] is 'video', 'photo', or 'audio'
  return media;
}
```

---

## Caching

- TTL: **5 minutes** per `profileUrl + limit + session ID tail`
- Cache hits replay stored lines instantly — no yt-dlp invocation
- Check `X-Cache: HIT` header to confirm

---

## Validation Rules

| Input | Rule |
|-------|------|
| TikTok username | 1–24 chars, `[a-zA-Z0-9_.]` |
| Instagram username | 1–30 chars, `[a-zA-Z0-9_.]` |
| `@username` | Leading `@` stripped before validation |
| Full URL | Must parse as valid URL with matching platform hostname |
| Facebook URL | Hostname must end in `facebook.com` or `fb.watch` |
| `fb_cookies` | Raw `name=value; name2=value2` cookie string, parsed into a Netscape cookie file |
| `limit` | Optional integer, recommended max **50** |
| Session IDs | URL-encoded values decoded automatically |
