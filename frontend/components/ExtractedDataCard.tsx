type ExtractedDataCardProps = {
  text: string;
};

export default function ExtractedDataCard({ text }: ExtractedDataCardProps) {
  return (
    <section className="card-enter rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Extracted Data Preview</h2>
      <div className="mt-4 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {text}
      </div>
    </section>
  );
}
