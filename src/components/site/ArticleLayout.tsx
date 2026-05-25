import type { ReactNode } from "react";
import { AuthorBox } from "@/components/site/AuthorBox";

interface ArticleLayoutProps {
  title: string;
  lead: string;
  children: ReactNode;
  updatedAt?: string;
}

export function ArticleLayout({ title, lead, children, updatedAt }: ArticleLayoutProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/82 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-emerald-300">Football Club Architect</p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-300">{lead}</p>
          <div className="mt-8 space-y-8 break-words text-sm leading-7 text-slate-300">
            {children}
          </div>
          <div className="mt-8">
            <AuthorBox updatedAt={updatedAt} />
          </div>
        </div>
      </article>
    </main>
  );
}
