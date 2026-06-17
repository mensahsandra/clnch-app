import { type Opportunity } from '../types';

const categoryColors: Record<string, string> = {
  fellowship: 'bg-purple-50 text-purple-700 border-purple-200',
  grant: 'bg-green-50 text-green-700 border-green-200',
  accelerator: 'bg-blue-50 text-blue-700 border-blue-200',
  job: 'bg-sky-50 text-sky-700 border-sky-200',
  conference: 'bg-amber-50 text-amber-700 border-amber-200',
  internship: 'bg-pink-50 text-pink-700 border-pink-200',
};

const statusStyles: Record<string, string> = {
  pending: 'border border-burnt-orange text-burnt-orange',
  saved: 'border border-burnt-orange text-burnt-orange',
  in_progress: 'bg-amber-100 text-amber-700',
  applied: 'border border-blue-400 text-blue-600',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
  awarded: 'bg-green-100 text-green-700',
  filed: 'bg-green-50 text-green-600 border border-green-300',
};

const categoryLabel: Record<string, string> = {
  fellowship: 'Fellowship',
  grant: 'Grant',
  accelerator: 'Accelerator',
  job: 'Job',
  conference: 'Conference',
  internship: 'Internship',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  saved: 'Saved',
  in_progress: 'In Progress',
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  awarded: 'Awarded',
  filed: 'Filed',
};

interface OpportunityCardProps {
  opp: Opportunity;
  isSelected?: boolean;
  onClick?: (opp: Opportunity) => void;
}

export default function OpportunityCard({ opp, isSelected, onClick }: OpportunityCardProps) {
  return (
    <div
      onClick={() => onClick?.(opp)}
      className={`bg-card-white rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-2 border-burnt-orange shadow-md'
          : 'border border-card-border hover:border-burnt-orange/50'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
            categoryColors[opp.category] ?? 'bg-gray-50 text-slate border-gray-200'
          }`}
        >
          {categoryLabel[opp.category] ?? opp.category}
        </span>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
            statusStyles[opp.status] ?? 'bg-gray-100 text-slate'
          }`}
        >
          {statusLabel[opp.status] ?? opp.status}
        </span>
      </div>

      {/* Monitor status */}
      {(opp.monitorStatus === 'watching' || opp.monitorStatus === 'changed') && (
        <div
          className={`mb-3 px-2.5 py-2 rounded-lg text-xs ${
            opp.monitorStatus === 'changed'
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-cream-fill border border-card-border text-slate'
          }`}
        >
          {opp.monitorStatus === 'changed' ? (
            <>
              <span className="font-semibold">Something changed</span>
              {opp.changeSummary && <p className="mt-0.5 leading-snug">{opp.changeSummary}</p>}
              <button
                className="mt-1 text-burnt-orange font-semibold hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (opp.link) window.open(opp.link, '_blank');
                }}
              >
                Check now →
              </button>
            </>
          ) : (
            <span>
              Watching — last checked {opp.lastCheckedAt ?? 'recently'}
            </span>
          )}
        </div>
      )}

      {/* Org name */}
      <h3 className="font-bold text-[18px] text-charcoal mb-2.5 leading-snug">
        {opp.org}
      </h3>

      {/* Title */}
      <p className="text-sm text-slate mb-3 line-clamp-1">{opp.title}</p>

      {/* Requirements preview */}
      {opp.requirements && opp.requirements.length > 0 && (
        <ul className="space-y-1 mb-4">
          {opp.requirements.slice(0, 3).map((req, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-slate">
              <span className="text-burnt-orange mt-0.5 flex-shrink-0">•</span>
              <span className="line-clamp-1">{req}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-card-border/60">
        <span
          className={`text-xs font-medium ${
            opp.daysLeft <= 7 ? 'text-red-500' : opp.daysLeft <= 14 ? 'text-amber-600' : 'text-slate'
          }`}
        >
          {opp.daysLeft} days remaining
        </span>
        <button
          className="text-xs font-semibold text-burnt-orange hover:text-burnt-orange/80 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(opp);
          }}
        >
          Manage Pitch →
        </button>
      </div>
    </div>
  );
}
