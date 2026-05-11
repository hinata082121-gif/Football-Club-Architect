import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:px-5 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-semibold text-white">Football Club Architect</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            AIスタッフ、監督、スカウト、財務判断を通じてクラブを育てる、開発中のクラブ経営シミュレーションです。
          </p>
        </div>
        <nav aria-label="フッターナビゲーション" className="flex flex-wrap gap-3 text-sm">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
