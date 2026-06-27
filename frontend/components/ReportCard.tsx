import { ReactNode } from "react";

type ReportCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function ReportCard({ title, children, className = "" }: ReportCardProps) {
  return (
    <section
      className={`card-enter rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <h3 className="text-base font-semibold uppercase tracking-wide text-sky-700">{title}</h3>
      <div className="mt-4 text-slate-700">{children}</div>
    </section>
  );
}
