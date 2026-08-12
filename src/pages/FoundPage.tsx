import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar, { type ViewMode } from '../components/TopBar';
import OpportunityCard from '../components/OpportunityCard';
import RightPanel from '../components/RightPanel';
import DraggableSplitter from '../components/DraggableSplitter';
import QuickTip from '../components/QuickTip';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useFastCapture } from '../context/FastCaptureContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useOnboarding } from '../context/OnboardingContext';
import { type Opportunity } from '../types';
import {
  Inbox,
  ClipboardPaste,
  Compass,
  Archive,
} from 'lucide-react';

type StatusTab = 'all' | 'saved' | 'applied' | 'in_progress' | 'offer' | 'archived';

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'in_progress', label: 'In Process' },
  { id: 'offer', label: 'Offer' },
  { id: 'archived', label: 'Archived' },
];

export default function FoundPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const { opportunities } = useOpportunities();
  const { captureFromClipboard } = useFastCapture();
  const { setRightPanelWidth: setWorkspaceRightPanelWidth } = useWorkspace();
  const { completed, spotlightCompleted } = useOnboarding();
  const isNewUser = completed && !spotlightCompleted;

  useEffect(() => {
    setWorkspaceRightPanelWidth(rightPanelWidth);
  }, [rightPanelWidth, setWorkspaceRightPanelWidth]);

  // Sync search query to URL
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchQuery) {
      setSearchQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  };

  const filtered = opportunities.filter((opp) => {
    const matchesSearch = [opp.title, opp.org, opp.category].some((field) =>
      field?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!matchesSearch) return false;
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(opp.category);
    if (!matchesCategory) return false;
    if (statusTab === 'archived') {
      if (!opp.archived) return false;
    } else {
      if (opp.archived) return false;
      if (statusTab !== 'all' && opp.status !== statusTab) return false;
    }
    return true;
  });

  const handleSelect = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    if (viewMode === 'list') {
      setRightPanelWidth(400);
    }
  };

  const handleResize = (width: number) => setRightPanelWidth(Math.max(300, Math.min(600, width)));

  return (
    <div className="flex h-full overflow-hidden" data-tour="pipeline">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          search={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategories={selectedCategories}
          onCategoryToggle={(id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
          rightPanelWidth={rightPanelWidth}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {isNewUser && (
              <div className="px-6 pt-4">
                <QuickTip tipId="detail-click" />
              </div>
            )}
            <div className="px-6 pt-3 pb-2 flex items-center gap-1 border-b border-card-border/60 overflow-x-auto scrollbar-thin">
              {STATUS_TABS.map((tab) => {
                const count = tab.id === 'archived'
                  ? opportunities.filter(o => o.archived).length
                  : tab.id === 'all'
                    ? opportunities.filter(o => !o.archived).length
                    : opportunities.filter(o => !o.archived && o.status === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors relative ${
                      statusTab === tab.id
                        ? 'text-burnt-orange'
                        : 'text-slate hover:text-charcoal'
                    }`}
                  >
                    {tab.id === 'archived' && <Archive className="w-3.5 h-3.5" />}
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      statusTab === tab.id ? 'bg-burnt-orange/10 text-burnt-orange' : 'bg-cream-fill text-slate/60'
                    }`}>
                      {count}
                    </span>
                    {statusTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-burnt-orange rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {filtered.length === 0 ? (
                <EmptyState onAdd={() => captureFromClipboard()} tab={statusTab} />
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filtered.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opp={opp}
                      onClick={() => handleSelect(opp)}
                      isSelected={selectedOpportunity?.id === opp.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {selectedOpportunity && viewMode === 'list' && (
            <>
              <DraggableSplitter
                rightPanelWidth={rightPanelWidth}
                onWidthChange={handleResize}
                hasSelection={!!selectedOpportunity}
              />
              <div
                style={{ width: rightPanelWidth, transition: 'width 0.3s' }}
                className="flex-shrink-0 overflow-hidden"
              >
                <RightPanel
                  opp={selectedOpportunity}
                  onClose={() => setSelectedOpportunity(null)}
                  panelWidth={rightPanelWidth}
                  onWidthChange={handleResize}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd, tab }: { onAdd: () => void; tab: StatusTab }) {
  const { profile, completed } = useOnboarding();
  const isNewUser = completed && !profile.extensionInstalled;

  if (tab === 'archived') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-cream-fill rounded-2xl flex items-center justify-center mb-4">
          <Archive className="w-8 h-8 text-slate/30" />
        </div>
        <p className="text-sm font-medium text-slate mb-1">No archived opportunities</p>
        <p className="text-xs text-slate/60 max-w-xs">
          Archived opportunities will appear here. Use the archive option in a card's menu to set an opportunity aside without deleting it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="w-16 h-16 bg-cream-fill rounded-2xl flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-slate/30" />
      </div>
      <p className="text-sm font-medium text-slate mb-1">
        {isNewUser ? `Welcome, ${profile.preferredName || 'there'}!` : 'No opportunities yet'}
      </p>
      <p className="text-xs text-slate/60 mb-4 max-w-xs">
        {isNewUser
          ? "Let's capture your first opportunity. Copy any link and press Ctrl+Shift+V, or try the demo below."
          : 'Copy any opportunity link and press Ctrl+Shift+V to capture it instantly.'}
      </p>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button onClick={onAdd} className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
          <ClipboardPaste className="w-4 h-4" />
          Paste from clipboard
        </button>

        {isNewUser && (
          <>
            <button
              onClick={() => window.open('/discover', '_self')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream-fill transition-colors"
            >
              <Compass className="w-4 h-4" />
              Browse Discover
            </button>
            <div className="flex items-center gap-2 text-xs text-slate/60 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-burnt-orange animate-pulse" />
              <span>Pro tip: Install the Chrome extension for one-click capture</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
