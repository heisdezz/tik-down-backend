function findKey(obj: any, targetKey: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[targetKey] !== undefined) return obj[targetKey];
  for (const k of Object.keys(obj)) {
    const val = findKey(obj[k], targetKey);
    if (val !== undefined) return val;
  }
  return undefined;
}

function parseTikTokHtml(html: string, resultId?: string): any {
  let parsedJson: any = null;

  // 1. Try __UNIVERSAL_DATA_FOR_REHYDRATION__
  const rehydrationMatch = html.match(/<script[^>]*__UNIVERSAL_DATA_FOR_REHYDRATION__[^>]*>([\s\S]*?)<\/script>/);
  if (rehydrationMatch) {
    try {
      parsedJson = JSON.parse(rehydrationMatch[1]);
    } catch { }
  }

  // 2. Try SIGI_STATE
  if (!parsedJson) {
    const sigiMatch = html.match(/<script[^>]*SIGI_STATE[^>]*>([\s\S]*?)<\/script>/);
    if (sigiMatch) {
      try {
        parsedJson = JSON.parse(sigiMatch[1]);
      } catch { }
    }
  }

  if (!parsedJson) {
    return null;
  }

  // Extract itemStruct
  let itemStruct = findKey(parsedJson, "itemStruct");

  // If itemStruct not found but we have ItemModule (from SIGI_STATE)
  if (!itemStruct) {
    const itemModule = findKey(parsedJson, "ItemModule");
    if (itemModule) {
      const keys = Object.keys(itemModule);
      if (keys.length > 0) {
        const key = resultId && itemModule[resultId] ? resultId : keys[0];
        itemStruct = itemModule[key];
      }
    }
  }

  return itemStruct || null;
}

export async function parse(result: any): Promise<any> {
  if (!result || typeof result !== "object") {
    return { error: "no-result" };
  }

  let htmlData: any = null;
  if (typeof result.data === "string" && result.data.includes("<html")) {
    htmlData = parseTikTokHtml(result.data, result.id);
  }

  const maybe = (keys: string[]) => {
    if (htmlData) {
      for (const k of keys) {
        if (k === "id" && htmlData.id !== undefined) return htmlData.id;
        if (k === "videoId" && htmlData.id !== undefined) return htmlData.id;
        if (k === "title" && htmlData.desc !== undefined) return htmlData.desc;
        if (k === "desc" && htmlData.desc !== undefined) return htmlData.desc;
        if (k === "description" && htmlData.desc !== undefined) return htmlData.desc;

        if (k === "url" && htmlData.video?.downloadAddr) return htmlData.video.downloadAddr;
        if (k === "url" && htmlData.video?.playAddr) return htmlData.video.playAddr;

        if (k === "duration" && htmlData.video?.duration !== undefined) return htmlData.video.duration;

        if (k === "author" && htmlData.author?.nickname) return htmlData.author.nickname;
        if (k === "authorName" && htmlData.author?.nickname) return htmlData.author.nickname;

        if (k === "authorId" && htmlData.author?.id !== undefined) return htmlData.author.id;
        if (k === "author_unique_id" && htmlData.author?.uniqueId !== undefined) return htmlData.author.uniqueId;

        if (k === "cover" && htmlData.video?.cover) return htmlData.video.cover;
        if (k === "thumbnail" && htmlData.video?.cover) return htmlData.video.cover;
      }
    }

    for (const k of keys) {
      if (result[k] !== undefined) return result[k];
    }
    return undefined;
  };

  const id = maybe(["id", "videoId", "mediaId", "vid", "aweme_id"]);
  const title = maybe(["title", "name", "desc", "description"]);
  const url = maybe(["url", "videoUrl", "downloadUrl", "playUrl", "source"]);
  const duration = maybe(["duration", "length", "lengthSeconds"]);

  const authorName = maybe(["author", "authorName", "uploader", "creatorName"]);
  const authorId = maybe(["authorId", "uploaderId", "creatorId", "author_unique_id"]);

  let thumbnails: string[] = [];
  if (htmlData?.video) {
    if (htmlData.video.cover) thumbnails.push(htmlData.video.cover);
    if (htmlData.video.originCover) thumbnails.push(htmlData.video.originCover);
    if (htmlData.video.dynamicCover) thumbnails.push(htmlData.video.dynamicCover);
  }
  if (thumbnails.length === 0) {
    const rawThumb = maybe(["thumbnail", "thumbnailUrl", "thumbnails", "cover", "covers"]);
    thumbnails = Array.isArray(rawThumb) ? rawThumb : rawThumb ? [rawThumb] : [];
  }

  const parsedResponse: any = {
    id: id ?? null,
    title: title ?? null,
    description: maybe(["description", "desc"]) ?? null,
    url: url ?? null,
    duration: typeof duration === "string" ? Number(duration) : duration ?? null,
    author: {
      id: authorId ?? null,
      name: authorName ?? null,
      uniqueId: htmlData?.author?.uniqueId ?? null,
    },
    thumbnails,
    // raw: result,
  };

  if (htmlData) {
    parsedResponse.itemStruct = htmlData;
  }

  return parsedResponse;
}

export default parse;
