export function Header() {
  return (
    <header className="border-b-2 border-black bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-head text-2xl">kippu 切符</span>
        <nav className="flex gap-6">
          <a href="#" className="font-head text-sm border-b-2 border-primary pb-1">
            Dashboard
          </a>
          <a href="#" className="font-head text-sm text-muted-foreground hover:text-foreground transition-colors">
            Tickets
          </a>
          <a href="#" className="font-head text-sm text-muted-foreground hover:text-foreground transition-colors">
            Settings
          </a>
        </nav>
      </div>
    </header>
  );
}
