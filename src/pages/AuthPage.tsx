import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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

function KikaiTranslation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
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
      <span className="flex items-center gap-1.5 hover:text-white transition-colors">
        Kikai-tsukamu (機会をつかむ){' '}
        <Rocket className="w-3.5 h-3.5 text-burnt-orange animate-pulse" />
      </span>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full mb-3 right-0 lg:left-1/2 lg:-translate-x-1/2 z-50 w-72 p-4 rounded-xl bg-neutral-900 border border-white/10 text-white shadow-2xl text-left pointer-events-auto"
          >
            <div className="absolute top-full right-4 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 w-3 h-3 bg-neutral-900 border-r border-b border-white/10 rotate-45 -translate-y-1.5" />
            <p className="text-xs leading-relaxed text-white/90">
              This phrase translates:{' '}
              <span className="text-burnt-orange font-semibold">
                "to seize the opportunity"
              </span>{' '}
              or{' '}
              <span className="text-burnt-orange font-semibold">
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
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
    <div className="relative min-h-screen w-full font-sans text-white selection:bg-white/20 overflow-hidden bg-charcoal">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-neutral-900 to-neutral-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-burnt-orange/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="absolute inset-0 flex flex-col lg:flex-row z-10 pointer-events-none overflow-y-auto lg:overflow-hidden">
        {/* Left Panel */}
        <div className="relative w-full lg:w-1/2 min-h-screen lg:h-full flex flex-col pointer-events-auto overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
          {/* Glass overlay effect */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.4)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
          />

          {/* CLNCH Text */}
          <div className="relative z-20 h-full flex flex-col pt-[12vh] lg:pt-[8vh] px-6 md:px-12">
            <div className="h-[20vh] lg:h-[25vh] flex items-center">
              <svg
                viewBox="0 0 500 130"
                preserveAspectRatio="xMinYMid meet"
                className="w-full max-w-lg select-none pointer-events-none overflow-visible"
              >
                <text
                  x="0"
                  y="115"
                  textLength="100%"
                  lengthAdjust="spacingAndGlyphs"
                  fill="white"
                  className="font-black tracking-tighter"
                  style={{ fontSize: '130px', fontWeight: 900 }}
                >
                  CLNCH
                </text>
              </svg>
            </div>

            {/* Vertical Line */}
            <div className="flex-grow flex flex-col pt-4 min-h-[60px]">
              <div className="w-[1px] h-full bg-white/20" />
            </div>

            {/* Auth Form */}
            <div className="pb-12 flex flex-col gap-8 pt-4">
              <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                  {!success ? (
                    <motion.div
                      key="auth-form"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden"
                    >
                      {/* Decorative glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-burnt-orange/10 rounded-full blur-2xl pointer-events-none" />

                      {/* Tabs */}
                      <div className="flex border-b border-white/10 mb-6 relative">
                        <button
                          onClick={() => {
                            setMode('signup');
                            setError('');
                          }}
                          className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative cursor-pointer ${
                            mode === 'signup'
                              ? 'text-white'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          Sign Up
                          {mode === 'signup' && (
                            <motion.div
                              layoutId="activeTabUnderline"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-burnt-orange"
                            />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setMode('login');
                            setError('');
                          }}
                          className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative cursor-pointer ${
                            mode === 'login'
                              ? 'text-white'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          Log In
                          {mode === 'login' && (
                            <motion.div
                              layoutId="activeTabUnderline"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-burnt-orange"
                            />
                          )}
                        </button>
                      </div>

                      {/* Google Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitting(true);
                          setTimeout(() => {
                            setSubmitting(false);
                            setSuccess(true);
                          }, 1200);
                        }}
                        className="w-full bg-white text-charcoal hover:bg-neutral-100 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-white/5 cursor-pointer mb-5 active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      <div className="flex items-center gap-3 my-4">
                        <div className="h-[1px] flex-grow bg-white/10" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                          or email
                        </span>
                        <div className="h-[1px] flex-grow bg-white/10" />
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {mode === 'signup' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="relative"
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
                                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:border-burnt-orange focus:bg-white/10 transition-all font-sans"
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
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:border-burnt-orange focus:bg-white/10 transition-all font-sans"
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
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:border-burnt-orange focus:bg-white/10 transition-all font-sans"
                            />
                          </div>
                        </div>

                        {mode === 'signup' && (
                          <div>
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
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:border-burnt-orange focus:bg-white/10 transition-all font-sans"
                              />
                            </div>
                          </div>
                        )}

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400"
                          >
                            {error}
                          </motion.div>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 mt-6 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>
                              {mode === 'signup'
                                ? 'Create Account'
                                : 'Sign In'}
                            </span>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="auth-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full bg-white/5 backdrop-blur-md rounded-2xl border border-burnt-orange/30 p-8 text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-burnt-orange to-amber-500" />
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-burnt-orange/10 rounded-full flex items-center justify-center border border-burnt-orange/30">
                          <CheckCircle2 className="w-8 h-8 text-burnt-orange" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold tracking-tight mb-2">
                        Welcome to CLNCH
                      </h3>
                      <p className="text-xs text-white/60 max-w-xs mx-auto mb-6 leading-relaxed">
                        Your account has been authenticated successfully.
                        Redirecting to your workspace...
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
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-white/10 pt-8 w-full gap-8">
                <div className="flex flex-col gap-1 text-left w-fit shrink-0">
                  <a
                    href="#"
                    className="text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center justify-start gap-1"
                  >
                    Explore Our Page{' '}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                  <KikaiTranslation />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="relative w-full lg:w-1/2 min-h-[50vh] lg:h-full flex flex-col justify-end pb-8 lg:pb-2 pointer-events-auto overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute inset-0 z-0 pointer-events-none flex justify-center">
            <div className="relative h-full aspect-square flex flex-col items-center">
              <div className="absolute top-[-10vh] lg:top-[-25vh] w-[40vh] lg:w-[60vh] h-[40vh] lg:h-[60vh] border border-white/20 lg:border-white/35 rounded-full" />
              <div className="absolute top-[30vh] lg:top-[18vh] w-[40vh] lg:w-[60vh] h-[40vh] lg:h-[60vh] border border-white/20 lg:border-white/35 rounded-full" />
            </div>
          </div>

          {/* STUDIO Text */}
          <div className="relative z-10 w-full mb-1 px-6 md:px-[5%]">
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
                className="font-black tracking-tighter"
                style={{ fontSize: '130px', fontWeight: 900 }}
              >
                STUDIO
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-6 lg:py-8 pointer-events-none">
        <div className="flex items-center gap-10 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-burnt-orange" />
              <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-burnt-orange" />
              <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-burnt-orange" />
              <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-burnt-orange" />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter">
              CLNCH.app
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-white/70">
            {[
              { icon: Instagram, label: 'Instagram', url: '#' },
              { icon: Twitter, label: 'X', url: '#' },
              { icon: AtSign, label: 'Threads', url: '#' },
              { icon: Linkedin, label: 'LinkedIn', url: '#' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.url}
                title={item.label}
                className="hover:text-burnt-orange hover:scale-110 transition-all duration-300 flex items-center justify-center w-8 h-8 rounded-full border border-white/5 hover:border-white/25 bg-white/5 hover:bg-white/10"
              >
                <item.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8 pointer-events-auto">
          <button
            className="lg:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-charcoal pointer-events-auto lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 bg-burnt-orange" />
                  <div className="w-2 h-2 bg-burnt-orange" />
                  <div className="w-2 h-2 bg-burnt-orange" />
                  <div className="w-2 h-2 bg-burnt-orange" />
                </div>
                <span className="text-lg font-black tracking-tighter">
                  CLNCH.app
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-white/80 hover:text-white"
              >
                <CloseIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-grow flex flex-col justify-center px-12 gap-8">
              {[
                { icon: Instagram, label: 'Instagram', url: '#' },
                { icon: Twitter, label: 'X (Twitter)', url: '#' },
                { icon: AtSign, label: 'Threads', url: '#' },
                { icon: Linkedin, label: 'LinkedIn', url: '#' },
              ].map((item, i) => (
                <motion.a
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  href={item.url}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-bold tracking-tighter hover:text-burnt-orange transition-colors flex items-center gap-4"
                >
                  <item.icon className="w-8 h-8 text-burnt-orange" />
                  <span>{item.label}</span>
                </motion.a>
              ))}
            </div>

            <div className="p-12 border-t border-white/10 flex justify-between items-center">
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                CLNCH: FROM FOUND TO FILED
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                <KikaiTranslation />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
