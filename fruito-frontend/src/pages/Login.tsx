import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const FruitoLogo = () => (
  <div className="flex items-center gap-2.5">
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="22" r="16" fill="url(#fruitGrad)" />
      <ellipse cx="20" cy="22" rx="16" ry="16" fill="url(#fruitGrad)" />
      <path d="M20 6 C20 6 24 2 28 4" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 6 C20 6 16 2 12 5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <defs>
        <radialGradient id="fruitGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff9f4a" />
          <stop offset="50%" stopColor="#f85f00" />
          <stop offset="100%" stopColor="#d94e00" />
        </radialGradient>
      </defs>
    </svg>
    <span className="text-2xl font-bold text-apple-700" style={{letterSpacing: '-0.02em'}}>Fruito</span>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, email: userEmail, role, userId } = response.data;
      setAuth(token, {
        id: userId || 0,
        email: userEmail || email,
        role: role ? `ROLE_${role}` : 'ROLE_USER',
      });
      if (role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Incorrect email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-black/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        <FruitoLogo />

        {/* Floating fruit cards */}
        <div className="relative z-10 flex flex-col gap-4 mt-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 max-w-xs"
          >
            <span className="text-3xl">🥭</span>
            <div>
              <p className="text-white font-semibold text-sm">Alphonso Mangoes</p>
              <p className="text-white/70 text-xs">Delivered in 30 mins</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 max-w-xs ml-10"
          >
            <span className="text-3xl">🍓</span>
            <div>
              <p className="text-white font-semibold text-sm">Fresh Strawberries</p>
              <p className="text-white/70 text-xs">Hand-picked daily</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 max-w-xs ml-4"
          >
            <span className="text-3xl">🍇</span>
            <div>
              <p className="text-white font-semibold text-sm">Premium Grapes</p>
              <p className="text-white/70 text-xs">Directly from farms</p>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-3">
            Freshest fruits,<br />delivered to you.
          </h2>
          <p className="text-white/75 text-base">
            Premium quality. Lightning fast. Zero compromise.
          </p>
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
          {/* Mobile logo */}
          <div className="flex justify-center mb-10 lg:hidden">
            <FruitoLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-apple-700 mb-2" style={{letterSpacing: '-0.02em'}}>
              Welcome back
            </h1>
            <p className="text-apple-400 text-base">Sign in to your Fruito account</p>
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

          <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="Your password"
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-sm shine mt-2 card-shadow"
              style={{ background: 'linear-gradient(135deg, #f85f00 0%, #ff7a2f 100%)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-apple-100 text-center">
            <p className="text-apple-400 text-sm">
              New to Fruito?{' '}
              <Link to="/signup" className="text-brand font-semibold hover:text-brand-dark transition-colors link-underline">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
