import type { ReactNode } from "react";

interface ContentPageProps {
  title: string;
  lead: string;
  children: ReactNode;
}

export function ContentPage({ title, lead, children }: ContentPageProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5 lg:py-14">
        <div className="rounded-md border border-slate-800 bg-slate-900/82 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <p className="text-sm font-semibold text-emerald-300">Football Club Architect</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-8 text-slate-300">{lead}</p>
          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function PageSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-slate-800 bg-slate-950/55 p-3">
          {item}
        </li>
      ))}
    </ul>
  );
}
