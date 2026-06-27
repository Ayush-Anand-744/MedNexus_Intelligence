type RiskItem = {
  title: string;
  description: string;
};

type RiskLevelSectionProps = {
  riskLevel: "high" | "medium" | "low";
  title: string;
  items: RiskItem[];
  icon?: string;
};

const riskConfig = {
  high: {
    bgColor: "bg-rose-50 border-rose-200",
    headerColor: "bg-rose-100 text-rose-900",
    icon: "🔴",
    accentBorder: "border-l-4 border-rose-500",
  },
  medium: {
    bgColor: "bg-amber-50 border-amber-200",
    headerColor: "bg-amber-100 text-amber-900",
    icon: "🟡",
    accentBorder: "border-l-4 border-amber-500",
  },
  low: {
    bgColor: "bg-emerald-50 border-emerald-200",
    headerColor: "bg-emerald-100 text-emerald-900",
    icon: "🟢",
    accentBorder: "border-l-4 border-emerald-500",
  },
};

export default function RiskLevelSection({
  riskLevel,
  title,
  items,
  icon,
}: RiskLevelSectionProps) {
  const config = riskConfig[riskLevel];

  return (
    <section className={`card-enter rounded-2xl border ${config.bgColor} p-6 shadow-sm`}>
      <div className={`rounded-lg ${config.headerColor} px-4 py-3`}>
        <p className="text-sm font-bold uppercase tracking-widest">
          {icon || config.icon} {title}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className={`rounded-lg border-l-4 bg-white p-4 ${config.accentBorder}`}>
            <p className="font-semibold text-slate-800">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
