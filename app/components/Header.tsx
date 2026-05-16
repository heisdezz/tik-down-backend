export default function Header() {
  return (
    <header className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              tik-down
            </div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">
              API
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
              Docs
            </a>
            <a href="https://github.com/heisdezz/tik-down-backend" className="text-sm font-medium hover:text-primary transition-colors">
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
