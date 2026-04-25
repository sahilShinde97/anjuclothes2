import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/SkeletonCard'
import usePageMeta from '../hooks/usePageMeta'
import { apiRequest } from '../lib/api'

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

function HomePage({ offersOnly = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [subcategories, setSubcategories] = useState(['All'])
  const [selectedSubcategory, setSelectedSubcategory] = useState('All')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [searchingSuggestions, setSearchingSuggestions] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, hasMore: false })
  const searchContainerRef = useRef(null)

  usePageMeta({
    title: offersOnly ? 'ANJU CLOTHES | Offers' : 'ANJU CLOTHES | Women Fashion Store',
    description: offersOnly ? 'Shop discounted products and special offers from ANJU CLOTHES.' : 'Mobile-friendly women fashion store with direct checkout, category filters, product pages, and WhatsApp support.',
    image: banners[0]?.image,
    url: typeof window !== 'undefined' ? window.location.href : '',
  })
  const priceRanges = [
    { id: 'all', label: 'All Prices' },
    { id: 'under-1000', label: 'Under 1000' },
    { id: '1000-1999', label: '1000-1999' },
    { id: '2000-plus', label: '2000+' },
  ]
  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'price_low', label: 'Price Low' },
    { id: 'price_high', label: 'Price High' },
    { id: 'name_asc', label: 'Name A-Z' },
  ]

  const loadProducts = async ({ page = 1, append = false, category = selectedCategory, subcategory = selectedSubcategory, search = searchTerm, priceRange = selectedPriceRange, sort = selectedSort } = {}) => {
    const isFirstLoad = page === 1
    if (isFirstLoad) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({ page: String(page), limit: '8' })
      if (category && category !== 'All') {
        params.set('category', category)
      }
      if (subcategory && subcategory !== 'All') {
        params.set('subcategory', subcategory)
      }
      if (search) {
        params.set('search', search)
      }
      if (priceRange && priceRange !== 'all') {
        params.set('priceRange', priceRange)
      }
      if (sort) {
        params.set('sort', sort)
      }
      if (offersOnly) {
        params.set('offersOnly', 'true')
      }

      const data = await apiRequest(`/products?${params.toString()}`)
      setProducts((current) => (append ? [...current, ...data.products] : data.products))
      setCategories(data.categories || ['All'])
      setSubcategories(data.subcategories || ['All'])
      setPagination(data.pagination)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      const initialSearch = new URLSearchParams(location.search).get('search')?.trim() || ''
      try {
        const bannerData = await apiRequest('/banners')
        setBanners(bannerData.banners || [])
      } catch {
        setBanners([])
      }

      setSearchInput(initialSearch)
      setSearchTerm(initialSearch)
      await loadProducts({ page: 1, append: false, category: 'All', subcategory: 'All', search: initialSearch, priceRange: 'all', sort: 'newest' })
    }

    loadInitialData()
  }, [location.search])

  useEffect(() => {
    const query = searchInput.trim()
    if (!query) {
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
          search: query,
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
  }, [searchInput])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) {
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (banners.length <= 1) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setBannerIndex((current) => (current + 1) % banners.length)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [banners.length])

  const activeBanner = banners[bannerIndex] || null
  const featuredProduct = products[0] || null

  const activeSummary = useMemo(() => {
    if (searchTerm) {
      return `Showing results for "${searchTerm}"`
    }

    if (selectedCategory !== 'All') {
      return `Showing ${selectedCategory}`
    }

    return `${products.length} items available`
  }, [products.length, searchTerm, selectedCategory])

  const handleSearch = (event) => {
    event.preventDefault()
    const nextSearch = searchInput.trim()
    const bestMatch = getBestSearchMatch(searchSuggestions, nextSearch)
    if (bestMatch?._id) {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
      navigate(`/products/${bestMatch._id}`)
      return
    }
    setSearchTerm(nextSearch)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    loadProducts({ page: 1, append: false, category: selectedCategory, subcategory: selectedSubcategory, search: nextSearch, priceRange: selectedPriceRange, sort: selectedSort })
  }

  const handleSuggestionSelect = (productId) => {
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    navigate(`/products/${productId}`)
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

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedSubcategory('All')
    loadProducts({ page: 1, append: false, category, subcategory: 'All', search: searchTerm, priceRange: selectedPriceRange, sort: selectedSort })
  }

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategory(subcategory)
    loadProducts({ page: 1, append: false, category: selectedCategory, subcategory, search: searchTerm, priceRange: selectedPriceRange, sort: selectedSort })
  }

  const handlePriceRangeChange = (priceRange) => {
    setSelectedPriceRange(priceRange)
    loadProducts({ page: 1, append: false, category: selectedCategory, subcategory: selectedSubcategory, search: searchTerm, priceRange, sort: selectedSort })
  }

  const handleSortChange = (event) => {
    const sort = event.target.value
    setSelectedSort(sort)
    loadProducts({ page: 1, append: false, category: selectedCategory, subcategory: selectedSubcategory, search: searchTerm, priceRange: selectedPriceRange, sort })
  }

  const handleLoadMore = () => {
    if (!pagination.hasMore) {
      return
    }

    loadProducts({
      page: pagination.page + 1,
      append: true,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      search: searchTerm,
      priceRange: selectedPriceRange,
      sort: selectedSort,
    })
  }

  const handleRetryProducts = () => {
    loadProducts({
      page: 1,
      append: false,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      search: searchTerm,
      priceRange: selectedPriceRange,
      sort: selectedSort,
    })
  }

  const handleBannerTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX)
  }

  const handleBannerTouchEnd = (event) => {
    if (touchStartX === null || banners.length <= 1) {
      return
    }

    const delta = event.changedTouches[0].clientX - touchStartX

    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        setBannerIndex((current) => (current + 1) % banners.length)
      } else {
        setBannerIndex((current) => (current === 0 ? banners.length - 1 : current - 1))
      }
    }

    setTouchStartX(null)
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#141416] shadow-glow">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-7">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-gold">
               {offersOnly ? 'Special offers' : 'Premium women\'s fashion'}
             </span>
              <h1 className="mt-4 max-w-lg font-heading text-4xl leading-none text-white sm:text-5xl lg:text-6xl">
                {offersOnly ? 'Grab the latest deals and savings.' : 'Shop elegant looks with direct store checkout.'}
             </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65 sm:text-base">
              {offersOnly ? 'Explore only products with active discounts and offer pricing.' : 'Explore stylish products in a clean, simple, and mobile-friendly shopping experience.'}
            </p>

            <form onSubmit={handleSearch} className="mt-5 max-w-lg" ref={searchContainerRef}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onFocus={() => {
                    if (searchInput.trim()) {
                      setShowSuggestions(true)
                    }
                  }}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Search products..."
                  className="min-h-[48px] flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none"
                />
                <button type="submit" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e5c17f]">
                  Search
                </button>
                {(searchInput || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setSearchTerm('')
                      loadProducts({ page: 1, append: false, category: selectedCategory, subcategory: selectedSubcategory, search: '', priceRange: selectedPriceRange, sort: selectedSort })
                    }}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/5"
                  >
                    Clear
                  </button>
                )}
              </div>
              {showSuggestions ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-glow">
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
                          <ImageWithFallback
                            src={(suggestion.images && suggestion.images[0]) || suggestion.image}
                            alt={suggestion.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
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

            <div className="mt-5 text-sm text-white/55">{pagination.total || products.length} products available</div>
          </div>

          <div className="p-3 sm:p-4">
            {activeBanner ? (
              <div className="relative h-full overflow-hidden rounded-[1.4rem]">
                <div onTouchStart={handleBannerTouchStart} onTouchEnd={handleBannerTouchEnd}>
                  <ImageWithFallback
                    src={activeBanner.image}
                    alt={activeBanner.title}
                    loading="eager"
                    fetchPriority="high"
                    className="h-[260px] w-full object-cover sm:h-[360px] lg:h-full"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Store banner</p>
                  <h2 className="mt-2 max-w-xs font-heading text-3xl leading-none text-white sm:text-4xl">{activeBanner.title}</h2>
                  <p className="mt-3 max-w-sm text-sm text-white/75">{activeBanner.subtitle}</p>
                  <a
                    href={activeBanner.ctaLink || '#products'}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-4 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#e5c17f]"
                  >
                    {activeBanner.ctaLabel || 'Shop Now'}
                  </a>
                  <div className="mt-4 flex gap-2">
                    {banners.map((banner, index) => (
                      <button
                        key={banner._id}
                        type="button"
                        onClick={() => setBannerIndex(index)}
                        className={`h-2.5 w-8 rounded-full transition ${index === bannerIndex ? 'bg-gold' : 'bg-white/25'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : featuredProduct ? (
              <ImageWithFallback
                src={featuredProduct.image}
                alt={featuredProduct.name}
                loading="eager"
                fetchPriority="high"
                className="h-[260px] w-full rounded-[1.4rem] object-cover sm:h-[360px] lg:h-full"
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-[1.4rem] bg-white/5 text-white/60 sm:h-[360px] lg:h-full">
                No products yet
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Categories</p>
            <h2 className="mt-1 font-heading text-3xl text-white sm:text-4xl">Browse by type</h2>
          </div>
          <div className="text-sm text-white/60">{activeSummary}</div>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${selectedCategory === category ? 'border-gold/60 bg-gold/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {selectedCategory !== 'All' && subcategories.length > 1 ? (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory}
                type="button"
                onClick={() => handleSubcategoryChange(subcategory)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${selectedSubcategory === subcategory ? 'border-gold/60 bg-gold/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {subcategory}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-[#141416] p-4 shadow-glow sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {priceRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => handlePriceRangeChange(range.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${selectedPriceRange === range.id ? 'border-gold/60 bg-gold/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 text-sm text-white/70">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current text-gold">
              <path d="M3 6h18v2H3V6Zm3 5h12v2H6v-2Zm3 5h6v2H9v-2Z" />
            </svg>
            <select value={selectedSort} onChange={handleSortChange} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none">
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id} className="text-black">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section id="products" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">{offersOnly ? 'Offers' : 'Products'}</p>
            <h2 className="mt-1 font-heading text-3xl text-white sm:text-4xl">{offersOnly ? 'Discounted collection' : 'Latest collection'}</h2>
          </div>
          <div className="text-sm text-white/60">Page {pagination.page || 1}</div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={handleRetryProducts}
              className="mt-3 inline-flex min-h-[42px] items-center justify-center rounded-full border border-red-400/40 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/10"
            >
              Retry Loading Products
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
               {products.filter((product) => product.category !== 'Saree' && (offersOnly ? (product.discountPercentage || 0) > 0 : true)).map((product) => (
                 <ProductCard key={product._id} product={product} />
               ))}
            </div>

            {pagination.hasMore ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/5 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            ) : null}
          </>
        ) : error ? (
          <div className="rounded-[1.5rem] border border-red-500/30 bg-[#1a1113] p-8 text-center">
            <p className="text-white/80">Products could not be loaded right now.</p>
            <p className="mt-2 text-sm text-red-200/90">Please check internet connection and retry.</p>
            <button
              type="button"
              onClick={handleRetryProducts}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-[#141416] p-8 text-center text-white/65">
            No products found.
          </div>
        )}
      </section>

    </main>
  )
}

export default HomePage
