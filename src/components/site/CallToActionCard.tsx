import Link from "next/link";

interface CallToActionCardProps {
  title: string;
  description: string;
  href: string;
  label: string;
}

export function CallToActionCard({ title, description, href, label }: CallToActionCardProps) {
  return (
    <section className="rounded-2xl border border-emerald-400/30 bg-emerald-950/25 p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-emerald-50/85">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 sm:w-auto"
      >
        {label}
      </Link>
    </section>
  );
}
