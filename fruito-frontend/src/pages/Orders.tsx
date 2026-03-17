import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { formatCurrency } from '../lib/utils';

interface OrderItem {
  id: number;
  quantity: number;
  fruit: { name: string; price: number; imageUrl: string; };
}
interface Order {
  id: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
}

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const getStepIndex = (status: string) => {
  if (status.toUpperCase() === 'CANCELLED') return -1;
  return STATUS_STEPS.indexOf(status.toUpperCase());
};

const STATUS_META: Record<string, { label: string; icon: string; color: string; bg: string; ring: string }> = {
  PLACED:    { label: 'Order Placed',     icon: '🕐', color: 'text-purple-700', bg: 'bg-purple-50', ring: 'ring-purple-200' },
  CONFIRMED: { label: 'Confirmed',        icon: '📦', color: 'text-blue-700',   bg: 'bg-blue-50',   ring: 'ring-blue-200' },
  PACKING:   { label: 'Being Packed',     icon: '📦', color: 'text-blue-700',   bg: 'bg-blue-50',   ring: 'ring-blue-200' },
  SHIPPED:   { label: 'Out for Delivery', icon: '🛵', color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  DELIVERED: { label: 'Delivered',        icon: '✅', color: 'text-green-700',  bg: 'bg-green-50',  ring: 'ring-green-200' },
  CANCELLED: { label: 'Cancelled',        icon: '❌', color: 'text-red-700',    bg: 'bg-red-50',    ring: 'ring-red-200' },
};

const getMeta = (status: string) => STATUS_META[status.toUpperCase()] || STATUS_META.PLACED;

/* ─── Progress Stepper ─── */
const Stepper = ({ status }: { status: string }) => {
  const idx = getStepIndex(status);
  if (status.toUpperCase() === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
        <span>❌</span>
        <span className="text-xs font-semibold text-red-600">Order Cancelled</span>
      </div>
    );
  }
  const LABELS = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  return (
    <div className="flex items-center w-full gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  done ? (active ? 'bg-brand text-white ring-2 ring-brand/25' : 'bg-green-500 text-white') : 'bg-apple-100 text-apple-400'
                }`}
              >
                {done && !active ? '✓' : i + 1}
              </motion.div>
              <span className={`text-[9px] font-medium whitespace-nowrap leading-none ${done ? (active ? 'text-brand' : 'text-green-600') : 'text-apple-300'}`}>
                {LABELS[i]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors duration-500 ${i < idx ? 'bg-green-400' : 'bg-apple-150'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Order Card ─── */
const OrderCard = ({ order, idx }: { order: Order; idx: number }) => {
  const [expanded, setExpanded] = useState(idx === 0);
  const meta = getMeta(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.3 }}
      className="bg-white rounded-2xl card-shadow overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-bold text-apple-400 uppercase tracking-widest mb-0.5">Order</p>
            <h3 className="text-lg font-bold text-apple-700" style={{letterSpacing: '-0.02em'}}>#{order.id}</h3>
            <div className="flex items-center gap-1 text-apple-400 text-xs mt-0.5">
              <Clock size={10} />
              <span>{new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ${meta.color} ${meta.bg} ${meta.ring}`}>
              {meta.icon} {meta.label}
            </span>
            <span className="text-base font-bold text-apple-700">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
        <Stepper status={order.status} />
      </div>

      {/* Expand toggle */}
      <div className="border-t border-apple-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-apple-50 transition-colors text-sm text-apple-500 font-medium"
        >
          <span>{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}</span>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-apple-50 rounded-xl overflow-hidden flex-shrink-0">
                      {item.fruit?.imageUrl
                        ? <img src={item.fruit.imageUrl} alt={item.fruit?.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">🍎</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-apple-700 text-sm truncate">{item.fruit?.name}</p>
                      <p className="text-apple-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-apple-600 text-sm">{formatCurrency((item.fruit?.price ?? 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ─── Main Page ─── */
const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/user/orders')
      .then(r => setOrders(r.data.content || r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-apple-50">
      <header className="sticky top-0 z-30 glass border-b border-apple-150 card-shadow">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center bg-apple-100 rounded-xl hover:bg-apple-150 transition-colors">
            <ArrowLeft size={18} className="text-apple-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-apple-700">My Orders</h1>
            <p className="text-[11px] text-apple-400 leading-none">Track your deliveries</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 card-shadow space-y-3">
                <div className="skeleton h-5 w-32 rounded-lg" />
                <div className="skeleton h-3 w-20 rounded-lg" />
                <div className="skeleton h-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-apple-100 rounded-full flex items-center justify-center mb-5 text-4xl">📦</div>
            <h2 className="text-xl font-bold text-apple-700 mb-2">No orders yet</h2>
            <p className="text-apple-400 text-sm mb-6">Your order history will appear here</p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors text-sm card-shadow"
            >
              <ShoppingBag size={16} /> Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((o, i) => <OrderCard key={o.id} order={o} idx={i} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
