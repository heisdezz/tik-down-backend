# TikDown API

Backend that streams TikTok profile video metadata via yt-dlp.

**Base URL:** `https://tik-down-backend.vercel.app`

--- 

## Endpoints

### `GET /profile`

Streams video metadata from a TikTok profile as NDJSON (newline-delimited JSON). Results arrive incrementally — each line is a complete JSON object for one video.

#### Query Parameters

| Param   | Required | Description |
|---------|----------|-------------|
| `u`     | Yes      | Username, `@username`, or full `https://www.tiktok.com/@username` URL |
| `limit` | No       | Max number of videos to return. Omit for all. |

#### Example Requests

```
GET /profile?u=charlidamelio
GET /profile?u=@charlidamelio&limit=20
GET /profile?u=https://www.tiktok.com/@charlidamelio&limit=50
```

#### Response

- **Content-Type:** `application/x-ndjson`
- **X-Cache:** `HIT` or `MISS` (5-minute server-side cache per `u` + `limit` combination)
- Each line is a JSON object with the fields below. Parse line-by-line as the stream arrives.

#### Video Object Fields

| Field         | Type    | Description |
|---------------|---------|-------------|
| `id`          | string  | Unique video ID |
| `title`       | string  | Video caption/title |
| `webpage_url` | string  | Full TikTok video URL |
| `url`         | string  | Fallback URL if `webpage_url` is absent |
| `thumbnail`   | string  | Thumbnail image URL |
| `thumbnails`  | array   | All available thumbnails — last entry is highest quality |
| `duration`    | number  | Duration in seconds |
| `uploader`    | string  | Username of the uploader |
| `view_count`  | number? | View count (may be absent) |
| `like_count`  | number? | Like count (may be absent) |

#### Error Responses

All errors return JSON with a single `error` string field.

| Status | Condition |
|--------|-----------|
| `400`  | Missing `u` param |
| `400`  | Malformed URL |
| `400`  | URL is not a `tiktok.com` link |
| `400`  | Username fails format check (1–24 chars, letters/numbers/`_`/`.`) |
| `404`  | Profile does not exist on TikTok |
| `404`  | Profile exists but has no public videos |
| `502`  | Could not reach TikTok |

```json
{ "error": "TikTok profile not found" }
```

---

## Consuming the Stream

### Dart / Flutter

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> fetchProfile(String username, {int? limit}) async {
  final uri = Uri.https('tik-down-backend.vercel.app', '/profile', {
    'u': username,
    if (limit != null) 'limit': '$limit',
  });

  final request = http.Request('GET', uri);
  final response = await http.Client().send(request);

  if (response.statusCode != 200) {
    final body = await response.stream.bytesToString();
    final err = jsonDecode(body)['error'];
    throw Exception(err);
  }

  final lines = response.stream
      .transform(utf8.decoder)
      .transform(const LineSplitter());

  await for (final line in lines) {
    if (line.trim().isEmpty) continue;
    final video = jsonDecode(line) as Map<String, dynamic>;
    print(video['title']);
    // add to your state list here
  }
}
```

### React Native / JavaScript

```js
async function fetchProfile(username, limit = 20) {
  const params = new URLSearchParams({ u: username, limit: String(limit) });
  const res = await fetch(`https://tik-down-backend.vercel.app/profile?${params}`);

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error);
  }

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
        console.log(video.title, video.thumbnail);
        // append to your state array
      }
    }
  }
}
```

### Swift (iOS)

```swift
func fetchProfile(username: String, limit: Int = 20) async throws {
    var components = URLComponents(string: "https://tik-down-backend.vercel.app/profile")!
    components.queryItems = [
        URLQueryItem(name: "u", value: username),
        URLQueryItem(name: "limit", value: "\(limit)"),
    ]

    let (stream, response) = try await URLSession.shared.bytes(from: components.url!)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw URLError(.badServerResponse)
    }

    for try await line in stream.lines {
        guard !line.isEmpty,
              let data = line.data(using: .utf8),
              let video = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { continue }
        print(video["title"] ?? "")
        // append to your @Published array
    }
}
```

---

## Caching Behaviour

- Cache TTL: **5 minutes**
- Cache key: `profileUrl + limit`
- Cached responses replay stored lines instantly (no yt-dlp invocation)
- Check `X-Cache: HIT` response header to confirm a cache hit
- Different `limit` values for the same profile are cached separately

---

## Validation Rules

| Input | Rule |
|-------|------|
| Username | 1–24 characters, `[a-zA-Z0-9_.]` only |
| `@username` | Leading `@` is stripped before validation |
| Full URL | Must parse as valid URL with hostname ending in `tiktok.com` |
| `limit` | Optional integer. Recommended client-side max: **50** |
