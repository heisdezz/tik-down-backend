export default function Footer() {
  return (
    <footer className="bg-base-200 border-t border-base-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-base-content mb-4">About</h3>
            <p className="text-sm text-base-content/70">
              Stream TikTok profile metadata using yt-dlp with zero authentication required.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-base-content mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs" className="text-base-content/70 hover:text-primary transition-colors">
                  API Docs
                </a>
              </li>
              <li>
                <a href="https://github.com/heisdezz/tik-down-backend" className="text-base-content/70 hover:text-primary transition-colors">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://yt-dlp.github.io/yt-dlp/" className="text-base-content/70 hover:text-primary transition-colors">
                  yt-dlp Docs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-base-content mb-4">Technology</h3>
            <ul className="space-y-2 text-sm text-base-content/70">
              <li>React Router</li>
              <li>Tailwind CSS + DaisyUI</li>
              <li>yt-dlp</li>
              <li>Bun Runtime</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-base-300 pt-8">
          <p className="text-center text-sm text-base-content/60">
            Built with ❤️ using React Router. All data sourced via yt-dlp.
          </p>
        </div>
      </div>
    </footer>
  );
}
