import { useState, useEffect } from 'react';
import TopBar, { type ViewMode } from '../components/TopBar';
import OpportunityCard from '../components/OpportunityCard';
import RightPanel from '../components/RightPanel';
import SplitWorkspace from '../components/SplitWorkspace';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useFastCapture } from '../context/FastCaptureContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { type Opportunity, type OpportunityStatus } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  fellowship: 'Fellowship',
  grant: 'Grant',
  accelerator: 'Accelerator',
  job: 'Job',
  conference: 'Conference',
  internship: 'Internship',
};

type FilterStatus = 'all' | 'pending' | 'applied' | 'history';

const STATUS_FILTER_MAP: Record<FilterStatus, OpportunityStatus[] | null> = {
  all: null,
  pending: ['saved', 'in_progress'],
  applied: ['applied', 'shortlisted', 'rejected', 'awarded'],
  history: ['filed', 'rejected', 'awarded'],
};

interface HomePageProps {
  filterMode?: FilterStatus;
}

export default function HomePage({ filterMode = 'all' }: HomePageProps) {
  const { opportunities } = useOpportunities();
  const { captureFromClipboard } = useFastCapture();
  const { setRightPanelWidth: setGlobalRightPanelWidth } = useWorkspace();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [rightPanelWidth, setRightPanelWidthLocal] = useState(0);

  // Keep global context in sync so FAB can offset itself
  useEffect(() => {
    setGlobalRightPanelWidth(rightPanelWidth);
    return () => setGlobalRightPanelWidth(0); // reset when page unmounts
  }, [rightPanelWidth, setGlobalRightPanelWidth]);

  const setRightPanelWidth = (w: number) => {
    setRightPanelWidthLocal(w);
  };

  const statusFilter = STATUS_FILTER_MAP[filterMode];

  const filtered = opportunities.filter((o) => {
    if (statusFilter && !statusFilter.includes(o.status)) return false;
    if (
      search &&
      !o.title.toLowerCase().includes(search.toLowerCase()) &&
      !o.org.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (selectedCategories.length > 0 && !selectedCategories.includes(o.category)) return false;
    return true;
  });

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCardClick = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setRightPanelWidth((prev) => (prev === 0 ? 360 : prev));
  };

  const panelOpen = rightPanelWidth > 0;

  return (
    <div className="flex flex-col h-full">
      <TopBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        rightPanelWidth={rightPanelWidth}
      />

      <main
        className="flex-1 overflow-y-auto scrollbar-thin p-6"
        style={{ marginRight: panelOpen ? rightPanelWidth + 4 : 28 }}
      >
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {selectedCategories.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-burnt-orange/10 text-burnt-orange rounded-full font-medium"
              >
                {CATEGORY_LABELS[id]}
                <button onClick={() => handleCategoryToggle(id)} className="leading-none hover:opacity-70">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState onAdd={() => captureFromClipboard()} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((o) => (
              <OpportunityCard
                key={o.id}
                opp={o}
                isSelected={selectedOpp?.id === o.id}
                onClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => (
              <ListRow key={o.id} opp={o} isSelected={selectedOpp?.id === o.id} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </main>

      <SplitWorkspace
        isOpen={panelOpen}
        onClose={() => setRightPanelWidth(0)}
        panelWidth={rightPanelWidth}
        onWidthChange={setRightPanelWidth}
      >
        <RightPanel
          opp={selectedOpp ?? undefined}
          onClose={() => setRightPanelWidth(0)}
          panelWidth={rightPanelWidth}
          onWidthChange={setRightPanelWidth}
        />
      </SplitWorkspace>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-cream-fill flex items-center justify-center">
        <span className="text-2xl text-burnt-orange font-bold">+</span>
      </div>
      <p className="text-base font-semibold text-slate mb-1">No opportunities found</p>
      <p className="text-sm text-slate/60 mb-5 max-w-sm">
        Copy a link, then click Fast-Capture in the sidebar — no form required.
      </p>
      <button
        onClick={onAdd}
        className="px-5 py-2.5 bg-burnt-orange text-white text-sm font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
      >
        Fast-Capture from clipboard
      </button>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  pending: 'border border-burnt-orange text-burnt-orange',
  saved: 'border border-burnt-orange text-burnt-orange',
  in_progress: 'bg-amber-100 text-amber-700',
  applied: 'border border-blue-400 text-blue-600',
  shortlisted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-50 text-red-600',
  awarded: 'bg-green-100 text-green-700',
  filed: 'bg-green-50 text-green-700',
};

function ListRow({
  opp,
  isSelected,
  onClick,
}: {
  opp: Opportunity;
  isSelected?: boolean;
  onClick?: (o: Opportunity) => void;
}) {
  return (
    <div
      onClick={() => onClick?.(opp)}
      className={`bg-card-white rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150 shadow-sm ${
        isSelected ? 'border-2 border-burnt-orange shadow-md' : 'border border-card-border hover:border-burnt-orange/50 hover:shadow'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm truncate">{opp.title}</p>
        <p className="text-xs text-slate">{opp.org}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate hidden sm:block">{opp.daysLeft}d left</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[opp.status] ?? 'bg-gray-100 text-slate'}`}
        >
          {opp.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}
