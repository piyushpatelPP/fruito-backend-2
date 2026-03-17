import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Home = lazy(() => import('./pages/Home'))
const Cart = lazy(() => import('./pages/Cart'))
const Orders = lazy(() => import('./pages/Orders'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
import { useAuthStore } from './store/useAuthStore'
import { useCartStore } from './store/useCartStore'

function App() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const loadCart = useCartStore((state) => state.loadCart)

  // On page refresh, restore the logged-in user's cart
  useEffect(() => {
    if (user?.id) {
      loadCart(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-apple-50 text-apple-600 font-sans selection:bg-brand/20 selection:text-brand">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-apple-50">
            <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          </div>
        }>
          <Routes>
            <Route path="/"       element={token ? <Home /> : <Navigate to="/login" />} />
            <Route path="/login"  element={!token ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!token ? <Signup /> : <Navigate to="/" />} />
            <Route path="/cart"   element={token ? <Cart /> : <Navigate to="/login" />} />
            <Route path="/orders" element={token ? <Orders /> : <Navigate to="/login" />} />
            <Route path="/admin"  element={token && user?.role === 'ROLE_ADMIN' ? <AdminDashboard /> : (token ? <Navigate to="/" /> : <Navigate to="/login" />)} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}

export default App
