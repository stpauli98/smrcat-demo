import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/posiljke", label: "Pošiljke" },
  { href: "/kupci", label: "Kupci" },
  { href: "/kooperanti", label: "Kooperanti" },
];

export function TopNav() {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Smrčak početna">
          <span
            aria-hidden
            className="w-8 h-8 rounded-full bg-forest text-primary-foreground flex items-center justify-center font-serif font-semibold"
          >
            S
          </span>
          <span className="font-serif font-semibold text-xl text-forest tracking-tight">
            SMRČAK
          </span>
        </Link>
        <nav aria-label="Glavna navigacija">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-forest hover:bg-cream rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
