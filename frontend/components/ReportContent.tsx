import { CSSProperties } from "react";

type ReportContentProps = {
  patientData: {
    basicInfo: {
      patientName: string;
      age?: number;
      gender?: string;
      date: string;
    };
    vitals: {
      bloodPressure?: string;
      heartRate?: string;
      bmi?: string;
    };
    labs: {
      hemoglobin?: string;
      ldlCholesterol?: string;
      bloodGlucose?: string;
    };
    clinical: {
      symptoms?: string;
    };
    familyHistory: {
      diseases?: string;
    };
  };
  observations: string[];
  highRisks: Array<{ title: string; description: string }>;
  mediumRisks: Array<{ title: string; description: string }>;
  lowRisks: Array<{ title: string; description: string }>;
  riskIndicators: Array<{ label: string; level: "high" | "moderate" | "low" }>;
  wellnessInsights: string;
  recommendations: string[];
  lifestyleSuggestions: string[];
};

const riskBadgeStyleMap: Record<"high" | "moderate" | "low", CSSProperties> = {
  high: { backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" },
  moderate: { backgroundColor: "#fef3c7", color: "#b45309", borderColor: "#fde68a" },
  low: { backgroundColor: "#dcfce7", color: "#047857", borderColor: "#a7f3d0" },
};

const headerStyle: CSSProperties = { color: "#111827" };
const mutedStyle: CSSProperties = { color: "#374151" };
const subtleStyle: CSSProperties = { color: "#6b7280" };

export default function ReportContent({ patientData, observations, highRisks, mediumRisks, lowRisks, riskIndicators, wellnessInsights, recommendations, lifestyleSuggestions }: ReportContentProps) {
  return (
    <div className="space-y-8">
      {/* Report Header */}
      <div className="border-b-2 pb-6" style={{ borderColor: "#d1d5db" }}>
        <h1 className="text-3xl font-bold" style={headerStyle}>Medical Report</h1>
        <p className="mt-2 text-sm" style={mutedStyle}>
          AI-Powered Analysis & Patient-Friendly Insights
        </p>
        <p className="mt-4 text-xs" style={subtleStyle}>
          Generated: {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* 1. Individual Profile Summary */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Individual Profile Summary</h2>
        <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "#d1d5db", backgroundColor: "#f9fafb" }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase" style={mutedStyle}>Patient Name</p>
              <p className="mt-1 text-base font-semibold" style={headerStyle}>{patientData.basicInfo.patientName}</p>
            </div>
            {patientData.basicInfo.age !== undefined && (
              <div>
                <p className="text-xs font-semibold uppercase" style={mutedStyle}>Age</p>
                <p className="mt-1 text-base font-semibold" style={headerStyle}>{patientData.basicInfo.age} years</p>
              </div>
            )}
            {patientData.basicInfo.gender && (
              <div>
                <p className="text-xs font-semibold uppercase" style={mutedStyle}>Gender</p>
                <p className="mt-1 text-base font-semibold" style={headerStyle}>{patientData.basicInfo.gender}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase" style={mutedStyle}>Report Date</p>
              <p className="mt-1 text-base font-semibold" style={headerStyle}>{patientData.basicInfo.date}</p>
            </div>
          </div>
          <div className="mt-4 border-t pt-4" style={{ borderColor: "#d1d5db" }}>
            <p className="mb-3 text-xs font-semibold uppercase" style={mutedStyle}>Key Vitals</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {patientData.vitals.bloodPressure && (
                <div>
                  <span className="text-xs" style={mutedStyle}>Blood Pressure</span>
                  <p className="mt-1 font-semibold" style={headerStyle}>{patientData.vitals.bloodPressure}</p>
                </div>
              )}
              {patientData.vitals.heartRate && (
                <div>
                  <span className="text-xs" style={mutedStyle}>Heart Rate</span>
                  <p className="mt-1 font-semibold" style={headerStyle}>{patientData.vitals.heartRate}</p>
                </div>
              )}
              {patientData.vitals.bmi && (
                <div>
                  <span className="text-xs" style={mutedStyle}>BMI</span>
                  <p className="mt-1 font-semibold" style={headerStyle}>{patientData.vitals.bmi}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Observations */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Key Observations from Assessment</h2>
        <ul className="mt-4 space-y-2">
          {observations.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm leading-6" style={mutedStyle}>
              <span className="mt-1 flex-shrink-0" style={{ color: "#2563eb" }}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Interpretation of Findings */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Interpretation of Findings in Simple Language</h2>
        <p className="mt-2 text-sm" style={mutedStyle}>Understanding your health risks and what they mean for you</p>

        {/* High Risk */}
        <div className="mt-4">
          <div className="rounded-lg border p-3" style={{ backgroundColor: "#fee2e2", borderColor: "#fecaca" }}>
            <h3 className="font-bold" style={{ color: "#b91c1c" }}>🔴 High-Level Risks</h3>
          </div>
          <div className="mt-3 space-y-3">
            {highRisks.map((risk, idx) => (
              <div key={idx} className="rounded-lg border-l-4 bg-white p-3 pl-4" style={{ borderLeftColor: "#ef4444" }}>
                <p className="font-semibold" style={headerStyle}>{risk.title}</p>
                <p className="mt-1 text-sm" style={mutedStyle}>{risk.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Medium Risk */}
        <div className="mt-5">
          <div className="rounded-lg border p-3" style={{ backgroundColor: "#fef3c7", borderColor: "#fde68a" }}>
            <h3 className="font-bold" style={{ color: "#b45309" }}>🟡 Medium-Level Risks</h3>
          </div>
          <div className="mt-3 space-y-3">
            {mediumRisks.map((risk, idx) => (
              <div key={idx} className="rounded-lg border-l-4 bg-white p-3 pl-4" style={{ borderLeftColor: "#f59e0b" }}>
                <p className="font-semibold" style={headerStyle}>{risk.title}</p>
                <p className="mt-1 text-sm" style={mutedStyle}>{risk.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Low Risk */}
        <div className="mt-5">
          <div className="rounded-lg border p-3" style={{ backgroundColor: "#dcfce7", borderColor: "#a7f3d0" }}>
            <h3 className="font-bold" style={{ color: "#047857" }}>🟢 Low-Level Risks</h3>
          </div>
          <div className="mt-3 space-y-3">
            {lowRisks.map((risk, idx) => (
              <div key={idx} className="rounded-lg border-l-4 bg-white p-3 pl-4" style={{ borderLeftColor: "#10b981" }}>
                <p className="font-semibold" style={headerStyle}>{risk.title}</p>
                <p className="mt-1 text-sm" style={mutedStyle}>{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Identified Risk Indicators */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Identified Risk Indicators</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {riskIndicators.map((item) => (
            <span
              key={item.label}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={riskBadgeStyleMap[item.level]}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* 5. Wellness Insights */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Wellness Insights</h2>
        <p className="mt-4 text-sm leading-7" style={mutedStyle}>{wellnessInsights}</p>
      </div>

      {/* 6. Personalized Recommendations */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Personalized Recommendations</h2>
        <ul className="mt-4 space-y-2">
          {recommendations.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm leading-6" style={mutedStyle}>
              <span className="mt-1 flex-shrink-0" style={{ color: "#2563eb" }}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. Preventive Lifestyle Suggestions */}
      <div>
        <h2 className="text-xl font-bold" style={headerStyle}>Preventive Lifestyle Suggestions</h2>
        <ul className="mt-4 space-y-2">
          {lifestyleSuggestions.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm leading-6" style={mutedStyle}>
              <span className="mt-1 flex-shrink-0" style={{ color: "#059669" }}>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t-2 pt-6" style={{ borderColor: "#d1d5db" }}>
        <p className="text-xs" style={subtleStyle}>
          This report is generated by MedNexus_Intelligence and is intended for informational purposes only. Please consult with a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
}
