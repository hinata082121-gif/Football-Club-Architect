import Link from "next/link";

const primaryLinks = [
  { href: "/#play", label: "Play" },
  { href: "/how-to-play", label: "How to Play" },
  { href: "/features", label: "Features" },
  { href: "/faq", label: "FAQ" },
  { href: "/updates", label: "Updates" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/94 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="min-w-0 shrink-0">
          <span className="block text-base font-semibold tracking-normal">Football Club Architect</span>
          <span className="mt-0.5 block text-xs text-emerald-200">AIクラブ経営シミュレーション</span>
        </Link>
        <nav aria-label="サイトナビゲーション" className="max-w-full overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
