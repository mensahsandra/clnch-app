import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

interface HomePageProps {
  filterMode?: 'all' | 'applied' | 'pending' | 'history';
}

export default function HomePage({ filterMode = 'all' }: HomePageProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { opportunities } = useOpportunities();
  const { captureFromClipboard } = useFastCapture();
  const { setRightPanelWidth: setWorkspaceRightPanelWidth } = useWorkspace();
  const { completed, spotlightCompleted } = useOnboarding();
  const isNewUser = completed && !spotlightCompleted;
  const navigate = useNavigate();

  useEffect(() => {
    setWorkspaceRightPanelWidth(rightPanelWidth);
  }, [rightPanelWidth, setWorkspaceRightPanelWidth]);

  const filtered = opportunities.filter((opp) => {
    const matchesSearch = [opp.title, opp.org, opp.category].some((field) =>
      field?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!matchesSearch) return false;
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(opp.category);
    if (!matchesCategory) return false;

    switch (filterMode) {
      case 'applied':
        return opp.status === 'applied' || opp.status === 'shortlisted';
      case 'pending':
        return opp.status === 'saved' || opp.status === 'in_progress';
      case 'history':
        return opp.status === 'filed' || opp.status === 'rejected' || opp.status === 'awarded';
      default:
        return true;
    }
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
          onSearchChange={setSearchQuery}
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
            <div className="flex-1 overflow-y-auto p-6">
              {filtered.length === 0 ? (
                <EmptyState onAdd={() => captureFromClipboard()} />
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { profile, completed } = useOnboarding();
  const isNewUser = completed && !profile.extensionInstalled;
  const navigate = useNavigate();

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
              onClick={() => navigate('/discover')}
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
