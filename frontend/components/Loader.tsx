type LoaderProps = {
  label?: string;
};

export default function Loader({ label = "Analyzing report" }: LoaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-white px-4 py-3 text-slate-700 shadow-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      <span className="text-sm font-semibold">{label}...</span>
    </div>
  );
}
