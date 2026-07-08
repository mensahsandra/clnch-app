import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { supabase } from '../services/supabase';
import {
  Rocket,
  CheckCircle2,
  Menu,
  X as CloseIcon,
  Instagram,
  Twitter,
  Linkedin,
  AtSign,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';

const VIDEO_URL =
  'https://stream.mux.com/Q3hYHAcLU82ceOUgwDeO4HiwOc3WZn9JD02PugwzxHOI.m3u8';

const SOCIAL_HUB = [
  { icon: Instagram, label: 'Instagram', handle: '@clnch.app', url: '#', color: 'hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/8' },
  { icon: Twitter,   label: 'X / Twitter', handle: '@clnch_app', url: '#', color: 'hover:text-sky-400 hover:border-sky-400/30 hover:bg-sky-400/8' },
  { icon: AtSign,    label: 'Threads',    handle: '@clnch',     url: '#', color: 'hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/8' },
  { icon: Linkedin,  label: 'LinkedIn',   handle: 'CLNCH',      url: '#', color: 'hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/8' },
];


// ── Animated Logo (morph: grid → blob) ──────────────────────────────────────
function AnimatedLogo() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 800);
  };

  const active = isHovered || isClicked;

  return (
    <div
      className="flex items-center gap-2.5 cursor-pointer select-none group pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative w-6 h-6 md:w-7 md:h-7 flex items-center justify-center">
        {/* State A: 2×2 square grid */}
        <motion.div
          className="grid grid-cols-2 gap-0.5 absolute"
          animate={{ scale: active ? 0 : 1, opacity: active ? 0 : 1, rotate: active ? -45 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#E06D14] rounded-[1px] transition-all duration-300 group-hover:rounded-full"
            />
          ))}
        </motion.div>

        {/* State B: cute blob */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: 45 }}
              animate={{
                scale: isClicked ? [1.15, 0.85, 1.05, 0.95, 1] : 1,
                opacity: 1,
                rotate: 0,
                y: isClicked ? [0, -4, 2, -1, 0] : 0,
              }}
              exit={{ scale: 0, opacity: 0, rotate: -45 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              className="absolute w-7 h-7 md:w-8 md:h-8 flex items-center justify-center overflow-visible"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full select-none overflow-visible" style={{ filter: 'drop-shadow(0 2px 8px rgba(224,109,20,0.45))' }}>
                <path d="M 50,14 C 76,14 86,30 86,58 C 86,81 74,84 50,84 C 26,84 14,81 14,58 C 14,30 24,14 50,14 Z" fill="#E06D14" stroke="#1a0a00" strokeWidth="6" strokeLinejoin="round" />
                <ellipse cx="34" cy="52" rx="10" ry="14" fill="#1a0a00" />
                <circle cx="32" cy="46" r="3.5" fill="#fff" />
                <ellipse cx="66" cy="52" rx="10" ry="14" fill="#1a0a00" />
                <circle cx="64" cy="46" r="3.5" fill="#fff" />
                <ellipse cx="20" cy="62" rx="5.5" ry="3.5" fill="#f09060" />
                <ellipse cx="80" cy="62" rx="5.5" ry="3.5" fill="#f09060" />
                <path d="M 43,65 Q 50,71 57,65" fill="none" stroke="#1a0a00" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="text-lg md:text-xl font-black tracking-tighter text-white group-hover:text-[#E06D14] transition-colors duration-300">
        CLNCH.app
      </span>
    </div>
  );
}

// ── Kikai tooltip ────────────────────────────────────────────────────────────
function KikaiTranslation({ side = 'left' }: { side?: 'left' | 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const show = isOpen || isHovered;

  return (
    <div
      ref={ref}
      className="relative inline-block cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
    >
      <span className="flex items-center gap-1.5 text-white/65 hover:text-white transition-colors text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
        Kikai-tsukamu (機会をつかむ)
        <Rocket className="w-3 h-3 text-[#E06D14] shrink-0" />
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full mb-3 z-[200] w-64 p-3.5 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl ${side === 'right' ? 'right-0' : 'left-0'}`}
          >
            <div className={`absolute top-full w-3 h-3 bg-neutral-900 border-r border-b border-white/10 rotate-45 -translate-y-1.5 ${side === 'right' ? 'right-4' : 'left-4'}`} />
            <p className="text-[11px] leading-relaxed text-white/90">
              Translates to{' '}
              <span className="text-[#E06D14] font-semibold">"to seize the opportunity"</span>{' '}
              or{' '}
              <span className="text-[#E06D14] font-semibold">"clinch the chance"</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackWhatsapp, setFeedbackWhatsapp] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const clnchRef = useRef<HTMLSpanElement>(null);
  const [maskParams, setMaskParams] = useState<{
    panelW: number; panelH: number;
    textX: number; textBaseline: number;
    fontSize: number; letterSpacing: number;
  } | null>(null);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const compute = () => {
      const panel = panelRef.current;
      const text = clnchRef.current;
      if (!panel || !text) return;
      const pr = panel.getBoundingClientRect();
      const tr = text.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(text).fontSize);
      setMaskParams({
        panelW: pr.width,
        panelH: pr.height,
        textX: tr.left - pr.left,
        textBaseline: tr.bottom - pr.top,
        fontSize: fs,
        letterSpacing: fs * -0.04,
      });
    };
    compute();
    // Re-measure on resize and after fonts load
    const ro = new ResizeObserver(compute);
    if (panelRef.current) ro.observe(panelRef.current);
    document.fonts.ready.then(compute);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.playbackRate = 0.7;
        video.play().catch(() => {});
      });
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_URL;
      video.addEventListener('loadedmetadata', () => {
        video.playbackRate = 0.7;
        video.play().catch(() => {});
      });
    }
  }, []);

  const initialLoadHandledRef = useRef(false);
  useEffect(() => {
    if (!loading && !initialLoadHandledRef.current) {
      initialLoadHandledRef.current = true;
      if (user) navigate('/'); // already logged in when arriving at /auth
    }
  }, [loading, user, navigate]);

  const handleGoogleSignIn = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth' },
      });
      if (error) { setError(error.message); setSubmitting(false); }
    } catch {
      setError('Failed to initiate Google sign in');
      setSubmitting(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message || 'Invalid credentials. Please try again.');
        else setShowOnboardingPrompt(true);
      } else {
        const { error, needsConfirmation } = await signUp(email, password);
        if (error) setError(error.message || 'Sign up failed. Please try again.');
        else if (needsConfirmation) setError('Check your email for a confirmation link, then come back to sign in.');
        else setShowOnboardingPrompt(true);
      }
    } finally { setSubmitting(false); }
  }, [mode, email, password, signIn, signUp]);

  const handleOnboardingChoice = useCallback((choice: 'yes' | 'no') => {
    if (choice === 'yes') {
      setShowFeedbackForm(true);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 800);
    }
  }, [navigate]);

  const handleFeedbackSubmit = useCallback(async () => {
    setFeedbackSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase
          .from('user_profiles')
          .update({ full_name: feedbackName || null, whatsapp_number: feedbackWhatsapp || null })
          .eq('user_id', currentUser.id);
      }
    } catch { /* non-critical — proceed */ } finally {
      setFeedbackSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/'), 800);
    }
  }, [feedbackName, feedbackWhatsapp, navigate]);

  return (
    <div className="relative h-screen w-full font-sans text-white selection:bg-white/20 bg-black overflow-hidden">

      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" muted loop playsInline autoPlay />
      </div>

      {/* Split layout */}
      <div className="absolute inset-0 z-10 flex flex-col lg:flex-row">

        {/* ── LEFT PANEL ── */}
        <div
          ref={panelRef}
          className="relative w-full lg:w-1/2 h-full flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5"
        >

          {/*
            Inline SVG mask: defines the CLNCH cookie-cutter stencil.
            White rect = keep frosted glass. Black text = punch hole → raw video shows through.
            Coordinates are measured from the actual DOM at runtime so the font matches exactly.
          */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
            <defs>
              <mask
                id="clnchMask"
                maskUnits="userSpaceOnUse"
                x={0} y={0}
                width={maskParams?.panelW ?? 800}
                height={maskParams?.panelH ?? 900}
              >
                <rect x={0} y={0} width={maskParams?.panelW ?? 800} height={maskParams?.panelH ?? 900} fill="white" />
                {maskParams && (
                  <text
                    x={maskParams.textX}
                    y={maskParams.textBaseline}
                    fontFamily="Inter, sans-serif"
                    fontWeight={900}
                    fontSize={maskParams.fontSize}
                    letterSpacing={maskParams.letterSpacing}
                    fill="black"
                    dominantBaseline="auto"
                  >
                    CLNCH
                  </text>
                )}
              </mask>
            </defs>
          </svg>

          {/* Frosted glass overlay — mask punches out CLNCH letter shapes → raw video visible inside */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: 'rgba(131, 131, 131, 0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              mask: 'url(#clnchMask)',
              WebkitMask: 'url(#clnchMask)',
            }}
          />

          {/* Content layer */}
          <div
            className="relative z-10 flex flex-col h-full overflow-y-auto no-scrollbar"
            style={{ paddingTop: '56px' }}
          >
            <div className="flex flex-col px-6 md:px-10 pt-2 pb-8">

              {/* CLNCH text — transparent anchor for mask measurement + accent line */}
              <div className="relative mb-5">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/40" />
                <span
                  ref={clnchRef}
                  aria-hidden="true"
                  className="block pointer-events-none select-none"
                  style={{
                    fontSize: 'clamp(64px, 11.5vw, 148px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: 'transparent',
                  }}
                >
                  CLNCH
                </span>
              </div>

              {/* Auth card zone */}
              <AnimatePresence mode="wait">

                {/* ── Main auth form ── */}
                {!showOnboardingPrompt && !success && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-md rounded-2xl border border-white/10 relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E06D14]/8 rounded-full blur-3xl pointer-events-none" />
                    <div className="p-5 flex flex-col gap-4">

                      {/* Header */}
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
                          Welcome to CLNCH.
                        </h2>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {mode === 'signup'
                            ? 'Create your account to get started. CLNCH keeps your data on your device.'
                            : 'Sign in to get started. CLNCH keeps your data on your device.'}
                        </p>
                      </div>

                      {/* Google button */}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleGoogleSignIn}
                        className="w-full bg-white text-neutral-900 hover:bg-neutral-100 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Continue with Google
                      </button>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-grow bg-white/15" />
                        <span className="text-[10px] text-white/45">or</span>
                        <div className="h-px flex-grow bg-white/15" />
                      </div>

                      {/* Email + password form */}
                      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full rounded-xl py-3 px-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#E06D14]/70 transition-all caret-white"
                          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                        />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full rounded-xl py-3 px-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#E06D14]/70 transition-all caret-white"
                          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                        />

                        {error && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">
                            {error}
                          </motion.p>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-[#E06D14] hover:bg-[#c95e0e] text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'signup' ? 'Create account' : 'Sign in'}
                        </button>

                        {/* Mode toggle link */}
                        <p className="text-center text-xs text-white/50">
                          {mode === 'signup' ? (
                            <>Already have an account?{' '}
                              <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[#E06D14] hover:underline cursor-pointer font-medium">Sign in</button>
                            </>
                          ) : (
                            <>Don&apos;t have an account?{' '}
                              <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-[#E06D14] hover:underline cursor-pointer font-medium">Create account</button>
                            </>
                          )}
                        </p>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* ── Onboarding prompt ── */}
                {showOnboardingPrompt && !showFeedbackForm && !success && (
                  <motion.div
                    key="onboarding-prompt"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden relative"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                  >
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#E06D14] to-amber-400" />
                    <div className="p-5">
                      <h3 className="text-base font-bold tracking-tight mb-1 text-white">You&apos;re in!</h3>
                      <p className="text-xs text-white/60 leading-relaxed mb-5">Before you dive in — would you like to help us shape CLNCH? It only takes 30 seconds.</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOnboardingChoice('yes')}
                          className="w-full bg-[#E06D14] hover:bg-[#c95e0e] text-white py-3 rounded-xl font-bold text-sm transition-all cursor-pointer active:scale-[0.98]"
                        >
                          Yes, happy to help
                        </button>
                        <button
                          onClick={() => handleOnboardingChoice('no')}
                          className="w-full bg-white/8 hover:bg-white/14 border border-white/10 text-white/70 hover:text-white py-3 rounded-xl font-medium text-sm transition-all cursor-pointer"
                        >
                          No thanks, take me in
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Help us improve CLNCH feedback form ── */}
                {showFeedbackForm && !success && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                  >
                    <div className="p-5 flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-bold tracking-tight text-white mb-2">Help us improve CLNCH</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          CLNCH is in active development and we talk to early users a lot. Leave your details if you&apos;re open to us reaching out for user testing and feedback. Both fields are optional, and that&apos;s all they&apos;re used for.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1.5 block">
                            Name <span className="text-white/35 normal-case tracking-normal font-normal">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={feedbackName}
                            onChange={(e) => setFeedbackName(e.target.value)}
                            placeholder="Your name"
                            className="w-full rounded-xl py-3 px-4 text-sm placeholder-white/35 focus:outline-none focus:border-[#E06D14]/70 transition-all caret-white"
                            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1.5 block">
                            WhatsApp Number <span className="text-white/35 normal-case tracking-normal font-normal">(optional)</span>
                          </label>
                          <input
                            type="tel"
                            value={feedbackWhatsapp}
                            onChange={(e) => setFeedbackWhatsapp(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="w-full rounded-xl py-3 px-4 text-sm placeholder-white/35 focus:outline-none focus:border-[#E06D14]/70 transition-all caret-white"
                            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleFeedbackSubmit}
                        disabled={feedbackSubmitting}
                        className="w-full bg-[#E06D14] hover:bg-[#c95e0e] text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
                      >
                        {feedbackSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Redirecting ── */}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md rounded-2xl border border-[#E06D14]/30 p-6 text-center relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#E06D14] to-amber-400" />
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 bg-[#E06D14]/10 rounded-full flex items-center justify-center border border-[#E06D14]/30">
                        <CheckCircle2 className="w-6 h-6 text-[#E06D14]" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold tracking-tight mb-1">Welcome to CLNCH</h3>
                    <p className="text-xs text-white/60 leading-relaxed">Taking you to your workspace...</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="relative hidden lg:flex w-1/2 h-full flex-col overflow-hidden">

          {/* Decorative crosshair / target rings */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Outer ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52vh] h-[52vh] border border-white/10 rounded-full" />
              {/* Inner ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28vh] h-[28vh] border border-white/10 rounded-full" />
              {/* Cross hairs */}
              <div className="absolute top-1/2 left-[20%] right-[20%] h-px bg-white/10 -translate-y-1/2" />
              <div className="absolute left-1/2 top-[20%] bottom-[20%] w-px bg-white/10 -translate-x-1/2" />
              {/* Accent dots */}
              <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E06D14]/70" />
              <div className="absolute top-[30%] right-[18%] w-1 h-1 rounded-full bg-[#E06D14]/40" />
              <div className="absolute top-[22%] right-[28%] w-1 h-1 rounded-full bg-[#E06D14]/30" />
              <div className="absolute top-[40%] left-[12%] w-1 h-1 rounded-full bg-[#E06D14]/30" />
            </div>
          </div>

          {/* CONNECT WITH US — vertical right edge label */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/55"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Connect With Us
            </span>
          </div>

          {/* Social hub — horizontal row at the bottom */}
          <div className="absolute bottom-0 inset-x-0 z-10">
            {/* Social cards row */}
            <div className="flex border-t border-white/8">
              {SOCIAL_HUB.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className={`group flex-1 flex flex-col items-center gap-1.5 py-4 px-3 border-r border-white/8 last:border-r-0 bg-white/4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 active:translate-y-0 ${item.color}`}
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-current transition-colors">
                    <item.icon className="w-4 h-4 text-white/85 group-hover:text-inherit transition-colors" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/85 group-hover:text-inherit transition-colors">{item.label}</span>
                  <span className="text-[10px] text-white/65 font-mono group-hover:text-white transition-colors">{item.handle}</span>
                </motion.a>
              ))}
            </div>

            {/* Footer strip: Explore + Kikai */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/8 bg-black/20 backdrop-blur-sm">
              <a
                href="#"
                className="text-[9px] font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors flex items-center gap-1"
              >
                Explore Our Page <ArrowUpRight className="w-3 h-3" />
              </a>
              <KikaiTranslation side="right" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed nav — minimal ── */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-10 py-5 pointer-events-none">
        <AnimatedLogo />
        <button
          className="lg:hidden p-2 text-white/80 hover:text-white pointer-events-auto"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-neutral-950 pointer-events-auto flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6">
              <AnimatedLogo />
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/80 hover:text-white">
                <CloseIcon className="w-7 h-7" />
              </button>
            </div>
            <div className="flex-grow flex flex-col justify-center px-10 gap-4">
              {SOCIAL_HUB.map(({ icon: Icon, label, url, handle }, i) => (
                <motion.a
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.05 }}
                  href={url}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#E06D14]/10 group-hover:border-[#E06D14]/30 transition-colors">
                    <Icon className="w-5 h-5 text-[#E06D14]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tighter">{label}</span>
                    <span className="text-xs text-white/50 font-mono">{handle}</span>
                  </div>
                </motion.a>
              ))}
            </div>
            <div className="px-10 py-6 border-t border-white/10 flex flex-col gap-3">
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-1 w-fit">
                Explore Our Page <ArrowUpRight className="w-3 h-3" />
              </a>
              <KikaiTranslation side="left" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
