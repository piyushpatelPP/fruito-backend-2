import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/axios';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

const FruitoLogo = () => (
  <div className="flex items-center gap-2.5">
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <ellipse cx="20" cy="22" rx="16" ry="16" fill="url(#sg)" />
      <path d="M20 6 C20 6 24 2 28 4" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 6 C20 6 16 2 12 5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <defs>
        <radialGradient id="sg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff9f4a" />
          <stop offset="50%" stopColor="#f85f00" />
          <stop offset="100%" stopColor="#d94e00" />
        </radialGradient>
      </defs>
    </svg>
    <span className="text-2xl font-bold text-apple-700" style={{letterSpacing: '-0.02em'}}>Fruito</span>
  </div>
);

const Perks = [
  { icon: '🚀', text: 'Delivered in under 30 mins' },
  { icon: '🌿', text: '100% fresh, farm-sourced' },
  { icon: '💳', text: 'No minimum order value' },
];

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/signup', { password, email, role: 'ROLE_USER' });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment.');
      } else {
        setError('Account creation failed. This email may already be registered.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-apple-700 mb-2">You're in! 🎉</h2>
          <p className="text-apple-400">Redirecting to sign in…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-black/15 rounded-full blur-3xl" />
        </div>

        <FruitoLogo />

        <div className="relative z-10 space-y-5 mt-16">
          {Perks.map((p, i) => (
            <motion.div
              key={p.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
              className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-2xl px-5 py-4"
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-white font-medium text-sm">{p.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-xs">Trusted by 50,000+ happy customers</p>
          <div className="flex -space-x-1 mt-2">
            {['🧑', '👩', '🧔', '👧', '👨'].map((e, i) => (
              <span key={i} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm border border-white/30 select-none">{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="flex justify-center mb-10 lg:hidden">
            <FruitoLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-apple-700 mb-2" style={{letterSpacing: '-0.02em'}}>
              Create account
            </h1>
            <p className="text-apple-400 text-base">Start getting fresh fruits today</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl"
            >
              <span className="text-base shrink-0">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-apple-600" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3.5 bg-apple-50 border border-apple-150 rounded-xl text-apple-700 placeholder:text-apple-300 text-sm input-focus"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-apple-600" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="w-full px-4 py-3.5 bg-apple-50 border border-apple-150 rounded-xl text-apple-700 placeholder:text-apple-300 text-sm pr-12 input-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-400 hover:text-apple-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span>⚡</span> Use 6+ characters for a stronger password
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-sm shine mt-2 card-shadow"
              style={{ background: 'linear-gradient(135deg, #f85f00 0%, #ff7a2f 100%)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-apple-100 text-center">
            <p className="text-apple-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-semibold hover:text-brand-dark transition-colors link-underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
