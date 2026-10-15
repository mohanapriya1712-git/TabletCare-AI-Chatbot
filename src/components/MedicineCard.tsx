import { Pill, FlaskConical, Activity, ShieldAlert, AlertTriangle, BookCheck } from "lucide-react";
import type { Medicine } from "@/types";

interface MedicineCardProps {
  medicine: Medicine;
}

function InfoSection({
  icon,
  title,
  items,
  accentClass,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  accentClass: string;
}) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={accentClass}>{icon}</span>
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      <ul className="space-y-1.5 ml-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-teal-500 mt-1 shrink-0">•</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MedicineCard({ medicine }: MedicineCardProps) {
  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 overflow-hidden shadow-sm">
      {/* Header with image */}
      <div className="flex flex-col sm:flex-row">
        {medicine.image_url ? (
          <div className="w-full sm:w-44 h-40 sm:h-auto shrink-0 overflow-hidden bg-slate-100">
            <img
              src={medicine.image_url}
              alt={`${medicine.name} medicine photograph`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full sm:w-44 h-40 sm:h-auto shrink-0 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
            <Pill className="w-12 h-12 text-blue-300" strokeWidth={1.5} />
          </div>
        )}

        <div className="flex-1 p-4">
          <div className="flex items-start gap-2">
            <Pill className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <h3 className="text-lg font-bold text-slate-800">{medicine.name}</h3>
              <p className="text-sm text-teal-600 font-medium mt-0.5">
                {medicine.active_ingredient}
              </p>
            </div>
          </div>
          {medicine.aliases.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {medicine.aliases.slice(0, 5).map((alias) => (
                <span
                  key={alias}
                  className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
                >
                  {alias}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info sections */}
      <div className="px-4 pb-4 space-y-4">
        <InfoSection
          icon={<Activity className="w-4 h-4" strokeWidth={2} />}
          title="Common Uses"
          items={medicine.common_uses}
          accentClass="text-teal-600"
        />
        <InfoSection
          icon={<FlaskConical className="w-4 h-4" strokeWidth={2} />}
          title="Possible Side Effects"
          items={medicine.side_effects}
          accentClass="text-amber-500"
        />
        <InfoSection
          icon={<ShieldAlert className="w-4 h-4" strokeWidth={2} />}
          title="Precautions"
          items={medicine.precautions}
          accentClass="text-blue-600"
        />
        <InfoSection
          icon={<AlertTriangle className="w-4 h-4" strokeWidth={2} />}
          title="Important Warnings"
          items={medicine.important_warnings}
          accentClass="text-red-500"
        />

        {/* Source */}
        <div className="border-t border-slate-100 pt-4 flex items-start gap-2">
          <BookCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" strokeWidth={2} />
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-0.5">Source</h4>
            <p className="text-sm text-slate-500">{medicine.source}</p>
          </div>
        </div>
      </div>

      {/* Medical disclaimer footer */}
      <div className="bg-amber-50/60 px-4 py-2.5 border-t border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            This information is for educational purposes only. Always consult a doctor or pharmacist
            before starting, stopping, or changing any medication.
          </span>
        </p>
      </div>
    </div>
  );
}
