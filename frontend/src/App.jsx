import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { hideAppLoader } from './lib/appLoader'
import HomePage from './pages/HomePage'
import OffersPage from './pages/OffersPage'

const AccountPage = lazy(() => import('./pages/AccountPage'))
const AddressPage = lazy(() => import('./pages/AddressPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminOrderDetailPage = lazy(() => import('./pages/AdminOrderDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))

function App() {
  useEffect(() => {
    hideAppLoader()
  }, [])

  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader label="Loading page" />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/products/:id" element={<ProductPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/address"
                  element={
                    <ProtectedRoute>
                      <AddressPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-success"
                  element={
                    <ProtectedRoute>
                      <OrderSuccessPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminPage section="dashboard" />} />
                <Route path="products" element={<AdminPage section="products" />} />
                <Route path="orders" element={<AdminPage section="orders" />} />
                <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                <Route path="banners" element={<AdminPage section="banners" />} />
              </Route>
            </Routes>
          </Suspense>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
