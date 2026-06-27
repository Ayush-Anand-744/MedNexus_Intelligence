type ProfileSummaryCardProps = {
  patientName: string;
  age?: number;
  gender?: string;
  date: string;
  vitals: {
    bloodPressure?: string;
    heartRate?: string;
    bmi?: string;
  };
};

export default function ProfileSummaryCard({
  patientName,
  age,
  gender,
  date,
  vitals,
}: ProfileSummaryCardProps) {
  return (
    <section className="card-enter rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-sky-900">Individual Profile Summary</h2>
      
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Patient Name</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{patientName}</p>
          </div>
          
          {age !== undefined && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Age</p>
              <p className="mt-1 text-base font-semibold text-slate-800">{age} years</p>
            </div>
          )}
          
          {gender && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Gender</p>
              <p className="mt-1 text-base font-semibold text-slate-800">{gender}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Report Date</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{date}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-sky-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Key Vitals</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {vitals.bloodPressure && (
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-xs text-slate-600">Blood Pressure</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{vitals.bloodPressure}</p>
            </div>
          )}
          {vitals.heartRate && (
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-xs text-slate-600">Heart Rate</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{vitals.heartRate}</p>
            </div>
          )}
          {vitals.bmi && (
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-xs text-slate-600">BMI</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{vitals.bmi}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
