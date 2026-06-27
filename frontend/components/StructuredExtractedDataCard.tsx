type SectionData = {
  title: string;
  items: Array<{ label: string; value: string }>;
};

type StructuredExtractedDataCardProps = {
  sections: SectionData[];
};

export default function StructuredExtractedDataCard({
  sections,
}: StructuredExtractedDataCardProps) {
  return (
    <section className="card-enter rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Extracted Medical Data</h2>

      <div className="mt-5 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="border-b border-slate-200 pb-5 last:border-0">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              {section.title}
            </h3>
            <div className="mt-3 space-y-2">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
