import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { supabase } from '../services/supabase';
import {
  Rocket,
  Mail,
  Lock,
  User,
  CheckCircle2,
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

const SOCIAL_HUB = [
  {
    icon: Instagram,
    label: 'Instagram',
    url: '#',
    handle: '@clnch.app',
    color: 'hover:text-pink-500 hover:border-pink-500/35 hover:bg-pink-500/10',
  },
  {
    icon: Twitter,
    label: 'X / Twitter',
    url: '#',
    handle: '@clnch_app',
    color: 'hover:text-sky-400 hover:border-sky-400/35 hover:bg-sky-400/10',
  },
  {
    icon: AtSign,
    label: 'Threads',
    url: '#',
    handle: '@clnch',
    color: 'hover:text-emerald-400 hover:border-emerald-400/35 hover:bg-emerald-400/10',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    url: '#',
    handle: 'CLNCH',
    color: 'hover:text-blue-500 hover:border-blue-500/35 hover:bg-blue-500/10',
  },
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
  const { signIn, signUp, user, loading } = useAuth();
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

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && !success) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    }
  }, [user, loading, navigate, success]);

  const handleGoogleSignIn = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth',
        },
      });
      if (error) {
        setError(error.message);
        setSubmitting(false);
      }
    } catch (err) {
      setError('Failed to initiate Google sign in');
      setSubmitting(false);
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
            setTimeout(() => navigate('/'), 1500);
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
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          muted
          loop
          playsInline
          autoPlay
        />
      </div>

      {/* Main Split Layout */}
      <div className="absolute inset-0 z-10 flex flex-col lg:flex-row">
        {/* LEFT PANEL */}
        <div className="relative w-full lg:w-1/2 h-full flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
          {/* Frosted glass layer with cutout mask */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: 'rgba(131, 131, 131, 0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              // SVG mask creates transparent cutout for CLNCH text
              maskImage: `url("data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid slice">
                  <rect width="100%" height="100%" fill="white"/>
                  <text x="28" y="150" style="font-size:130px;font-weight:900;letter-spacing:-0.04em;font-family:Inter,sans-serif" fill="black">CLNCH</text>
                </svg>
              `)}")`,
              WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid slice">
                  <rect width="100%" height="100%" fill="white"/>
                  <text x="28" y="150" style="font-size:130px;font-weight:900;letter-spacing:-0.04em;font-family:Inter,sans-serif" fill="black">CLNCH</text>
                </svg>
              `)}")`,
              maskSize: 'cover',
              WebkitMaskSize: 'cover',
              maskPosition: 'top left',
              WebkitMaskPosition: 'top left',
            }}
          />

          {/* Panel content */}
          <div className="relative z-10 flex flex-col h-full px-6 md:px-10 pt-[8vh]">
            {/* CLNCH spacer - transparent text for layout, actual cutout shows video behind */}
            <div className="shrink-0" style={{ height: '28vh' }}>
              <span
                className="select-none text-transparent pointer-events-none"
                style={{
                  fontSize: 'clamp(60px, 11vw, 130px)',
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
            <div className="w-full max-w-md pb-8 flex flex-col flex-grow">
              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.div
                    key="auth-form"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="w-full bg-white/8 backdrop-blur-sm rounded-2xl border border-white/12 p-6 md:p-8 shadow-2xl relative overflow-hidden shrink-0"
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
                      onClick={handleGoogleSignIn}
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
                    className="w-full rounded-2xl border border-[#E06D14]/30 p-8 text-center relative overflow-hidden shrink-0"
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

              {/* Footer row */}
              <div className="flex flex-row justify-between items-end border-t border-white/10 mt-6 pt-4 gap-4 mt-auto">
                <KikaiTranslation />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Social Media Hub */}
        <div className="relative hidden lg:flex w-1/2 h-full flex-col justify-center items-center overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              <div className="absolute top-[-30vh] left-1/2 -translate-x-1/2 w-[55vh] h-[55vh] border border-white/20 rounded-full" />
              <div className="absolute top-[15vh] left-1/2 -translate-x-1/2 w-[55vh] h-[55vh] border border-white/20 rounded-full" />
            </div>
          </div>

          {/* Social Media Hub */}
          <div className="relative z-10 w-full max-w-md px-8">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold tracking-tight mb-1">Connect With Us</h2>
              <p className="text-xs text-white/50">Follow our journey across platforms</p>
            </div>
            <div className="grid gap-4">
              {SOCIAL_HUB.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`group flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${item.color}`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <item.icon className="w-5 h-5 text-white group-hover:text-inherit transition-colors" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-white/80 font-mono group-hover:text-white transition-colors">
                      {item.handle}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Nav - Clean & Minimal */}
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
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-white/80 hover:text-white pointer-events-auto"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-neutral-950 pointer-events-auto flex flex-col lg:hidden"
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
              {SOCIAL_HUB.map(({ icon: Icon, label, url, handle }, i) => (
                <motion.a
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  href={url}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#E06D14]/10 group-hover:border-[#E06D14]/30 transition-colors">
                    <Icon className="w-6 h-6 text-[#E06D14]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tighter">{label}</span>
                    <span className="text-xs text-white/50 font-mono">{handle}</span>
                  </div>
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
