import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Apple, Users, ShoppingCart, LogOut, Settings,
  Ticket, ArrowLeft, TrendingUp, Package, DollarSign, Activity,
  Plus, Trash2, Edit2, X, Check, AlertTriangle, Calendar,
  Filter, CreditCard
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { formatCurrency } from '../lib/utils';

/* ─── Fruito Icon ─── */
const FruitoIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="22" rx="16" ry="16" fill="url(#adg)" />
    <path d="M20 6 C20 6 24 2 28 4" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
    <defs>
      <radialGradient id="adg" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ff9f4a" />
        <stop offset="50%" stopColor="#f85f00" />
        <stop offset="100%" stopColor="#d94e00" />
      </radialGradient>
    </defs>
  </svg>
);

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-white rounded-2xl p-5 card-shadow flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs font-semibold text-apple-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-xl font-bold text-apple-700" style={{letterSpacing: '-0.02em'}}>{value}</p>
    </div>
  </div>
);

/* ─── Spinner ─── */
const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
  </div>
);

/* ─── Is Urgent? (PLACED order > 1 hour old) ─── */
const isUrgent = (order: any): boolean => {
  if (order.status !== 'PLACED') return false;
  const placed = new Date(order.orderDate || order.createdAt).getTime();
  return Date.now() - placed > 60 * 60 * 1000;
};

/* ─────────────────── Overview Panel ─────────────────── */
const OverviewPanel = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/analytics/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  if (loading) return <Spinner />;
  if (!stats) return <div className="text-red-500 text-sm py-8 text-center">Failed to load statistics.</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="bg-green-50 text-green-600" />
        <StatCard icon={Package}    label="Total Orders"  value={String(stats.totalOrders)}          color="bg-blue-50 text-blue-600" />
        <StatCard icon={Users}      label="Active Users"  value={String(stats.totalUsers)}            color="bg-purple-50 text-purple-600" />
        <StatCard icon={Activity}   label="Store Health"  value="Good"                                color="bg-orange-50 text-brand" />
      </div>

      {stats.topSellingFruits?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-brand" />
            <h3 className="font-bold text-apple-700 text-sm">Top Selling Fruits</h3>
          </div>
          <div className="space-y-2">
            {stats.topSellingFruits.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-apple-100 text-apple-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-sm font-semibold text-apple-700">{item[0]}</span>
                    <span className="text-xs font-bold text-brand">{item[1]} sold</span>
                  </div>
                  <div className="h-1.5 bg-apple-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (item[1] / stats.topSellingFruits[0][1]) * 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full bg-brand rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────── Fruits Panel ─────────────── */
const FruitsPanel = () => {
  const [fruits, setFruits] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFruit, setEditingFruit] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchFruits = () => api.get('/user/fruits').then(r => setFruits(r.data.content || r.data)).catch(console.error);
  useEffect(() => { fetchFruits(); }, []);

  const reset = () => {
    setEditingFruit(null); setName(''); setPrice(''); setStock('');
    setCategory(''); setDescription(''); setImageUrl(''); setIsFormOpen(false);
  };

  const handleEdit = (f: any) => {
    setEditingFruit(f); setName(f.name); setPrice(String(f.price)); setStock(String(f.stock));
    setCategory(f.category || 'All'); setDescription(f.description || ''); setImageUrl(f.imageUrl || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this fruit?')) return;
    await api.delete(`/admin/fruits/${id}`).catch(console.error);
    fetchFruits();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/uploads', fd);
      setImageUrl(`http://localhost:8080${res.data}`);
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data || err.message}`);
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, price: parseFloat(price), stock: parseInt(stock), category, description, imageUrl };
    try {
      if (editingFruit) await api.put(`/admin/fruits/${editingFruit.id}`, payload);
      else await api.post('/admin/fruits', payload);
      fetchFruits(); reset();
    } catch { alert('Failed to save fruit'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-apple-700">Fruits Catalog</h2>
          <p className="text-apple-400 text-xs mt-0.5">{fruits.length} products</p>
        </div>
        <button
          onClick={() => { reset(); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl card-shadow hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
        >
          <Plus size={15} /> Add Fruit
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 card-shadow border border-apple-150"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-apple-700">{editingFruit ? 'Edit Fruit' : 'Add New Fruit'}</h3>
            <button onClick={reset} className="w-7 h-7 flex items-center justify-center text-apple-400 hover:bg-apple-100 rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['Name', name, setName, 'text', 'e.g. Alphonso Mango'], ['Category', category, setCategory, 'text', 'e.g. Exotic']].map(([label, val, setter, type, ph]) => (
              <div key={label as string}>
                <label className="block text-xs font-semibold text-apple-500 mb-1">{label as string}</label>
                <input required value={val as string} onChange={e => (setter as any)(e.target.value)} type={type as string} placeholder={ph as string} className="w-full px-3 py-2.5 bg-apple-50 border border-apple-150 rounded-xl text-sm input-focus" />
              </div>
            ))}
            {[['Price (₹)', price, setPrice, 'number'], ['Stock', stock, setStock, 'number']].map(([label, val, setter, type]) => (
              <div key={label as string}>
                <label className="block text-xs font-semibold text-apple-500 mb-1">{label as string}</label>
                <input required value={val as string} onChange={e => (setter as any)(e.target.value)} type={type as string} step={type === 'number' && label === 'Price (₹)' ? '0.01' : '1'} className="w-full px-3 py-2.5 bg-apple-50 border border-apple-150 rounded-xl text-sm input-focus" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-apple-500 mb-1">Image</label>
              <div className="flex gap-2">
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://... or upload below" className="flex-1 px-3 py-2.5 bg-apple-50 border border-apple-150 rounded-xl text-sm input-focus" />
                <label className="relative cursor-pointer px-4 flex items-center justify-center bg-apple-100 hover:bg-apple-150 text-apple-600 rounded-xl text-xs font-bold transition-colors whitespace-nowrap">
                  {uploading ? <div className="w-4 h-4 border-2 border-apple-400 border-t-apple-600 rounded-full animate-spin" /> : '📂 Upload'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              {imageUrl && <img src={imageUrl} alt="" className="mt-2 h-16 w-16 object-cover rounded-xl border border-apple-150" onError={e => (e.currentTarget.style.display = 'none')} />}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-apple-500 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-apple-50 border border-apple-150 rounded-xl text-sm resize-none input-focus" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={reset} className="px-5 py-2.5 text-apple-500 hover:bg-apple-50 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold card-shadow hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}>
                <Check size={15} /> {editingFruit ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-x-auto scrollbar-hide">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-apple-50 border-b border-apple-100 text-xs font-bold text-apple-400 uppercase tracking-wider">
          <span>Fruit</span><span>Category</span><span>Price</span><span>Stock</span><span>Actions</span>
        </div>
        <div className="divide-y divide-apple-100 content-auto">
          {fruits.length === 0 ? (
            <div className="py-12 text-center text-apple-400 text-sm">No fruits added yet.</div>
          ) : fruits.map((f) => (
            <div key={f.id} className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-apple-50/60 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-apple-50 overflow-hidden flex-shrink-0">
                  {f.imageUrl ? <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🍎</div>}
                </div>
                <span className="font-semibold text-apple-700 text-sm truncate">{f.name}</span>
              </div>
              <span className="text-apple-500 text-sm">{f.category || '—'}</span>
              <span className="font-semibold text-apple-700 text-sm">{formatCurrency(f.price)}</span>
              <span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${f.stock < 10 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>{f.stock}</span>
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(f)} className="w-8 h-8 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(f.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Orders Panel (Enhanced) ─────────────── */
const STATUS_OPTIONS = ['All', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PLACED:    'bg-purple-50 text-purple-700 border-purple-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED:   'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID:    'bg-green-50 text-green-700',
  PENDING: 'bg-yellow-50 text-yellow-700',
  FAILED:  'bg-red-50 text-red-700',
};

const OrdersPanel = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  // Local delivery date/time per order (orderId -> datetime string)
  const [deliveryDates, setDeliveryDates] = useState<Record<number, string>>({});

  const fetchOrders = () =>
    api.get('/admin/orders')
      .then(r => { setOrders(r.data.content || r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/admin/orders/${id}/status?status=${status}`).catch(console.error);
    fetchOrders();
  };

  const setDeliveryDate = async (orderId: number, val: string) => {
    setDeliveryDates(prev => ({ ...prev, [orderId]: val }));
    if (val) {
      try {
        await api.put(`/admin/orders/${orderId}/delivery-date?deliveryAt=${val}:00`);
        // Silently succeed
      } catch (err) {
        console.error('Failed to save delivery date', err);
      }
    }
  };

  const filteredOrders = useMemo(() =>
    statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter),
    [orders, statusFilter]
  );

  const urgentCount = orders.filter(isUrgent).length;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-apple-700">All Orders</h2>
          <p className="text-apple-400 text-xs">{orders.length} total · {filteredOrders.length} shown</p>
        </div>
        {urgentCount > 0 && (
          <div className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
            <AlertTriangle size={13} />
            {urgentCount} urgent order{urgentCount > 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_OPTIONS.map(s => {
          const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-xs font-semibold transition-all border ${
                statusFilter === s
                  ? 'bg-brand text-white border-brand card-shadow'
                  : 'bg-white text-apple-500 border-apple-150 hover:border-brand/40 hover:text-brand'
              }`}
            >
              <Filter size={11} />
              {s === 'All' ? 'All Orders' : s[0] + s.slice(1).toLowerCase()}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === s ? 'bg-white/25 text-white' : 'bg-apple-100 text-apple-500'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-[56px_1fr_1.5fr_80px_130px_140px_130px] gap-3 px-5 py-3 bg-apple-50 border-b border-apple-100 text-xs font-bold text-apple-400 uppercase tracking-wider">
          <span>ID</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Total</span>
          <span>Payment</span>
          <span>Est. Delivery</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-apple-100 content-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-apple-400 text-sm">No orders in this status.</div>
          ) : filteredOrders.map((o) => {
            const urgent = isUrgent(o);
            const paymentStatus = o.paymentStatus || 'PENDING';
            // Use the saved date from DB if available, otherwise fallback to local changes
            const deliveryDate = deliveryDates[o.orderId] ?? (o.estimatedDeliveryAt ? o.estimatedDeliveryAt.substring(0, 16) : '');

            return (
              <div
                key={o.orderId}
                className={`px-5 py-4 hover:bg-apple-50/60 transition-colors ${urgent ? 'border-l-4 border-l-red-400 bg-red-50/30' : ''}`}
              >
                {/* Desktop layout */}
                <div className="hidden lg:grid grid-cols-[56px_1fr_1.5fr_80px_130px_140px_130px] gap-3 items-center">
                  {/* ID */}
                  <div className="flex items-center gap-1">
                    {urgent && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                    <span className="font-bold text-apple-500 text-sm">#{o.orderId}</span>
                  </div>

                  {/* Customer */}
                  <span className="text-sm text-apple-600 truncate">{o.userEmail}</span>

                  {/* Items */}
                  <div className="space-y-0.5">
                    {o.items?.slice(0, 2).map((item: any) => (
                      <p key={item.id} className="text-xs text-apple-500">{item.quantity}× {item.fruitName}</p>
                    ))}
                    {o.items?.length > 2 && <p className="text-xs text-apple-400">+{o.items.length - 2} more</p>}
                  </div>

                  {/* Total */}
                  <span className="text-sm font-bold text-apple-700">
                    {o.totalAmount ? formatCurrency(o.totalAmount) : '—'}
                  </span>

                  {/* Payment Status */}
                  <div className="flex items-center gap-1">
                    <CreditCard size={12} className="text-apple-400 shrink-0" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${PAYMENT_COLORS[paymentStatus] || 'bg-apple-50 text-apple-500'}`}>
                      {paymentStatus}
                    </span>
                  </div>

                  {/* Estimated Delivery Date/Time */}
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-apple-400 shrink-0" />
                    <input
                      type="datetime-local"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(o.orderId, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border input-focus w-full ${
                        deliveryDate ? 'border-green-200 bg-green-50 text-green-700' : 'border-apple-150 bg-apple-50 text-apple-500'
                      }`}
                    />
                  </div>

                  {/* Status Selector */}
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.orderId, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1.5 rounded-lg border appearance-none cursor-pointer focus:ring-2 focus:ring-brand/20 outline-none ${STATUS_COLORS[o.status] || 'bg-apple-50 text-apple-600 border-apple-150'}`}
                  >
                    {['PLACED','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                      <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {urgent && <AlertTriangle size={12} className="text-red-500" />}
                        <span className="font-bold text-apple-700 text-sm">Order #{o.orderId}</span>
                      </div>
                      <p className="text-xs text-apple-400 mt-0.5">{o.userEmail}</p>
                      {o.totalAmount && (
                        <p className="text-sm font-bold text-brand mt-0.5">{formatCurrency(o.totalAmount)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.orderId, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none ${STATUS_COLORS[o.status] || 'bg-apple-50 text-apple-600 border-apple-150'}`}
                      >
                        {['PLACED','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                          <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${PAYMENT_COLORS[paymentStatus] || 'bg-apple-50 text-apple-500'}`}>
                        {paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    {o.items?.slice(0, 2).map((item: any) => (
                      <p key={item.id} className="text-xs text-apple-500">{item.quantity}× {item.fruitName}</p>
                    ))}
                    {o.items?.length > 2 && <p className="text-xs text-apple-400">+{o.items.length - 2} more</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-apple-400" />
                    <input
                      type="datetime-local"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(o.orderId, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border input-focus flex-1 ${
                        deliveryDate ? 'border-green-200 bg-green-50 text-green-700' : 'border-apple-150 bg-apple-50 text-apple-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Users Panel ─────────────── */
const UsersPanel = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => api.get('/admin/users').then(r => { setUsers(r.data.content || r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (id: number) => {
    if (!window.confirm('Ban/delete this user? This cannot be undone.')) return;
    await api.delete(`/admin/users/${id}`).catch(() => alert('Failed. User may have active orders.'));
    fetchUsers();
  };

  if (loading) return <Spinner />;
  return (
    <div className="bg-white rounded-2xl card-shadow overflow-x-auto scrollbar-hide">
      <div className="min-w-[500px]">
        <div className="grid grid-cols-[40px_1fr_100px_80px] gap-4 px-5 py-3 bg-apple-50 border-b border-apple-100 text-xs font-bold text-apple-400 uppercase tracking-wider">
        <span>ID</span><span>Email</span><span>Role</span><span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-apple-100 content-auto">
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-[40px_1fr_100px_80px] gap-4 px-5 py-3.5 items-center hover:bg-apple-50/60 transition-colors">
            <span className="text-xs text-apple-400">#{u.id}</span>
            <span className="text-sm text-apple-600 truncate">{u.email}</span>
            <span>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span>
            </span>
            <div className="flex justify-end">
              {u.role !== 'ADMIN' && (
                <button onClick={() => deleteUser(u.id)} className="text-xs text-red-400 font-semibold hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">Ban</button>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

/* ─────────────── Settings Panel ─────────────── */
const SettingsPanel = () => {
  const [deliveryFee, setDeliveryFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get('/user/settings/delivery_fee').then(r => setDeliveryFee(r.data)).catch(console.error); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/settings/delivery_fee?value=${deliveryFee}`);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-sm">
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <h3 className="font-bold text-apple-700 mb-4">Global Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-apple-500 mb-1.5">Delivery Fee (₹)</label>
            <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="w-full px-4 py-3 bg-apple-50 border border-apple-150 rounded-xl text-sm input-focus" />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 text-white font-bold rounded-xl text-sm card-shadow hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: saved ? '#22c55e' : 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}
          >
            {saved ? <><Check size={15} /> Saved!</> : saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Coupons Panel ─────────────── */
const CouponsPanel = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ code: '', discountPercentage: '', minOrderValue: '', maxDiscount: '', expiryDate: '', isActive: true });

  const fetchCoupons = () => api.get('/admin/coupons').then(r => setCoupons(r.data)).catch(console.error);
  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', {
        ...form,
        discountPercentage: parseFloat(form.discountPercentage),
        minOrderValue: parseFloat(form.minOrderValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        expiryDate: form.expiryDate ? form.expiryDate + 'T23:59:59' : null,
      });
      fetchCoupons(); setIsFormOpen(false);
      setForm({ code: '', discountPercentage: '', minOrderValue: '', maxDiscount: '', expiryDate: '', isActive: true });
    } catch { alert('Failed to create coupon'); }
  };

  const deleteCoupon = async (id: number) => {
    if (!window.confirm('Delete coupon?')) return;
    await api.delete(`/admin/coupons/${id}`).catch(console.error);
    fetchCoupons();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-apple-700">Coupons</h2>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl card-shadow hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}>
          {isFormOpen ? <X size={15} /> : <Plus size={15} />} {isFormOpen ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {isFormOpen && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 card-shadow grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Coupon Code', 'code', 'text', 'SAVE20'],
            ['Discount %', 'discountPercentage', 'number', '20'],
            ['Min Order (₹)', 'minOrderValue', 'number', '100'],
            ['Max Discount (₹)', 'maxDiscount', 'number', 'Optional'],
          ].map(([label, key, type, ph]) => (
            <div key={key as string}>
              <label className="block text-xs font-semibold text-apple-500 mb-1">{label as string}</label>
              <input type={type as string} required={key !== 'maxDiscount'} placeholder={ph as string}
                value={(form as any)[key as string]} onChange={e => setForm({...form, [key as string]: key === 'code' ? e.target.value.toUpperCase() : e.target.value})}
                className="w-full px-3 py-2.5 bg-apple-50 border border-apple-150 rounded-xl text-sm input-focus" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-apple-500 mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full px-3 py-2.5 bg-apple-50 border border-apple-150 rounded-xl text-sm input-focus" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="submit" className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold card-shadow hover:opacity-90" style={{ background: 'linear-gradient(135deg, #f85f00, #ff7a2f)' }}>Create Coupon</button>
          </div>
        </motion.form>
      )}

      <div className="bg-white rounded-2xl card-shadow overflow-x-auto scrollbar-hide">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-[1fr_80px_80px_80px_36px] gap-4 px-5 py-3 bg-apple-50 border-b border-apple-100 text-xs font-bold text-apple-400 uppercase tracking-wider">
          <span>Code</span><span>Discount</span><span>Min Order</span><span>Expiry</span><span />
        </div>
        <div className="divide-y divide-apple-100 content-auto">
          {coupons.length === 0 ? (
            <div className="py-12 text-center text-apple-400 text-sm">No coupons yet.</div>
          ) : coupons.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_80px_80px_80px_36px] gap-4 px-5 py-3.5 items-center hover:bg-apple-50/60 transition-colors">
              <span className="font-bold text-apple-700 text-sm">{c.code}</span>
              <span className="text-sm text-apple-600">{c.discountPercentage}%</span>
              <span className="text-sm text-apple-500">{formatCurrency(c.minOrderValue)}</span>
              <span className="text-xs text-apple-400">{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : '∞'}</span>
              <button onClick={() => deleteCoupon(c.id)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── Main Admin Dashboard ─────────────────────── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Apple,          label: 'Fruits' },
  { icon: ShoppingCart,   label: 'Orders' },
  { icon: Users,          label: 'Users' },
  { icon: Settings,       label: 'Settings' },
  { icon: Ticket,         label: 'Coupons' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const PANELS: Record<string, React.ReactElement> = {
    Overview: <OverviewPanel />,
    Fruits:   <FruitsPanel />,
    Orders:   <OrdersPanel />,
    Users:    <UsersPanel />,
    Settings: <SettingsPanel />,
    Coupons:  <CouponsPanel />,
  };

  return (
    <div className="flex min-h-screen bg-apple-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-apple-150 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ boxShadow: '2px 0 16px rgba(0,0,0,0.04)' }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-apple-100">
          <div className="flex items-center gap-2.5">
            <FruitoIcon size={28} />
            <div>
              <p className="font-bold text-apple-700 text-sm leading-none" style={{letterSpacing: '-0.02em'}}>Fruito</p>
              <p className="text-[10px] text-apple-400 leading-none mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Back to store */}
        <div className="px-3 pt-3">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-apple-500 hover:bg-apple-50 rounded-xl transition-colors">
            <ArrowLeft size={13} /> Back to Store
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => { setActiveTab(label); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === label
                  ? 'bg-brand text-white card-shadow'
                  : 'text-apple-500 hover:bg-apple-50 hover:text-apple-700'
              }`}
            >
              <Icon size={16} />
              {label}
              {/* Urgent badge on Orders tab */}
              {label === 'Orders' && <UrgentBadge />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-apple-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden glass border-b border-apple-150 px-4 h-14 flex items-center gap-3 sticky top-0 z-30 card-shadow">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center bg-apple-100 rounded-xl">
            <LayoutDashboard size={16} className="text-apple-600" />
          </button>
          <h1 className="font-bold text-apple-700 text-sm">{activeTab}</h1>
        </header>

        <main className="flex-1 p-5 sm:p-8 overflow-auto">
          {/* Page header (desktop) */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-apple-700" style={{letterSpacing: '-0.02em'}}>{activeTab}</h1>
              <p className="text-apple-400 text-sm mt-0.5">Manage your {activeTab.toLowerCase()} and view insights.</p>
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {PANELS[activeTab]}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

/* ─── Urgent Orders Badge on Sidebar (live count) ─── */
const UrgentBadge = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.get('/admin/orders')
      .then(r => {
        const orders = r.data.content || r.data;
        setCount(orders.filter(isUrgent).length);
      })
      .catch(() => {});
  }, []);
  if (count === 0) return null;
  return (
    <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
      {count}
    </span>
  );
};

export default AdminDashboard;
