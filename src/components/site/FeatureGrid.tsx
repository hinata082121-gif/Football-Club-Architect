interface FeatureGridProps {
  features: {
    title: string;
    description: string;
  }[];
}

export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <section
          key={feature.title}
          className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-white">{feature.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">{feature.description}</p>
        </section>
      ))}
    </div>
  );
}
