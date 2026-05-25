import type { ReactNode } from "react";
import { ArticleLayout } from "@/components/site/ArticleLayout";

interface ContentPageProps {
  title: string;
  lead: string;
  children: ReactNode;
  updatedAt?: string;
}

export function ContentPage({ title, lead, children, updatedAt }: ContentPageProps) {
  return (
    <ArticleLayout title={title} lead={lead} updatedAt={updatedAt}>
      {children}
    </ArticleLayout>
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
    <section className="min-w-0">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="min-w-0 rounded-md border border-slate-800 bg-slate-950/55 p-3">
          {item}
        </li>
      ))}
    </ul>
  );
}
