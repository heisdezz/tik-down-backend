declare module "tk4-downloader" {
  export class TikTokDownloader {
    constructor(options?: any);
    downloadVideo(url: string): Promise<any>;
    downloadVideos(urls: string[]): Promise<any[]>;
    getDetailedStats(): any;
    resetStats(): void;
  }
}
