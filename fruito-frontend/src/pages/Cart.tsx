import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Trash2, Minus, Plus, ArrowLeft, CheckCircle2, MapPin, Phone, Tag,
  ChevronRight, CreditCard, AlertCircle, RefreshCw, ShieldCheck, Loader2, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { formatCurrency } from '../lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DeliveryInfo { phone: string; buildingNo: string; address: string; }

// ─── TODO: Replace with your Razorpay Test Key ID (rzp_test_xxxx) ────────────
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_REPLACE_ME';

// ─── Razorpay Script Loader ──────────────────────────────────────────────────
const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ─── Fruito Icon ─────────────────────────────────────────────────────────────
const FruitoIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="22" rx="16" ry="16" fill="url(#cg)" />
    <path d="M20 6 C20 6 24 2 28 4" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
    <defs>
      <radialGradient id="cg" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ff9f4a" />
        <stop offset="50%" stopColor="#f85f00" />
        <stop offset="100%" stopColor="#d94e00" />
      </radialGradient>
    </defs>
  </svg>
);

// ─── Payment Status Enum ──────────────────────────────────────────────────────
type PaymentStatus = 'idle' | 'initiating' | 'razorpay_open' | 'verifying' | 'success' | 'failed';
type PaymentMethod = 'online' | 'cod';

// ─── Main Cart Component ──────────────────────────────────────────────────────
const Cart = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCartStore();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({ phone: '', buildingNo: '', address: '' });
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<DeliveryInfo>>({});

  const isProcessing = ['initiating', 'razorpay_open', 'verifying'].includes(paymentStatus);

  useEffect(() => {
    api.get('/user/settings/delivery_fee')
      .then(r => { const f = parseFloat(r.data); setDeliveryFee(isNaN(f) ? 50 : f); })
      .catch(() => setDeliveryFee(50));
    // Pre-load Razorpay script in background
    loadRazorpay().catch(() => {});
  }, []);

  // ── Coupon Logic ──────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.get(`/user/coupons/validate/${couponCode}`);
      const c = res.data;
      if (total() < c.minOrderValue) { setCouponError(`Min order ${formatCurrency(c.minOrderValue)} required`); return; }
      setAppliedCoupon(c);
    } catch (err: any) {
      setCouponError(err.response?.data || 'Invalid or expired coupon');
    } finally { setCouponLoading(false); }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    let d = (total() * appliedCoupon.discountPercentage) / 100;
    if (appliedCoupon.maxDiscount && d > appliedCoupon.maxDiscount) d = appliedCoupon.maxDiscount;
    return d;
  };

  const grandTotal = () => Math.max(0, total() + deliveryFee - calculateDiscount());

  // ── Delivery Validation ───────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<DeliveryInfo> = {};
    if (!deliveryInfo.phone.trim() || !/^\d{10}$/.test(deliveryInfo.phone)) errs.phone = 'Valid 10-digit number required';
    if (!deliveryInfo.buildingNo.trim()) errs.buildingNo = 'Building / House No. required';
    if (!deliveryInfo.address.trim() || deliveryInfo.address.length < 10) errs.address = 'Full address required (min 10 chars)';
    setDeliveryErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = () => {
    if (!token) { navigate('/login'); return; }
    if (!items.length) return;
    setPaymentError('');
    setPaymentStatus('idle');
    setShowDeliveryModal(true);
  };

  // ── RAZORPAY PAYMENT FLOW ─────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    if (!validate()) return;
    setShowDeliveryModal(false);
    setPaymentStatus('initiating');
    setPaymentError('');

    try {
      // Step 1: Sync cart items to backend cart.
      // Strategy: clear backend cart first, then re-add from Zustand store.
      // This prevents quantity doubling from stale items on retried checkouts.
      await api.delete('/user/cart/clear');
      for (const item of items) {
        await api.post(`/user/cart/add?productId=${item.id}&quantity=${item.quantity}`);
      }

      // Step 2: Initiate Razorpay order on backend
      // Backend should return: { razorpayOrderId, amount, currency }
      const couponParam = appliedCoupon?.code ? `?couponCode=${appliedCoupon.code}` : '';
      const initiateRes = await api.post(`/user/orders/initiate${couponParam}`);
      const razorpayOrderId = initiateRes.data.razorpayOrderId || initiateRes.data.id;
      const amountInPaise = initiateRes.data.amount; // already in paise from backend

      // Step 3: Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Could not load payment gateway. Check your internet connection and try again.');
      }

      setPaymentStatus('razorpay_open');

      // Step 4: Open Razorpay Checkout
      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key: RAZORPAY_KEY_ID,
          amount: amountInPaise,
          currency: 'INR',
          name: 'Fruito',
          description: `Order for ${items.length} item${items.length !== 1 ? 's' : ''}`,
          // image: logo removed — bad URL caused 404 console error
          order_id: razorpayOrderId || undefined,
          prefill: {
            contact: deliveryInfo.phone,
            email: user?.email || '',
            name: user?.email?.split('@')[0] || '',
          },
          notes: {
            address: `${deliveryInfo.buildingNo}, ${deliveryInfo.address}`,
          },
          theme: { color: '#f85f00' },
          modal: {
            ondismiss: () => {
              setPaymentStatus('failed');
              setPaymentError('Payment was cancelled. You can retry anytime.');
              reject(new Error('dismissed'));
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setPaymentStatus('verifying');

              // Step 5: Verify payment on backend (CRITICAL — never trust client-side success)
              const couponParam = appliedCoupon?.code ? `?couponCode=${appliedCoupon.code}` : '';
              await api.post(`/user/orders/verify${couponParam}`, {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              clearCart();
              setOrderPlaced(true);
              setPaymentStatus('success');
              resolve();
            } catch (e: any) {
              const msg = e.response?.data?.message || e.response?.data || 'Payment verification failed. Contact support.';
              setPaymentError(msg);
              setPaymentStatus('failed');
              reject(e);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setPaymentError(
            response.error?.description ||
            `Payment failed: ${response.error?.reason || 'Unknown error'}. Please try again.`
          );
          setPaymentStatus('failed');
          reject(new Error(response.error?.description));
        });
        rzp.open();
      });

    } catch (e: any) {
      if (e?.message !== 'dismissed') {
        const msg = e.response?.data?.message || e.response?.data || e.message || 'Payment failed. Please try again.';
        setPaymentError(msg);
        setPaymentStatus('failed');
      }
    }
  };

  // ── COD FLOW ──────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    if (!validate()) return;
    setShowDeliveryModal(false);
    setPaymentStatus('initiating');
    setPaymentError('');

    try {
      // Sync cart to backend
      await api.delete('/user/cart/clear');
      for (const item of items) {
        await api.post(`/user/cart/add?productId=${item.id}&quantity=${item.quantity}`);
      }

      // Place COD order using existing endpoint
      const couponParam = appliedCoupon?.code ? `?couponCode=${appliedCoupon.code}` : '';
      await api.post(`/user/orders/place${couponParam}`);

      clearCart();
      setOrderPlaced(true);
      setPaymentStatus('success');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data || e.message || 'Failed to place order. Please try again.';
      setPaymentError(msg);
      setPaymentStatus('failed');
    }
  };

  // ── ORDER SUCCESS STATE ───────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-50 p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 w-full max-w-sm text-center card-shadow-lg"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.15 }}
            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle2 size={40} className="text-green-500" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold text-apple-700 mb-2" style={{letterSpacing: '-0.02em'}}>Order Confirmed! 🎉</h2>
            <p className="text-apple-400 text-sm mb-1">Your fresh fruits are being packed.</p>
            <p className="text-apple-400 text-xs mb-2">{deliveryInfo.buildingNo}, {deliveryInfo.address}</p>
            {paymentMethod === 'cod' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-xs font-semibold text-amber-700 mb-8">
                <Banknote size={12} /> Cash on Delivery
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full text-xs font-semibold text-green-700 mb-8">
                <ShieldCheck size={12} /> Payment Verified &amp; Secure
              </div>
            )}
          </motion.div>
          <button
            onClick={() => navigate('/orders')}
            className="w-full py-3.5 text-white font-bold rounded-xl card-shadow transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
          >
            Track My Order
          </button>
          <button onClick={() => navigate('/')} className="mt-3 w-full py-3 text-apple-500 text-sm font-medium hover:text-apple-700 transition-colors">
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  // ── PAYMENT FAILED STATE ──────────────────────────────────────────────────
  const PaymentFailedBanner = () => paymentError ? (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="bg-white border border-red-200 rounded-2xl p-4 card-shadow-lg flex items-start gap-3">
        <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-apple-700 text-sm">Payment Failed</p>
          <p className="text-apple-500 text-xs mt-0.5">{paymentError}</p>
        </div>
        <button
          onClick={() => { setPaymentStatus('idle'); setPaymentError(''); setShowDeliveryModal(true); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shrink-0"
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    </motion.div>
  ) : null;

  // ── PROCESSING OVERLAY ────────────────────────────────────────────────────
  const ProcessingOverlay = () => isProcessing ? (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 w-64 text-center card-shadow-lg"
      >
        <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 size={28} className="text-brand animate-spin" />
        </div>
        <p className="font-bold text-apple-700 mb-1">
          {paymentStatus === 'initiating' && (paymentMethod === 'cod' ? 'Placing Order…' : 'Preparing Payment…')}
          {paymentStatus === 'razorpay_open' && 'Payment in Progress…'}
          {paymentStatus === 'verifying' && 'Verifying Payment…'}
        </p>
        <p className="text-apple-400 text-xs">
          {paymentStatus === 'verifying'
            ? 'Securely confirming your payment on server'
            : 'Please do not close this window'}
        </p>
      </motion.div>
    </motion.div>
  ) : null;

  return (
    <div className="min-h-screen bg-apple-50">
      <ProcessingOverlay />
      <AnimatePresence>{paymentError && <PaymentFailedBanner />}</AnimatePresence>

      {/* ── DELIVERY MODAL ── */}
      <AnimatePresence>
        {showDeliveryModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeliveryModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md card-shadow-lg"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fff3ed, #ffe0cc)'}}>
                  <MapPin size={18} className="text-brand" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-apple-700">Delivery Details</h2>
                  <p className="text-apple-400 text-xs">Where should we deliver?</p>
                </div>
              </div>

              {/* ── PAYMENT METHOD SELECTOR ── */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-apple-500 mb-2">💳 Payment Method</p>
                <div className="flex gap-2 p-1 bg-apple-100 rounded-xl">
                  <button
                    onClick={() => setPaymentMethod('online')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      paymentMethod === 'online'
                        ? 'bg-white text-brand card-shadow'
                        : 'text-apple-400 hover:text-apple-600'
                    }`}
                  >
                    <CreditCard size={15} /> Online Payment
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-white text-amber-600 card-shadow'
                        : 'text-apple-400 hover:text-apple-600'
                    }`}
                  >
                    <Banknote size={15} /> Cash on Delivery
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-apple-500 mb-1.5 block">📞 Phone Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-400" />
                    <input
                      type="tel"
                      value={deliveryInfo.phone}
                      onChange={e => setDeliveryInfo({...deliveryInfo, phone: e.target.value.replace(/\D/g,'').slice(0,10)})}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full pl-9 pr-4 py-3 bg-apple-50 border border-apple-150 rounded-xl text-sm text-apple-700 input-focus"
                    />
                  </div>
                  {deliveryErrors.phone && <p className="text-red-500 text-xs mt-1">{deliveryErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-apple-500 mb-1.5 block">🏠 Building / House No. <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={deliveryInfo.buildingNo}
                    onChange={e => setDeliveryInfo({...deliveryInfo, buildingNo: e.target.value})}
                    placeholder="e.g. Flat 4B, Tower 2"
                    className="w-full px-4 py-3 bg-apple-50 border border-apple-150 rounded-xl text-sm text-apple-700 input-focus"
                  />
                  {deliveryErrors.buildingNo && <p className="text-red-500 text-xs mt-1">{deliveryErrors.buildingNo}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-apple-500 mb-1.5 block">📍 Full Delivery Address <span className="text-red-400">*</span></label>
                  <textarea
                    value={deliveryInfo.address}
                    onChange={e => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                    placeholder="Street, Area, City, Pincode"
                    rows={3}
                    className="w-full px-4 py-3 bg-apple-50 border border-apple-150 rounded-xl text-sm text-apple-700 resize-none input-focus"
                  />
                  {deliveryErrors.address && <p className="text-red-500 text-xs mt-1">{deliveryErrors.address}</p>}
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-4 flex items-center justify-center gap-4 text-apple-400">
                {paymentMethod === 'online' ? (
                  <>
                    <span className="flex items-center gap-1 text-xs"><ShieldCheck size={12} className="text-green-500" /> Secure Payment</span>
                    <span className="flex items-center gap-1 text-xs"><CreditCard size={12} className="text-blue-500" /> Powered by Razorpay</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-xs"><Banknote size={12} className="text-amber-500" /> Pay when your order arrives</span>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowDeliveryModal(false)} className="flex-1 py-3 text-apple-500 font-semibold border border-apple-150 rounded-xl hover:bg-apple-50 transition-colors text-sm">
                  Cancel
                </button>
                {paymentMethod === 'online' ? (
                  <button
                    onClick={handleRazorpayPayment}
                    className="flex-1 py-3 text-white font-bold rounded-xl transition-all text-sm card-shadow flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
                  >
                    <CreditCard size={15} /> Pay {formatCurrency(grandTotal())}
                  </button>
                ) : (
                  <button
                    onClick={handleCOD}
                    className="flex-1 py-3 text-white font-bold rounded-xl transition-all text-sm card-shadow flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                  >
                    <Banknote size={15} /> Place Order (COD)
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 glass border-b border-apple-150 card-shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center bg-apple-100 rounded-xl hover:bg-apple-150 transition-colors">
            <ArrowLeft size={18} className="text-apple-600" />
          </button>
          <div className="flex items-center gap-2">
            <FruitoIcon size={22} />
            <h1 className="text-base font-bold text-apple-700">Your Cart</h1>
          </div>
          {items.length > 0 && (
            <span className="ml-auto text-xs text-apple-400 bg-apple-100 px-2 py-1 rounded-lg">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-36">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-apple-100 rounded-full flex items-center justify-center mb-5 text-4xl">🛒</div>
            <h2 className="text-xl font-bold text-apple-700 mb-2">Your cart is empty</h2>
            <p className="text-apple-400 text-sm mb-6">Add some fresh fruits to get started</p>
            <button onClick={() => navigate('/')} className="px-8 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors text-sm card-shadow">
              Browse Fruits
            </button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* ── ITEMS LIST ── */}
            <div className="lg:col-span-3 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-4 group"
                  >
                    <div className="w-20 h-20 rounded-xl bg-apple-50 overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🍎</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-apple-700 text-sm truncate">{item.name}</h3>
                      <p className="text-brand font-bold text-base mt-0.5">{formatCurrency(item.price)}<span className="text-xs font-normal text-apple-400">/kg</span></p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-apple-100 rounded-xl p-1 gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-brand hover:text-white transition-all text-apple-600 active:scale-90"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-base text-apple-700">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center bg-brand text-white rounded-lg hover:bg-brand-dark transition-all active:scale-90"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-apple-500">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-apple-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── ORDER SUMMARY ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-5 card-shadow sticky top-20">
                <h3 className="font-bold text-apple-700 mb-4">Order Summary</h3>

                {/* Coupon */}
                <div className="mb-5 p-3 bg-apple-50 rounded-xl border border-apple-150">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-apple-500 mb-2">
                    <Tag size={12} /> Coupon Code <span className="ml-auto font-normal text-apple-400">Optional</span>
                  </label>
                  <AnimatePresence mode="wait">
                    {!appliedCoupon ? (
                      <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          className="flex-1 px-3 py-2 bg-white border border-apple-200 rounded-lg text-sm input-focus"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode}
                          className="px-3 py-2 bg-brand text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-brand-dark transition-colors"
                        >
                          {couponLoading ? '…' : 'Apply'}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="applied" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <span className="text-xs font-bold text-green-700">{appliedCoupon.code} applied!</span>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-xs text-red-400 font-medium hover:text-red-600">Remove</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                </div>

                {/* Breakdown */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-apple-500">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>{formatCurrency(total())}</span>
                  </div>
                  <div className="flex justify-between text-apple-500">
                    <span>Delivery fee</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                  <div className="border-t border-apple-100 pt-2.5 flex justify-between font-bold text-apple-700 text-base">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal())}</span>
                  </div>
                </div>

                {/* Payment CTA */}
                <button
                  onClick={handleProceed}
                  disabled={isProcessing}
                  className="w-full mt-5 py-3.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm card-shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shine"
                  style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
                >
                  <CreditCard size={16} />
                  Add Address & Pay <ChevronRight size={15} />
                </button>

                {/* Trust strip */}
                <div className="mt-3 flex items-center justify-center gap-1 text-apple-400 text-[10px]">
                  <ShieldCheck size={11} className="text-green-500" />
                  <span>100% Secure · Powered by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MOBILE STICKY CHECKOUT ── */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 glass border-t border-apple-150 lg:hidden">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-apple-500">{items.reduce((s, i) => s + i.quantity, 0)} items · {formatCurrency(grandTotal())}</span>
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
              <ShieldCheck size={11} /> Razorpay Secured
            </span>
          </div>
          <button
            onClick={handleProceed}
            disabled={isProcessing}
            className="w-full py-3.5 text-white font-bold rounded-xl card-shadow text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
          >
            <CreditCard size={16} /> Add Address & Pay
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
