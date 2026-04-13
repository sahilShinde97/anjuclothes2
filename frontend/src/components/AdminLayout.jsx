import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#080809] text-white">
      <aside className="hidden fixed inset-y-0 left-0 w-72 border-r border-white/10 bg-[#101012] lg:block">
        <div className="p-6">
          <Link to="/admin" className="font-heading text-3xl tracking-[0.16em] text-champagne">ANJU CLOTHES</Link>
          <p className="mt-2 text-sm text-white/45">Admin panel</p>
        </div>
        <nav className="space-y-2 px-4">
          {[
            { to: '/admin', label: 'Dashboard' },
            { to: '/admin/products', label: 'Products' },
            { to: '/admin/orders', label: 'Orders' },
            { to: '/admin/banners', label: 'Banners' },
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-gold text-black' : 'text-white/70 hover:bg-white/5'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold">{user?.email}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/" className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5">Store</Link>
            <button type="button" onClick={handleLogout} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5">Logout</button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080809]/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <Link to="/admin" className="font-heading text-2xl text-champagne">ANJU CLOTHES</Link>
              <p className="text-xs text-white/45">Admin panel</p>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70">Logout</button>
          </div>
          <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4">
            {[
              { to: '/admin', label: 'Dashboard' },
              { to: '/admin/products', label: 'Products' },
              { to: '/admin/orders', label: 'Orders' },
              { to: '/admin/banners', label: 'Banners' },
            ].map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-gold text-black' : 'border border-white/10 bg-white/5 text-white/70'}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
