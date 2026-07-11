declare module "rahad-all-downloader-v2" {
  interface Alldl {
    (url: string, cookie?: string): Promise<any>;
    tiktok(url: string): Promise<any>;
    fb(url: string): Promise<any>;
    insta(url: string, cookie?: string): Promise<any>;
    likee(url: string): Promise<any>;
    youtube(url: string): Promise<any>;
    threads(url: string): Promise<any>;
    pinterest(url: string): Promise<any>;
    capcut(url: string): Promise<any>;
  }
  export const alldl: Alldl;
}
