import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  MessageSquare,
  Briefcase,
  History,
  Settings,
  HelpCircle,
  BookOpen,
  LogOut,
  ChevronUp,
  Sparkles,
  Download,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: MessageSquare, label: 'Chats', path: '/chats' },
  { icon: Briefcase, label: 'Applied', path: '/applied' },
  { icon: History, label: 'History', path: '/history' },
];

const bottomLinks: Array<{
  icon: typeof BookOpen;
  label: string;
  path?: string;
  action?: () => void;
}> = [
  { icon: BookOpen, label: 'Docs', action: () => window.open('https://clnch.app/docs', '_blank') },
  { icon: HelpCircle, label: 'Get help', action: () => window.open('https://clnch.app/help', '_blank') },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Sidebar uses its own color variables so it adapts per theme
const S = {
  text: 'var(--sidebar-text)',
  textMuted: 'var(--sidebar-text-muted)',
  textStrong: 'var(--sidebar-text-strong)',
  activeBg: 'var(--sidebar-active-bg)',
  hoverBg: 'var(--sidebar-hover-bg)',
  border: 'var(--sidebar-border)',
  popupBg: 'var(--sidebar-popup-bg)',
};

function NavTooltip({ label, children, show }: { label: string; children: ReactNode; show: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {show && visible && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap z-[60] shadow-lg pointer-events-none"
          style={{
            backgroundColor: 'var(--sidebar-popup-bg)',
            color: 'var(--sidebar-text-strong)',
            border: '1px solid var(--sidebar-border)',
          }}
        >
          {label}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: 'var(--sidebar-popup-bg)' }}
          />
        </div>
      )}
    </div>
  );
}

export default function NavSidebar() {
  const { expanded, width, toggleExpanded } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const user = { name: 'Sandra Mensah', email: 'sandramensah2437@gmail.com', initial: 'S', plan: 'Free plan' };

  return (
    <aside
      style={{
        width,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col select-none"
    >
      {/* Brand */}
      <div className="flex items-center px-3 py-3 min-h-[56px] flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-lg flex items-center justify-center shadow-md border border-burnt-orange/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {expanded && (
            <span className="font-bold text-burnt-orange text-[15px] tracking-[0.18em] uppercase whitespace-nowrap overflow-hidden">
              CLNCH
            </span>
          )}
        </div>
      </div>

      <div className="mx-3 flex-shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }} />

      {/* Main nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-hidden overflow-y-auto scrollbar-thin">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <NavTooltip key={path} label={label} show={!expanded}>
              <button
                onClick={() => navigate(path)}
                style={{
                  color: active ? 'var(--sidebar-text-strong)' : 'var(--sidebar-text)',
                  backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                    e.currentTarget.style.color = 'var(--sidebar-text-strong)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--sidebar-text)';
                  }
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  !expanded ? 'justify-center' : ''
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {expanded && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
              </button>
            </NavTooltip>
          );
        })}
      </nav>

      {/* Bottom utilities */}
      <div className="px-2 space-y-0.5 flex-shrink-0">
        <div className="mx-1 mb-2" style={{ borderTop: '1px solid var(--sidebar-border)' }} />

        {bottomLinks.map(({ icon: Icon, label, path, action }) => {
          const active = path ? isActive(path) : false;
          return (
            <NavTooltip key={label} label={label} show={!expanded}>
              <button
                onClick={() => (path ? navigate(path) : action?.())}
                style={{
                  color: active ? 'var(--sidebar-text-strong)' : 'var(--sidebar-text)',
                  backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                    e.currentTarget.style.color = 'var(--sidebar-text-strong)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--sidebar-text)';
                  }
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  !expanded ? 'justify-center' : ''
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {expanded && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
              </button>
            </NavTooltip>
          );
        })}

        {/* Get Extension */}
        <NavTooltip label="Get Extension" show={!expanded}>
          <button
            style={{ color: 'var(--sidebar-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
              e.currentTarget.style.color = 'var(--sidebar-text-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--sidebar-text)';
            }}
            onClick={() => window.open('chrome://extensions/', '_blank')}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              !expanded ? 'justify-center' : ''
            }`}
          >
            <Download className="w-[18px] h-[18px] flex-shrink-0" />
            {expanded && <span className="whitespace-nowrap overflow-hidden">Get Extension</span>}
          </button>
        </NavTooltip>

        {/* Profile */}
        <div className="relative pt-1" ref={profileRef}>
          {profileOpen && (
            <div
              className="absolute bottom-full left-0 mb-1 rounded-xl shadow-2xl overflow-hidden z-50"
              style={{
                width: expanded ? '100%' : 240,
                left: expanded ? 0 : 56,
                backgroundColor: 'var(--sidebar-popup-bg)',
                border: '1px solid var(--sidebar-border)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--sidebar-text-strong)' }}>{user.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--sidebar-text-muted)' }}>{user.email}</p>
                <span className="text-[10px] font-medium uppercase tracking-wider mt-1 inline-block" style={{ color: 'var(--sidebar-text-muted)' }}>
                  {user.plan}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/settings?tab=billing'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--sidebar-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Zap className="w-4 h-4 text-burnt-orange flex-shrink-0" />
                  <span className="text-burnt-orange font-medium">Upgrade Tier</span>
                </button>
              </div>
              <div className="py-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          <NavTooltip label={user.name} show={!expanded}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                backgroundColor: profileOpen ? 'var(--sidebar-active-bg)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!profileOpen) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (!profileOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${
                !expanded ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-burnt-orange to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-semibold text-[13px]">{user.initial}</span>
              </div>
              {expanded && (
                <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--sidebar-text-strong)' }}>{user.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--sidebar-text-muted)' }}>{user.plan}</p>
                  </div>
                  <ChevronUp
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${profileOpen ? 'rotate-0' : 'rotate-180'}`}
                    style={{ color: 'var(--sidebar-text-muted)' }}
                  />
                </div>
              )}
            </button>
          </NavTooltip>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleExpanded}
          style={{ color: 'var(--sidebar-text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text-muted)';
          }}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 mt-1 mb-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
            !expanded ? 'justify-center' : ''
          }`}
        >
          {expanded ? (
            <>
              <ChevronsLeft className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="whitespace-nowrap">Collapse</span>
            </>
          ) : (
            <ChevronsRight className="w-[18px] h-[18px] flex-shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
