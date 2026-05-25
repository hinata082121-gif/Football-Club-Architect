import { defaultAuthor } from "@/lib/siteMeta";

interface AuthorBoxProps {
  name?: string;
  role?: string;
  basis?: string;
  updatedAt?: string;
}

export function AuthorBox({
  name = defaultAuthor.name,
  role = defaultAuthor.role,
  basis = defaultAuthor.basis,
  updatedAt = defaultAuthor.updatedAt,
}: AuthorBoxProps) {
  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Author / Update</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p>
          <span className="block text-slate-500">著者</span>
          <span className="font-medium text-white">{name}</span>
        </p>
        <p>
          <span className="block text-slate-500">役割</span>
          <span className="font-medium text-white">{role}</span>
        </p>
        <p className="sm:col-span-2">
          <span className="block text-slate-500">本文の根拠</span>
          <span>{basis}に基づいて作成しています。</span>
        </p>
        <p>
          <span className="block text-slate-500">最終更新</span>
          <span>{updatedAt}</span>
        </p>
      </div>
    </aside>
  );
}
