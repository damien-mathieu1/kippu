import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/" },
  { label: "Tickets", to: "/tickets" },
];

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="border-b-2 border-black bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-head text-2xl">kippu 切符</span>
        <nav className="flex gap-6">
          {NAV_ITEMS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "font-head text-sm transition-colors",
                pathname === to
                  ? "border-b-2 border-primary pb-1"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
