import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  CreditCard,
  Shield,
  Zap,
  Link2,
  Settings,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  Download,
  Brain,
  Globe,
  Mail,
  Calendar,
  Key,
  Trash2,
  Bell,
  Check,
  FileText,
  Briefcase,
  Target,
  Rocket,
  Sparkles,
  Lightbulb,
  Link as LinkIcon,
  BookOpen,
  GraduationCap,
  Pencil,
} from 'lucide-react';
import { useMonitoring } from '../context/MonitoringContext';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'knowledge', label: 'Knowledge', icon: Brain },
  { id: 'account', label: 'Account', icon: User },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'capabilities', label: 'Capabilities', icon: Zap },
  { id: 'monitoring', label: 'Monitoring', icon: Globe },
  { id: 'connectors', label: 'Connectors', icon: Link2 },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-burnt-orange' : 'bg-card-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  action,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        {description && <p className="text-xs text-slate mt-0.5">{description}</p>}
      </div>
      {action ?? (
        checked !== undefined && onChange && (
          <Toggle checked={checked} onChange={disabled ? () => {} : onChange} />
        )
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card-white border border-card-border rounded-xl overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-card-border bg-cream/40">
        <h2 className="text-sm font-semibold text-charcoal">{title}</h2>
      </div>
      <div className="px-5 divide-y divide-card-border/60">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('general');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { enabled, setEnabled, monitors, removeMonitor } = useMonitoring();

  // General state
  const [fullName, setFullName] = useState('Sandra Mensah');
  const [preferredName, setPreferredName] = useState('Sandra');
  const [background, setBackground] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('English');

  // Scroll to billing if ?tab=billing is in the URL
  useEffect(() => {
    if (searchParams.get('tab') === 'billing') {
      setTimeout(() => {
        scrollTo('billing');
      }, 100);
    }
  }, [searchParams]);

  // Privacy state
  const [locationTracking, setLocationTracking] = useState(false);
  const [dataTraining, setDataTraining] = useState(true);

  // Capabilities state
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [toolAccess, setToolAccess] = useState('needed');
  const [webSearch, setWebSearch] = useState(false);
  const [sandboxArtifacts, setSandboxArtifacts] = useState(true);
  const [aiArtifacts, setAiArtifacts] = useState(false);
  const [inlineViz, setInlineViz] = useState(true);
  const [codeExec, setCodeExec] = useState(false);
  const [networkEgress, setNetworkEgress] = useState(false);

  // Connectors state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [apiProvider, setApiProvider] = useState('Anthropic');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiModel, setApiModel] = useState('claude-3-5-sonnet-20241022');

  // Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const modelOptions: Record<string, string[]> = {
    Anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    OpenRouter: ['meta-llama/llama-3-70b-instruct', 'mistralai/mixtral-8x7b', 'google/gemini-pro'],
  };

  // Theme definitions for the visual picker
  const THEMES: Array<{
    id: 'warm' | 'forest' | 'clay' | 'system';
    label: string;
    description: string;
    swatches: string[];
  }> = [
    {
      id: 'warm',
      label: 'Warm Cream',
      description: 'Default. Soft warm tones.',
      swatches: ['#FDFBF7', '#F5F2ED', '#EBE8E2'],
    },
    {
      id: 'forest',
      label: 'Forest',
      description: 'Deep greens and sage.',
      swatches: ['#d3d6d1', '#bcd1ca', '#0a1611'],
    },
    {
      id: 'clay',
      label: 'Clay',
      description: 'Warm terracotta & earth.',
      swatches: ['#c3b6a9', '#655b4d', '#d4b096'],
    },
    {
      id: 'system',
      label: 'System',
      description: 'Follows your OS setting.',
      swatches: ['#f0f0f0', '#888888', '#1a1a1a'],
    },
  ];

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <aside className="w-[240px] flex-shrink-0 bg-card-white border-r border-card-border overflow-y-auto">
        <div className="px-4 py-5">
          <h1 className="text-base font-bold text-charcoal mb-4">Settings</h1>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === id
                    ? 'bg-cream-fill text-burnt-orange'
                    : 'text-slate hover:bg-cream-fill/60 hover:text-charcoal'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {activeSection === id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-burnt-orange/60" />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Right Canvas */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin p-6"
        onScroll={(e) => {
          const el = e.currentTarget;
          for (const id of SECTIONS.map((s) => s.id)) {
            const ref = sectionRefs.current[id];
            if (ref && ref.offsetTop - el.scrollTop < 200) {
              setActiveSection(id);
            }
          }
        }}
      >
        {/* ── GENERAL ── */}
        <section ref={(el) => { sectionRefs.current['general'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">General</h2>

          <SectionCard title="Profile Configuration">
            <div className="py-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Preferred Name</label>
                <input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} className="input-field" placeholder="What should we call you?" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Work / Builder Background</label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Describe your professional background, current role, and areas of focus..."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Instructions for CLNCH">
            <div className="py-3">
              <label className="text-xs font-medium text-slate mb-1.5 block">System Prompt Instructions</label>
              <p className="text-xs text-slate/70 mb-2">Provide persistent profile context that your AI Coach will remember across all workspace sessions.</p>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="input-field font-mono text-xs resize-none"
                rows={5}
                placeholder="e.g. Always draft responses in a confident, first-person voice. Lead with quantifiable outcomes. Avoid jargon. My field is sustainable AI research..."
              />
            </div>
          </SectionCard>

          <SectionCard title="Appearance">
            <div className="py-3">
              <p className="text-xs text-slate mb-3">Choose a colour theme for your workspace. Changes apply instantly.</p>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      theme === t.id
                        ? 'border-burnt-orange shadow-sm shadow-burnt-orange/20'
                        : 'border-card-border hover:border-card-border/80 hover:shadow-sm'
                    }`}
                  >
                    {/* Swatch row */}
                    <div className="flex gap-1 mb-2">
                      {t.swatches.map((color, i) => (
                        <div
                          key={i}
                          className="h-5 rounded-md flex-1 border border-black/5"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-charcoal">{t.label}</p>
                    <p className="text-[10px] text-slate mt-0.5">{t.description}</p>
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-burnt-orange flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Language">
            <div className="py-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
              >
                {['English', 'French', 'Spanish', 'Portuguese', 'Arabic', 'Swahili', 'Hausa', 'Yoruba'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </SectionCard>
        </section>

        {/* ── KNOWLEDGE ── */}
        <section ref={(el) => { sectionRefs.current['knowledge'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">Knowledge</h2>
          <p className="text-sm text-slate mb-4">
            Add context about yourself so CLNCH can reference your background in coaching conversations and provide more personalised, relevant results.
          </p>

          <SectionCard title="Professional Profile">
            <div className="py-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Current Role / Title</label>
                <input className="input-field" placeholder="e.g. Software Engineer, Founder, Student..." />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Background Summary</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Describe your professional background, skills, and experience..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">LinkedIn Profile</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
                    <input className="input-field pl-8" placeholder="linkedin.com/in/..." />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">GitHub Profile</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
                    <input className="input-field pl-8" placeholder="github.com/..." />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Facebook / Portfolio</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
                    <input className="input-field pl-8" placeholder="facebook.com/... or portfolio URL" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Business Website</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
                    <input className="input-field pl-8" placeholder="yourcompany.com" />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="CV / Resume">
            <div className="py-3">
              <p className="text-xs text-slate mb-2">Upload your latest CV or resume. CLNCH will use it to tailor coaching and application advice.</p>
              <div className="border-2 border-dashed border-card-border rounded-xl p-6 text-center hover:border-burnt-orange/30 transition-colors cursor-pointer">
                <FileText className="w-8 h-8 text-slate/30 mx-auto mb-2" />
                <p className="text-sm text-slate font-medium">Drop your CV here or click to upload</p>
                <p className="text-xs text-slate/60 mt-1">PDF or DOCX, up to 5MB</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Goals & Aspirations">
            <div className="py-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">What are you looking for?</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="e.g. Fellowships in AI research, grants for climate startups, remote engineering roles..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Short-term Goals (3-6 months)</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="e.g. Apply to 3 fellowships, secure funding for my startup, land a senior role..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Long-term Vision</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="e.g. Build a sustainable AI company in Africa, become a research leader..."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="About You">
            <div className="py-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Are you a founder, entrepreneur, or builder?</label>
                <div className="flex flex-wrap gap-2">
                  {['Founder', 'Entrepreneur', 'Builder', 'Student', 'Researcher', 'Professional', 'Freelancer'].map((role) => (
                    <button key={role} className="px-3 py-1.5 rounded-full border border-card-border text-xs text-slate hover:bg-cream-fill hover:text-charcoal transition-colors">
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Current Projects / Ideas</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="What are you working on right now? Any ideas, side projects, or ventures?"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Recent Achievements</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="e.g. Published a paper, launched an MVP, won a hackathon, got a promotion..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate mb-1 block">Anything else CLNCH should know?</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Context that helps CLNCH coach you better — your writing style, communication preferences, specific challenges, etc."
                />
              </div>
            </div>
          </SectionCard>
        </section>

        {/* ── ACCOUNT ── */}
        <section ref={(el) => { sectionRefs.current['account'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">Account</h2>

          <SectionCard title="Primary Identifier">
            <div className="py-3">
              <input
                disabled
                value="sandramensah2437@gmail.com"
                className="input-field bg-cream-fill text-slate cursor-not-allowed"
              />
            </div>
          </SectionCard>

          <SectionCard title="Active Sessions">
            <div className="py-1 space-y-0">
              {[
                { device: 'Chrome on macOS', location: 'Accra, Ghana', created: '2026-05-10', active: 'Just now' },
                { device: 'Safari on iPhone', location: 'Accra, Ghana', created: '2026-05-18', active: '3h ago' },
                { device: 'Firefox on Windows', location: 'London, UK', created: '2026-06-01', active: '2d ago' },
              ].map((s, i) => (
                <div key={i} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{s.device}</p>
                    <p className="text-xs text-slate">{s.location} · Created {s.created}</p>
                    <p className="text-xs text-slate/60">Last active: {s.active}</p>
                  </div>
                  <button className="text-xs text-red-500 hover:underline flex-shrink-0">Revoke</button>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Danger Zone</p>
            <p className="text-xs text-red-600/80 mb-3">This action is permanent and cannot be undone.</p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Permanent Account Deletion
            </button>
          </div>
        </section>

        {/* ── PRIVACY ── */}
        <section ref={(el) => { sectionRefs.current['privacy'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">Privacy</h2>

          <SectionCard title="Data Tracking Controls">
            <SettingRow
              label="Location Metadata Tracking"
              description="Enables geo-targeted event data processing"
              checked={locationTracking}
              onChange={setLocationTracking}
            />
            <SettingRow
              label="Help Improve CLNCH Model Processing"
              description="Toggles data training logging metrics"
              checked={dataTraining}
              onChange={setDataTraining}
            />
          </SectionCard>

          <SectionCard title="Data Management">
            <SettingRow
              label="Export Full User Data Ledger"
              action={
                <button className="text-xs font-medium text-burnt-orange hover:underline flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              }
            />
            <SettingRow
              label="Manage Globally Shared Conversation Links"
              action={
                <button className="text-xs font-medium text-slate hover:text-burnt-orange flex items-center gap-1 transition-colors">
                  <Link2 className="w-3.5 h-3.5" />
                  Manage
                </button>
              }
            />
            <SettingRow
              label="Edit/Clear Core Memory Vector Ledger"
              action={
                <button className="text-xs font-medium text-slate hover:text-burnt-orange flex items-center gap-1 transition-colors">
                  <Brain className="w-3.5 h-3.5" />
                  Edit
                </button>
              }
            />
          </SectionCard>
        </section>

        {/* ── BILLING ── */}
        <section ref={(el) => { sectionRefs.current['billing'] = el; }} className="mb-8">
          <div className={`flex items-center gap-2 mb-4 ${searchParams.get('tab') === 'billing' ? 'animate-pulse' : ''}`}>
            <h2 className="text-lg font-bold text-charcoal">Billing</h2>
            {searchParams.get('tab') === 'billing' && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-burnt-orange/10 text-burnt-orange">
                Upgrade available
              </span>
            )}
          </div>

          {/* Highlight banner when arriving from Upgrade Tier */}
          {searchParams.get('tab') === 'billing' && (
            <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-burnt-orange/10 border border-burnt-orange/30 animate-fade-in">
              <Zap className="w-5 h-5 text-burnt-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-charcoal">Unlock the full CLNCH experience</p>
                <p className="text-xs text-slate mt-0.5">Upgrade your tier to get unlimited captures, voice profiling, and priority AI coaching.</p>
              </div>
            </div>
          )}

          <div className="bg-card-white border border-card-border rounded-xl p-5 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-burnt-orange/10 text-burnt-orange text-xs font-bold px-3 py-1 rounded-full mb-2">
                  PRO EDITION
                </div>
                <h3 className="text-sm font-bold text-charcoal mb-3">Current Plan Features</h3>
                <ul className="space-y-1.5">
                  {[
                    'Unlimited Firecrawl URL Parsing',
                    'Continuous Cross-Device Sync',
                    'Native Voice Analysis Model Access',
                    'Priority AI Coach Response Queue',
                    'Advanced Pipeline Analytics',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-charcoal">
                      <span className="w-1.5 h-1.5 rounded-full bg-burnt-orange flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button className="w-full py-3 px-4 bg-burnt-orange text-white font-semibold rounded-xl hover:bg-burnt-orange/90 transition-colors text-sm">
            Upgrade Subscription Tier / Manage Workspace Seats
          </button>
        </section>

        {/* ── CAPABILITIES ── */}
        <section ref={(el) => { sectionRefs.current['capabilities'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">Capabilities</h2>

          <SectionCard title="Memory">
            <SettingRow
              label="Memory"
              description="Generate active memory logs from chat history"
              checked={memoryEnabled}
              onChange={setMemoryEnabled}
            />
            <SettingRow
              label="Import Memory Archive"
              action={
                <button className="text-xs font-medium text-burnt-orange hover:underline flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  Import
                </button>
              }
            />
          </SectionCard>

          <SectionCard title="Tool Access">
            <div className="py-3">
              <label className="text-xs font-medium text-slate mb-1.5 block">Tool Access Pipeline</label>
              <select
                value={toolAccess}
                onChange={(e) => setToolAccess(e.target.value)}
                className="input-field"
              >
                <option value="needed">Load when explicitly needed</option>
                <option value="always">Always run in background</option>
                <option value="never">Never activate</option>
              </select>
            </div>
          </SectionCard>

          <SectionCard title="Data & Rendering">
            <SettingRow
              label="Live Connector Web Search Sync"
              description="Toggles real-time background search engine loops"
              checked={webSearch}
              onChange={setWebSearch}
            />
            <SettingRow
              label="Enable Sandbox Artifact Panels"
              checked={sandboxArtifacts}
              onChange={setSandboxArtifacts}
            />
            <SettingRow
              label="AI-Powered Live Interactive Artifact Mockups"
              checked={aiArtifacts}
              onChange={setAiArtifacts}
            />
            <SettingRow
              label="Inline UI Visualizations"
              description="Control layout charting renders"
              checked={inlineViz}
              onChange={setInlineViz}
            />
          </SectionCard>

          <SectionCard title="Code Execution Sandbox">
            <SettingRow
              label="Allow Sandbox Script Compilation"
              description="Enable temporary file output processing"
              checked={codeExec}
              onChange={setCodeExec}
            />
            <div className={`pl-4 border-l-2 ${codeExec ? 'border-burnt-orange/30' : 'border-card-border'}`}>
              <SettingRow
                label="Allow Network Egress Transmission"
                description="Permit active code scripts to request external server resources"
                checked={networkEgress}
                onChange={setNetworkEgress}
                disabled={!codeExec}
              />
            </div>
          </SectionCard>
        </section>

        {/* ── MONITORING ── */}
        <section ref={(el) => { sectionRefs.current['monitoring'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">Monitoring</h2>

          <SectionCard title="Web Change Detection">
            <SettingRow
              label="Enable opportunity monitoring"
              description="Detect when content changes on tracked websites and get notified via Firecrawl monitors"
              checked={enabled}
              onChange={setEnabled}
            />
          </SectionCard>

          {enabled && (
            <SectionCard title="Monitored websites">
              {monitors.length === 0 ? (
                <div className="py-6 text-center">
                  <Bell className="w-8 h-8 text-slate/30 mx-auto mb-2" />
                  <p className="text-sm text-slate">No monitors yet</p>
                  <p className="text-xs text-slate/60 mt-1">
                    Track opportunities on Discover or add URLs from the Monitoring tab
                  </p>
                </div>
              ) : (
                monitors.map((m) => (
                  <div key={m.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal">{m.name}</p>
                      <p className="text-xs text-slate truncate">{m.url}</p>
                      <p className="text-xs text-slate/70 mt-1 italic">&ldquo;{m.goal}&rdquo;</p>
                      {m.changeSummary && (
                        <p className="text-xs text-amber-700 mt-1 font-medium">{m.changeSummary}</p>
                      )}
                      <p className="text-[10px] text-slate/50 mt-1 uppercase tracking-wide">
                        {m.status === 'changed' ? 'Change detected' : `Watching · ${m.lastCheckedAt}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMonitor(m.id)}
                      className="p-1.5 text-slate hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove monitor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </SectionCard>
          )}

          <div className="bg-cream-fill border border-card-border rounded-xl p-4 text-xs text-slate leading-relaxed">
            <p className="font-semibold text-charcoal mb-1">How monitoring works</p>
            <p>
              When you track an opportunity, CLNCH watches the page for application openings, deadline
              changes, eligibility updates, or downtime. Firecrawl summarizes what changed — not the raw
              diff — so you know whether to act.
            </p>
          </div>
        </section>

        {/* ── CONNECTORS ── */}
        <section ref={(el) => { sectionRefs.current['connectors'] = el; }} className="mb-8">
          <h2 className="text-lg font-bold text-charcoal mb-4">Connectors</h2>

          <SectionCard title="Gmail Integration">
            <div className="py-3 space-y-3">
              {gmailConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-charcoal">Connected to: sandramensah2437@gmail.com</span>
                  </div>
                  <button
                    onClick={() => setGmailConnected(false)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setGmailConnected(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream-fill transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Authenticate and Connect Gmail Workspace Profile
                </button>
              )}
              <p className="text-xs text-slate/70 leading-relaxed">
                If an opportunity requires profile materials delivered via email, CLNCH automatically crafts an optimized outreach outline, appends your voice-tailored credentials, and presents a confirmation panel for you to Send, Edit, or Discard before transit.
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Google Calendar">
            <SettingRow
              label="Sync Deadline Reminders to Calendar"
              description="Extract application deadlines as native calendar events"
              checked={calendarSync}
              onChange={setCalendarSync}
              action={
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate" />
                  <Toggle checked={calendarSync} onChange={setCalendarSync} />
                </div>
              }
            />
          </SectionCard>

          <SectionCard title="Custom API Key (BYOK)">
            <div className="py-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUseCustomKey(false)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all text-left ${
                    !useCustomKey
                      ? 'border-burnt-orange bg-burnt-orange/5 text-burnt-orange'
                      : 'border-card-border text-slate hover:bg-cream-fill'
                  }`}
                >
                  <div className="font-semibold mb-0.5">CLNCH Default</div>
                  <div className="text-slate text-[10px]">Claude 3.5 Sonnet via Pro</div>
                </button>
                <button
                  onClick={() => setUseCustomKey(true)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all text-left ${
                    useCustomKey
                      ? 'border-burnt-orange bg-burnt-orange/5 text-burnt-orange'
                      : 'border-card-border text-slate hover:bg-cream-fill'
                  }`}
                >
                  <div className="font-semibold mb-0.5">Custom Key</div>
                  <div className="text-slate text-[10px]">Bring your own API</div>
                </button>
              </div>

              {useCustomKey && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">Provider</label>
                    <select
                      value={apiProvider}
                      onChange={(e) => { setApiProvider(e.target.value); setApiModel(modelOptions[e.target.value][0]); }}
                      className="input-field"
                    >
                      {Object.keys(modelOptions).map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate/50" />
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="input-field pl-8 pr-10 font-mono text-xs"
                        placeholder="sk-ant-..."
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/50 hover:text-slate transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">Model</label>
                    <select
                      value={apiModel}
                      onChange={(e) => setApiModel(e.target.value)}
                      className="input-field"
                    >
                      {(modelOptions[apiProvider] ?? []).map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary text-sm py-2">Save API Configuration</button>
                </div>
              )}
            </div>
          </SectionCard>
        </section>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-card-white border border-card-border rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-charcoal mb-2">Delete Account Permanently</h3>
            <p className="text-sm text-slate mb-5 leading-relaxed">
              This will permanently delete all your opportunities, sessions, voice profiles, and data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream-fill transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
