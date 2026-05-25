interface UpdateTimelineProps {
  updates: {
    title: string;
    description: string;
  }[];
}

export function UpdateTimeline({ updates }: UpdateTimelineProps) {
  return (
    <ol className="grid gap-3">
      {updates.map((update) => (
        <li key={update.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm font-semibold text-white">{update.title}</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">{update.description}</p>
        </li>
      ))}
    </ol>
  );
}
