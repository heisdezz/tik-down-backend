import { YtDlp } from "ytdlp-nodejs";
import { join } from "path";

const binaryPath = join(
  process.cwd(),
  "bin",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

const ytdlp = new YtDlp({ binaryPath });

export const loader = async () => {
  const info = await ytdlp.getInfoAsync(
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
  );
  return {
    message: "hello world",
    data: info,
  };
};
