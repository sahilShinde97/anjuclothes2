import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ImageWithFallback from './ImageWithFallback'
import { apiRequest } from '../lib/api'

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919614510909'
const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hello%20ANJU%20CLOTHES%2C%20I%20want%20to%20shop.`

function getBestSearchMatch(products, rawQuery) {
  const query = rawQuery.trim().toLowerCase()
  if (!query || products.length === 0) {
    return null
  }
  const exact = products.find((product) => (product.name || '').trim().toLowerCase() === query)
  if (exact) {
    return exact
  }
  const startsWith = products.find((product) => (product.name || '').trim().toLowerCase().startsWith(query))
  if (startsWith) {
    return startsWith
  }
  return products[0]
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [searchingSuggestions, setSearchingSuggestions] = useState(false)
  const desktopSearchContainerRef = useRef(null)
  const mobileSearchContainerRef = useRef(null)
  const trimmedSearchInput = useMemo(() => searchInput.trim(), [searchInput])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    if (!trimmedSearchInput) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
      setSearchingSuggestions(false)
      return undefined
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchingSuggestions(true)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '6',
          search: trimmedSearchInput,
        })
        const data = await apiRequest(`/products?${params.toString()}`)
        setSearchSuggestions(data.products || [])
        setShowSuggestions(true)
        setActiveSuggestionIndex(-1)
      } catch {
        setSearchSuggestions([])
        setShowSuggestions(true)
      } finally {
        setSearchingSuggestions(false)
      }
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [trimmedSearchInput])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const insideDesktop = desktopSearchContainerRef.current?.contains(event.target)
      const insideMobile = mobileSearchContainerRef.current?.contains(event.target)
      if (!insideDesktop && !insideMobile) {
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSuggestionSelect = (productId) => {
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    setSearchInput('')
    navigate(`/products/${productId}`)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const bestMatch = getBestSearchMatch(searchSuggestions, searchInput)
    if (bestMatch?._id) {
      handleSuggestionSelect(bestMatch._id)
      return
    }
    if (trimmedSearchInput) {
      navigate(`/?search=${encodeURIComponent(trimmedSearchInput)}`)
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }
  }

  const handleSearchInputKeyDown = (event) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % searchSuggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current <= 0 ? searchSuggestions.length - 1 : current - 1))
      return
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault()
      const selectedProduct = searchSuggestions[activeSuggestionIndex]
      if (selectedProduct?._id) {
        handleSuggestionSelect(selectedProduct._id)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b0c]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link to="/" className="font-heading text-2xl tracking-[0.24em] text-champagne">
              ANJU CLOTHES
            </Link>
            <p className="mt-1 text-xs text-white/45">Simple fashion shopping for women</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative hidden w-full max-w-md sm:block" ref={desktopSearchContainerRef}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onFocus={() => {
                if (trimmedSearchInput) {
                  setShowSuggestions(true)
                }
              }}
              onKeyDown={handleSearchInputKeyDown}
              placeholder="Search products..."
              className="min-h-[44px] w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
            />
            {showSuggestions ? (
              <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-glow">
                {searchingSuggestions ? (
                  <div className="px-4 py-3 text-sm text-white/60">Searching...</div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion._id}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion._id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                          activeSuggestionIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <ImageWithFallback src={(suggestion.images && suggestion.images[0]) || suggestion.image} alt={suggestion.name} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{suggestion.name}</p>
                          <p className="mt-0.5 text-xs text-gold">₹{suggestion.finalPrice ?? suggestion.discountedPrice ?? suggestion.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-white/60">No matching products.</div>
                )}
              </div>
            ) : null}
          </form>

          <nav className="hidden items-center gap-2 sm:flex sm:gap-3">
            <NavLink to="/" className="rounded-full px-4 py-2 text-sm text-white/75 transition hover:text-gold">
              Home
            </NavLink>
            <NavLink to="/offers" className="rounded-full px-4 py-2 text-sm text-white/75 transition hover:text-gold">
              Offers
            </NavLink>
            {!user ? (
              <>
                <NavLink to="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5">
                  Login
                </NavLink>
                <NavLink to="/signup" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black">
                  Sign Up
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/cart" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5">
                  Cart
                </NavLink>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((current) => !current)}
                    className="inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-black">
                      {(user.name || 'A').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-left leading-tight">
                      <span className="block text-[11px] uppercase tracking-[0.16em] text-white/45">Account</span>
                      <span className="block text-sm text-white">{user.name}</span>
                    </span>
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-full z-40 mt-3 w-64 rounded-2xl border border-white/10 bg-[#141416] p-3 shadow-glow">
                      <p className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/45">Your Account</p>
                      <div className="space-y-1">
                        <Link to="/account" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/5">Profile & Orders</Link>
                        <Link to="/account/address" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/5">Saved Address</Link>
                        <Link to="/cart" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/5">Cart</Link>
                        {user.role === 'admin' ? <Link to="/admin" onClick={() => setAccountOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/5">Admin Panel</Link> : null}
                        <button type="button" onClick={() => { setAccountOpen(false); handleLogout() }} className="block w-full rounded-xl px-3 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10">Logout</button>
                      </div>
                    </div>
                  ) : null}
                </div>
                {user.role === 'admin' ? (
                  <NavLink to="/admin" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black">
                    Admin
                  </NavLink>
                ) : null}
              </>
            )}
          </nav>
        </div>

        <div className="mx-auto block max-w-7xl px-4 pb-3 sm:hidden">
          <form onSubmit={handleSearchSubmit} className="relative" ref={mobileSearchContainerRef}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onFocus={() => {
                if (trimmedSearchInput) {
                  setShowSuggestions(true)
                }
              }}
              onKeyDown={handleSearchInputKeyDown}
              placeholder="Search products..."
              className="min-h-[44px] w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
            />
            {showSuggestions ? (
              <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-glow">
                {searchingSuggestions ? (
                  <div className="px-4 py-3 text-sm text-white/60">Searching...</div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion._id}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion._id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                          activeSuggestionIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <ImageWithFallback src={(suggestion.images && suggestion.images[0]) || suggestion.image} alt={suggestion.name} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{suggestion.name}</p>
                          <p className="mt-0.5 text-xs text-gold">₹{suggestion.finalPrice ?? suggestion.discountedPrice ?? suggestion.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-white/60">No matching products.</div>
                )}
              </div>
            ) : null}
          </form>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-white/10 bg-[#090909] pb-24 sm:pb-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-white/65 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <p className="font-heading text-2xl text-champagne">ANJU CLOTHES</p>
            <p className="mt-2 max-w-xs leading-6">Simple shopping experience with direct checkout and quick support.</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.18em] text-white/85">Contact</p>
            <p className="mt-2">WhatsApp: +91 96145 10909</p>
            <p className="mt-1">Instagram: @anju_.clothes</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.18em] text-white/85">Quick Links</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/5">Store</Link>
              <Link to="/offers" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/5">Offers</Link>
              {!user ? <Link to="/login" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/5">Login</Link> : null}
              {user ? <Link to="/account" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/5">Account</Link> : null}
              {user?.role === 'admin' ? <Link to="/admin" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/5">Admin</Link> : null}
            </div>
          </div>
        </div>
      </footer>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-[0_20px_45px_rgba(31,168,85,0.35)] transition hover:scale-[1.02] hover:bg-[#17934a] sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3 sm:text-sm sm:font-semibold"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current sm:h-5 sm:w-5"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.62 2 2.2 6.4 2.2 11.82c0 1.74.45 3.43 1.31 4.92L2 22l5.42-1.42a9.8 9.8 0 0 0 4.6 1.17h.01c5.41 0 9.82-4.41 9.82-9.83 0-2.62-1.02-5.08-2.8-6.99Zm-7.02 15.17h-.01a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-3.22.84.86-3.14-.2-.32a8.14 8.14 0 0 1-1.25-4.32c0-4.5 3.67-8.16 8.18-8.16 2.18 0 4.22.85 5.76 2.39a8.1 8.1 0 0 1 2.38 5.77c0 4.5-3.67 8.16-8.16 8.16Zm4.48-6.12c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.57.12-.17.25-.65.8-.8.97-.15.17-.29.19-.54.06-.25-.12-1.03-.38-1.96-1.2-.72-.64-1.2-1.43-1.35-1.68-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.57-1.38-.78-1.89-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.43.06-.65.31-.23.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.17 1.71 2.61 4.15 3.66.58.25 1.04.4 1.4.51.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z" /></svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      <nav className="fixed inset-x-4 bottom-4 z-30 rounded-full border border-white/10 bg-[#111113]/95 p-2 shadow-glow backdrop-blur sm:hidden">
        <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
          <Link to="/" className="rounded-full px-3 py-2">Home</Link>
          <Link to="/offers" className="rounded-full px-3 py-2">Offers</Link>
          {user ? <Link to="/cart" className="rounded-full px-3 py-2">Cart</Link> : <Link to="/login" className="rounded-full px-3 py-2">Login</Link>}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-2">Chat</a>
        </div>
      </nav>
    </div>
  )
}

export default Layout
