import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Plus, Minus, Package, LogOut, LayoutDashboard, X } from 'lucide-react';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

/* ─── Fruito SVG Logo ─── */
const FruitoIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="22" rx="16" ry="16" fill="url(#hg)" />
    <path d="M20 6 C20 6 24 2 28 4" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 6 C20 6 16 2 12 5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    <defs>
      <radialGradient id="hg" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ff9f4a" />
        <stop offset="50%" stopColor="#f85f00" />
        <stop offset="100%" stopColor="#d94e00" />
      </radialGradient>
    </defs>
  </svg>
);

interface Fruit {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

const CATEGORIES = ['All', 'Exotic', 'Citrus', 'Berries', 'Tropical', 'Melons'];
const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🛒', Exotic: '🌺', Citrus: '🍊', Berries: '🫐', Tropical: '🥥', Melons: '🍈',
};

/* ─── Skeleton Loader ─── */
const FruitCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
    <div className="skeleton aspect-square rounded-xl" />
    <div className="skeleton h-4 w-3/4 rounded-lg" />
    <div className="skeleton h-3 w-1/2 rounded-lg" />
    <div className="skeleton h-10 rounded-xl" />
  </div>
);

/* ─── Add toast feedback ─── */
const AddedToast = ({ name }: { name: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.95 }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-5 py-3 flex items-center gap-3 card-shadow-lg"
    style={{ border: '1px solid rgba(248,95,0,0.15)' }}
  >
    <span className="text-lg">🛒</span>
    <span className="text-sm font-semibold text-apple-700">{name} added to cart</span>
  </motion.div>
);

/* ─── Memoized Fruit Card ─── */
interface FruitCardProps {
  fruit: Fruit;
  qty: number;
  onAdd: (fruit: Fruit) => void;
  onUpdateQty: (id: number, qty: number) => void;
  idx: number;
}

const FruitCard = memo(({ fruit, qty, onAdd, onUpdateQty, idx }: FruitCardProps) => {
  const isOutOfStock = fruit.stock === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
      className="gpu-accelerate bg-white rounded-2xl overflow-hidden card-shadow group hover:card-shadow-lg transition-all duration-300 flex flex-col"
    >
      {/* Image area */}
      <div className="relative aspect-square bg-apple-50 overflow-hidden">
        {fruit.imageUrl ? (
          <img
            src={fruit.imageUrl}
            alt={fruit.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">🍎</div>
        )}

        {/* Badges */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-xs font-bold text-apple-400 bg-white/90 px-2 py-1 rounded-lg border border-apple-150">Out of stock</span>
          </div>
        )}
        {!isOutOfStock && fruit.stock < 10 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-brand px-2 py-0.5 rounded-full">
            Only {fruit.stock} left!
          </span>
        )}
        {qty > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white"
          >
            {qty}
          </motion.span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-apple-700 text-sm truncate mb-0.5">{fruit.name}</h3>
        <p className="text-apple-400 text-xs line-clamp-1 mb-2 flex-1">{fruit.description || 'Fresh and organic.'}</p>
        <p className="font-bold text-brand text-base mb-3">{formatCurrency(fruit.price)}<span className="text-[10px] font-normal text-apple-400">/kg</span></p>

        {/* Cart controls */}
        {qty === 0 ? (
          <button
            onClick={() => !isOutOfStock && onAdd(fruit)}
            disabled={isOutOfStock}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-brand/10 text-brand hover:bg-brand hover:text-white active:scale-95"
          >
            <Plus size={15} />
            {isOutOfStock ? 'Unavailable' : 'Add to cart'}
          </button>
        ) : (
          <div className="flex items-center justify-between bg-brand rounded-xl px-1 py-1 gap-1">
            <button
              onClick={() => onUpdateQty(fruit.id, qty - 1)}
              className="w-8 h-8 flex items-center justify-center bg-white/25 hover:bg-white/40 text-white rounded-lg transition-colors active:scale-90"
            >
              <Minus size={13} />
            </button>
            <span className="text-white text-sm font-bold flex-1 text-center">{qty}</span>
            <button
              onClick={() => onUpdateQty(fruit.id, qty + 1)}
              disabled={qty >= fruit.stock}
              className="w-8 h-8 flex items-center justify-center bg-white/25 hover:bg-white/40 text-white rounded-lg transition-colors active:scale-90 disabled:opacity-40"
            >
              <Plus size={13} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});
FruitCard.displayName = 'FruitCard';

/* ─── Custom debounce hook ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const Home = () => {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce search for performance
  const debouncedSearch = useDebounce(search, 280);

  const { addItem, items, updateQuantity } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  /* ─── Fetch fruits with AbortController (no memory leak on unmount) ─── */
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    (async () => {
      try {
        const { data } = await api.get('/user/fruits', { signal: controller.signal });
        setFruits(data.content || data);
      } catch (e: any) {
        if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
          console.error('Failed to fetch fruits', e);
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  /* ─── Scroll shadow for navbar ─── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Auto-dismiss toast ─── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = useCallback(() => { logout(); navigate('/login'); }, [logout, navigate]);

  /* ─── Memoized filter (uses debounced search for perf) ─── */
  const filteredFruits = useMemo(() =>
    fruits.filter(f =>
      (category === 'All' || f.category === category) &&
      f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [fruits, category, debouncedSearch]
  );

  const getCartQty = useCallback((id: number) => items.find(i => i.id === id)?.quantity ?? 0, [items]);
  const totalCartItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const handleAdd = useCallback((fruit: Fruit) => {
    addItem({ id: fruit.id, name: fruit.name, price: fruit.price, quantity: 1, imageUrl: fruit.imageUrl || '' });
    setToast(fruit.name);
  }, [addItem]);

  return (
    <div className="min-h-screen bg-apple-50">
      {/* ── STICKY NAVBAR ── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass border-b border-apple-150 card-shadow' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <FruitoIcon size={30} />
            <span className="text-xl font-bold text-apple-700 hidden sm:block" style={{letterSpacing: '-0.02em'}}>Fruito</span>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md relative group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-400 group-focus-within:text-brand transition-colors" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for fruits…"
              className="w-full pl-10 pr-4 py-2.5 bg-apple-100 rounded-xl text-sm text-apple-700 placeholder:text-apple-400 border border-transparent input-focus transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-400 hover:text-apple-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user?.role === 'ROLE_ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                onMouseEnter={() => import('./AdminDashboard')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-apple-100 text-apple-600 rounded-lg hover:bg-apple-150 transition-colors"
              >
                <LayoutDashboard size={14} /> Admin
              </button>
            )}

            <button
              onClick={() => navigate('/orders')}
              onMouseEnter={() => import('./Orders')}
              className="w-9 h-9 flex items-center justify-center bg-apple-100 rounded-xl hover:bg-apple-150 transition-colors"
              title="My Orders"
            >
              <Package size={17} className="text-apple-600" />
            </button>

            <button
              onClick={() => navigate('/cart')}
              onMouseEnter={() => import('./Cart')}
              className="w-9 h-9 flex items-center justify-center bg-apple-100 rounded-xl hover:bg-apple-150 transition-colors relative"
              title="Cart"
            >
              <ShoppingBag size={17} className="text-apple-600" />
              <AnimatePresence>
                {totalCartItems > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-apple-50"
                  >
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center bg-apple-100 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} className="text-apple-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-32 pt-6">
        {/* ── HERO BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl mb-8 p-6 sm:p-10"
          style={{ background: 'linear-gradient(135deg, #fff3ed 0%, #ffe0cc 60%, #ffd1aa 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-brand/10 rounded-full blur-2xl" />
            <div className="absolute right-1/4 bottom-0 w-32 h-32 bg-orange-400/10 rounded-full blur-xl" />
          </div>
          <div className="relative z-10 max-w-lg gpu-accelerate">
            <p className="text-brand text-sm font-semibold mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand rounded-full inline-block" />
              Hello, {user?.email?.split('@')[0]}!
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-apple-700 mb-2" style={{letterSpacing: '-0.02em'}}>
              Freshest Fruits,<br />Delivered to Your Door 🍊
            </h1>
            <p className="text-apple-500 text-sm mb-5">Premium quality. Farm-fresh. 30-minute delivery.</p>
            <button
              onClick={() => searchRef.current?.focus()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors card-shadow"
            >
              <Search size={15} /> Browse fresh picks
            </button>
          </div>

          {/* Floating fruit emojis */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 items-end">
            {['🥭', '🍓', '🍇', '🍋', '🥝'].map((e, i) => (
              <motion.span
                key={e}
                className="text-3xl select-none"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              >
                {e}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* ── CATEGORY PILLS ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-brand text-white card-shadow scale-[1.02]'
                  : 'bg-white text-apple-500 border border-apple-150 hover:border-brand/40 hover:text-brand'
              }`}
            >
              <span>{CATEGORY_EMOJIS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* ── FRUIT GRID ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <FruitCardSkeleton key={i} />)}
          </div>
        ) : filteredFruits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 bg-apple-100 rounded-full flex items-center justify-center mb-4 text-3xl">🔍</div>
            <h3 className="text-lg font-bold text-apple-700 mb-1">No fruits found</h3>
            <p className="text-apple-400 text-sm mb-5">
              {search ? `Nothing matches "${search}"` : `No fruits in the ${category} category yet`}
            </p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); }}
              className="px-6 py-2.5 bg-brand/10 text-brand rounded-xl text-sm font-semibold hover:bg-brand/20 transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFruits.map((fruit, idx) => (
              <FruitCard
                key={fruit.id}
                fruit={fruit}
                qty={getCartQty(fruit.id)}
                onAdd={handleAdd}
                onUpdateQty={updateQuantity}
                idx={idx}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── MOBILE STICKY BOTTOM BAR ── */}
      <AnimatePresence>
        {totalCartItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:hidden"
          >
            <button
              onClick={() => navigate('/cart')}
              className="w-full py-4 bg-brand text-white font-bold rounded-2xl flex items-center justify-between px-5 card-shadow-lg shine"
              style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span>{totalCartItems} item{totalCartItems !== 1 ? 's' : ''} in cart</span>
              </span>
              <span className="text-white/80 text-sm font-medium">View →</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && <AddedToast key={toast} name={toast} />}
      </AnimatePresence>
    </div>
  );
};

export default Home;
