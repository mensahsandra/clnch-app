import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import {
  Rocket,
  Mail,
  Lock,
  User,
  CheckCircle2,
  ArrowUpRight,
  Menu,
  X as CloseIcon,
  Instagram,
  Twitter,
  Linkedin,
  AtSign,
  Loader2,
} from 'lucide-react';

const VIDEO_URL =
  'https://stream.mux.com/Q3hYHAcLU82ceOUgwDeO4HiwOc3WZn9JD02PugwzxHOI.m3u8';

const SOCIAL_LINKS = [
  { icon: Instagram, label: 'Instagram', url: '#' },
  { icon: Twitter, label: 'X', url: '#' },
  { icon: AtSign, label: 'Threads', url: '#' },
  { icon: Linkedin, label: 'LinkedIn', url: '#' },
];

function KikaiTranslation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const show = isOpen || isHovered;

  return (
    <div
      ref={tooltipRef}
      className="relative inline-block cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <span className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors text-[10px] font-bold uppercase tracking-widest">
        Kikai-tsukamu (機会をつかむ){' '}
        <Rocket className="w-3 h-3 text-[#E06D14]" />
      </span>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full mb-3 right-0 z-[200] w-72 p-4 rounded-xl bg-neutral-900 border border-white/10 text-white shadow-2xl text-left"
          >
            <div className="absolute top-full right-4 w-3 h-3 bg-neutral-900 border-r border-b border-white/10 rotate-45 -translate-y-1.5" />
            <p className="text-xs leading-relaxed text-white/90">
              This phrase translates:{' '}
              <span className="text-[#E06D14] font-semibold">
                "to seize the opportunity"
              </span>{' '}
              or{' '}
              <span className="text-[#E06D14] font-semibold">
                "clinch the chance"
              </span>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // HLS video setup
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (mode === 'signup' && password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setSubmitting(true);
      try {
        if (mode === 'login') {
          const { error } = await signIn(email, password);
          if (error) {
            setError(error.message || 'Invalid credentials. Please try again.');
          } else {
            setSuccess(true);
          }
        } else {
          const { error } = await signUp(email, password);
          if (error) {
            setError(error.message || 'Sign up failed. Please try again.');
          } else {
            setSuccess(true);
            setTimeout(() => navigate('/onboarding'), 1500);
          }
        }
      } finally {
        setSubmitting(false);
      }
    },
    [mode, email, password, confirmPassword, signIn, signUp, navigate]
  );

  return (
    <div className="relative h-screen w-full font-sans text-white selection:bg-white/20 bg-black overflow-hidden">
      {/* ── Video Background ─────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          muted
          loop
          playsInline
          autoPlay
        />
        {/* Fallback gradient shown before video loads */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 opacity-60" />
      </div>

      {/* ── Main Split Layout ─────────────────────────────── */}
      <div className="absolute inset-0 z-10 flex flex-col lg:flex-row">
        {/* LEFT PANEL — scrollable */}
        <div className="relative w-full lg:w-1/2 h-full flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 overflow-y-auto">
          {/* Blurred glass overlay (full panel) */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: 'rgba(100, 100, 100, 0.28)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
            }}
          />

          {/* SVG mask: creates "cutout" through the blur where CLNCH text is */}
          <svg
            className="absolute inset-0 w-full pointer-events-none"
            style={{ height: '34vh', zIndex: 1 }}
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="clnchCutout">
                <rect width="100%" height="100%" fill="white" />
                <text
                  x="6%"
                  y="82%"
                  style={{
                    fontSize: 'clamp(60px, 12vw, 130px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  fill="black"
                >
                  CLNCH
                </text>
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(100,100,100,0.32)"
              mask="url(#clnchCutout)"
              style={{
                backdropFilter: 'blur(22px)',
              }}
            />
          </svg>

          {/* Panel content */}
          <div className="relative z-10 flex flex-col min-h-full px-6 md:px-10">
            {/* CLNCH heading placeholder (matches SVG mask position) */}
            <div
              className="shrink-0 flex items-end pb-0"
              style={{ height: '34vh' }}
            >
              <span
                className="select-none text-white/0 pointer-events-none"
                style={{
                  fontSize: 'clamp(60px, 12vw, 130px)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                CLNCH
              </span>
            </div>

            {/* Vertical rule */}
            <div className="w-px bg-white/20 my-4 shrink-0" style={{ height: 40 }} />

            {/* Auth Card */}
            <div className="w-full max-w-md pb-10">
              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.div
                    key="auth-form"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="w-full bg-white/8 backdrop-blur-sm rounded-2xl border border-white/12 p-6 md:p-8 shadow-2xl relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#E06D14]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Tabs */}
                    <div className="flex border-b border-white/10 mb-6">
                      {(['signup', 'login'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => {
                            setMode(tab);
                            setError('');
                          }}
                          className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative cursor-pointer ${
                            mode === tab
                              ? 'text-white'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {tab === 'signup' ? 'Sign Up' : 'Log In'}
                          {mode === tab && (
                            <motion.div
                              layoutId="tabLine"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E06D14]"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Google button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setSubmitting(true);
                        setTimeout(() => {
                          setSubmitting(false);
                          setSuccess(true);
                        }, 1200);
                      }}
                      className="w-full bg-white text-neutral-900 hover:bg-neutral-100 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 shadow-lg cursor-pointer mb-5 active:scale-[0.98] disabled:opacity-60"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="h-px flex-grow bg-white/10" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">or email</span>
                      <div className="h-px flex-grow bg-white/10" />
                    </div>

                    {/* Form fields */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <AnimatePresence mode="popLayout">
                        {mode === 'signup' && (
                          <motion.div
                            key="name-field"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                              Full Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Alex Rivers"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#E06D14] focus:bg-white/10 transition-all"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex@example.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#E06D14] focus:bg-white/10 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#E06D14] focus:bg-white/10 transition-all"
                          />
                        </div>
                      </div>

                      <AnimatePresence mode="popLayout">
                        {mode === 'signup' && (
                          <motion.div
                            key="confirm-field"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 block">
                              Confirm Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#E06D14] focus:bg-white/10 transition-all"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400"
                        >
                          {error}
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#E06D14] hover:bg-[#c95e0e] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full rounded-2xl border border-[#E06D14]/30 p-8 text-center relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E06D14] to-amber-500" />
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-[#E06D14]/10 rounded-full flex items-center justify-center border border-[#E06D14]/30">
                        <CheckCircle2 className="w-8 h-8 text-[#E06D14]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2">Welcome to CLNCH</h3>
                    <p className="text-xs text-white/60 max-w-xs mx-auto mb-6 leading-relaxed">
                      Account authenticated successfully. Redirecting to your workspace...
                    </p>
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setName('');
                        setEmail('');
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white transition-all cursor-pointer active:scale-95"
                    >
                      Reset Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer row — always visible below card */}
              <div className="flex flex-row justify-between items-end border-t border-white/10 mt-8 pt-6 gap-4">
                <a
                  href="#"
                  className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center gap-1 shrink-0"
                >
                  Explore Our Page <ArrowUpRight className="w-3 h-3" />
                </a>
                <KikaiTranslation />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — video visible, decorative circles, STUDIO */}
        <div className="relative hidden lg:flex w-1/2 h-full flex-col justify-end pb-2 overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
            <div className="relative w-full h-full">
              <div className="absolute top-[-15vh] left-1/2 -translate-x-1/2 w-[55vh] h-[55vh] border border-white/25 rounded-full" />
              <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 w-[55vh] h-[55vh] border border-white/25 rounded-full" />
            </div>
          </div>

          {/* STUDIO */}
          <div className="relative z-10 w-full px-[5%] mb-1">
            <svg
              viewBox="0 0 500 130"
              preserveAspectRatio="xMidYMid meet"
              className="w-full select-none pointer-events-none overflow-visible"
            >
              <text
                x="0"
                y="115"
                textLength="100%"
                lengthAdjust="spacingAndGlyphs"
                fill="white"
                style={{ fontSize: '130px', fontWeight: 900, letterSpacing: '-0.04em' }}
              >
                STUDIO
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Fixed Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-10 py-6 pointer-events-none">
        <div className="flex items-center gap-8 pointer-events-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-2 h-2 bg-[#E06D14]" />
              ))}
            </div>
            <span className="text-lg font-black tracking-tighter">CLNCH.app</span>
          </div>

          {/* Social icons — desktop */}
          <div className="hidden lg:flex items-center gap-3 text-white/60">
            {SOCIAL_LINKS.map(({ icon: Icon, label, url }) => (
              <a
                key={label}
                href={url}
                title={label}
                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:text-[#E06D14] hover:border-white/20 hover:bg-white/10 transition-all duration-200"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-white/80 hover:text-white pointer-events-auto"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* ── Mobile Menu ───────────────────────────────────── */}
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
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-2 h-2 bg-[#E06D14]" />
                  ))}
                </div>
                <span className="text-lg font-black tracking-tighter">CLNCH.app</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/80 hover:text-white">
                <CloseIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-grow flex flex-col justify-center px-12 gap-8">
              {SOCIAL_LINKS.map(({ icon: Icon, label, url }, i) => (
                <motion.a
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  href={url}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-bold tracking-tighter hover:text-[#E06D14] transition-colors flex items-center gap-4"
                >
                  <Icon className="w-8 h-8 text-[#E06D14]" />
                  <span>{label}</span>
                </motion.a>
              ))}
            </div>

            <div className="px-12 py-8 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                CLNCH: FROM FOUND TO FILED
              </span>
              <KikaiTranslation />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
