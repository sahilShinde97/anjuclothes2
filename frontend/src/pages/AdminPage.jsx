import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import SkeletonCard from '../components/SkeletonCard'
import { useToast } from '../context/ToastContext'
import { apiRequest } from '../lib/api'

const productInitialState = {
  name: '',
  price: '',
  stock: '0',
  discountPercentage: '0',
  groupId: '',
  colorName: '',
  colorHex: '#000000',
  sizesText: '',
  category: '',
  subcategory: '',
  description: '',
  gallery: [],
}

const bannerInitialState = {
  title: '',
  subtitle: '',
  image: '',
  ctaLabel: 'Shop Now',
  ctaLink: '#products',
  order: 0,
  isActive: true,
}

const orderStatuses = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
const paymentStatuses = ['pending', 'paid', 'failed']
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const standardSizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const jeansSizeOptions = Array.from({ length: 15 }, (_, index) => String(index + 26))

function parseSizesText(value) {
  if (typeof value !== 'string') {
    return []
  }
  return value
    .split(/[,\n/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function AdminPage({ section = 'dashboard' }) {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [banners, setBanners] = useState([])
  const [productForm, setProductForm] = useState(productInitialState)
  const [bannerForm, setBannerForm] = useState(bannerInitialState)
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingBannerId, setEditingBannerId] = useState(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [productPage, setProductPage] = useState(1)
  const [productPagination, setProductPagination] = useState({ totalPages: 1, page: 1 })
  const [orderPage, setOrderPage] = useState(1)
  const [orderPagination, setOrderPagination] = useState({ totalPages: 1, page: 1 })
  const { addToast } = useToast()

  const loadProducts = async (nextPage = 1) => {
    const data = await apiRequest(`/products?page=${nextPage}&limit=10`)
    setProducts(data.products)
    setProductPagination(data.pagination)
    setProductPage(nextPage)
  }

  const loadOrders = async (nextPage = 1) => {
    const data = await apiRequest(`/admin/orders?page=${nextPage}&limit=10`)
    setOrders(data.orders)
    setOrderPagination(data.pagination)
    setOrderPage(nextPage)
  }

  const loadBanners = async () => {
    const data = await apiRequest('/banners/admin')
    setBanners(data.banners)
  }

  const loadSummary = async () => {
    const data = await apiRequest('/admin/summary')
    setSummary(data.summary)
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([loadProducts(1), loadOrders(1), loadBanners(), loadSummary()])
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const productCategories = useMemo(() => {
    const values = products.map((product) => product.category)
    return [...new Set(['Indian Wear', 'Western Wear', 'Top Wear', 'Bottom Wear', 'Undergarments', ...values.filter((value) => value !== 'Saree')])]
  }, [products])

  const undergarmentSubcategories = ['Bra Set', 'Panty Pack', 'Camisole', 'Nightwear', 'Shapewear']

  const handleProductChange = (event) => {
    const { name, value } = event.target
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  const toggleProductSize = (sizeValue) => {
    setProductForm((current) => {
      const currentSizes = parseSizesText(current.sizesText)
      const hasSize = currentSizes.includes(sizeValue)
      const nextSizes = hasSize
        ? currentSizes.filter((item) => item !== sizeValue)
        : [...currentSizes, sizeValue]
      return { ...current, sizesText: nextSizes.join(', ') }
    })
  }

  const handleProductFiles = (event) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => ALLOWED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES)
    if (validFiles.length !== files.length) {
      addToast({ title: 'Only JPG, PNG, WEBP up to 4MB are allowed.', type: 'error' })
    }
    setProductForm((current) => ({
      ...current,
      gallery: [...current.gallery, ...validFiles.slice(0, 5 - current.gallery.length).map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        file,
        preview: URL.createObjectURL(file),
      }))],
    }))
    event.target.value = ''
  }

  const moveGalleryImage = (index, direction) => {
    setProductForm((current) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.gallery.length) {
        return current
      }
      const nextGallery = [...current.gallery]
      const [moved] = nextGallery.splice(index, 1)
      nextGallery.splice(targetIndex, 0, moved)
      return { ...current, gallery: nextGallery }
    })
  }

  const removeGalleryImage = (index) => {
    setProductForm((current) => {
      const nextGallery = current.gallery.filter((_, imageIndex) => imageIndex !== index)
      return { ...current, gallery: nextGallery }
    })
  }

  const replaceGalleryImage = (index, file) => {
    if (!file) {
      return
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      addToast({ title: 'Only JPG, PNG, WEBP up to 4MB are allowed.', type: 'error' })
      return
    }
    setProductForm((current) => ({
      ...current,
      gallery: current.gallery.map((imageItem, imageIndex) =>
        imageIndex === index
          ? { ...imageItem, file, preview: URL.createObjectURL(file), url: undefined }
          : imageItem,
      ),
    }))
  }

  const uploadImagesToCloudinary = async (galleryItems) => {
    if (!galleryItems || galleryItems.length === 0) {
      return []
    }

    const signatureData = await apiRequest('/uploads/signature', { method: 'POST' })

    const uploads = galleryItems.map(async (galleryItem) => {
      if (galleryItem?.url && !galleryItem?.file) {
        return galleryItem.url
      }
      const file = galleryItem?.file || galleryItem
      if (!file) {
        return ''
      }
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signatureData.apiKey)
      formData.append('timestamp', signatureData.timestamp)
      formData.append('signature', signatureData.signature)
      formData.append('folder', signatureData.folder)
      formData.append('allowed_formats', signatureData.allowedFormats)
      formData.append('transformation', signatureData.transformation)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Image upload failed.')
      }

      return data.secure_url
    })

    return (await Promise.all(uploads)).filter(Boolean)
  }

  const handleBannerChange = (event) => {
    const { name, value, type, checked } = event.target
    setBannerForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleBannerFiles = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 1)
    setBannerForm((current) => ({ ...current, imageFile: files[0] || null }))
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    setError('')
    setUploadingImages(true)

    try {
      const finalImages = await uploadImagesToCloudinary(productForm.gallery)
      const defaultImages = finalImages

      if (defaultImages.length === 0) {
        throw new Error('Add at least one product image.')
      }

      const payload = {
        name: productForm.name,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        discountPercentage: Number(productForm.discountPercentage || 0),
        groupId: productForm.groupId.trim(),
        colorName: productForm.colorName.trim(),
        colorHex: productForm.colorHex || '',
        sizes: parseSizesText(productForm.sizesText),
        category: productForm.category,
        subcategory: productForm.subcategory,
        description: productForm.description,
        images: defaultImages,
        image: defaultImages[0] || '',
      }

      if (editingProductId) {
        await apiRequest(`/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(payload) })
        addToast({ title: 'Product updated successfully.' })
      } else {
        await apiRequest('/products', { method: 'POST', body: JSON.stringify(payload) })
        addToast({ title: 'Product added successfully.' })
      }

      setEditingProductId(null)
      setProductForm(productInitialState)
      await Promise.all([loadProducts(productPage), loadSummary()])
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    } finally {
      setUploadingImages(false)
    }
  }

  const submitBanner = async (event) => {
    event.preventDefault()
    setError('')

    try {
      let bannerImage = bannerForm.image

      if (bannerForm.imageFile) {
        const [uploaded] = await uploadImagesToCloudinary([bannerForm.imageFile])
        bannerImage = uploaded
      }

      const payload = { ...bannerForm, image: bannerImage, order: Number(bannerForm.order) }
      delete payload.imageFile

      if (editingBannerId) {
        await apiRequest(`/banners/${editingBannerId}`, { method: 'PUT', body: JSON.stringify(payload) })
        addToast({ title: 'Banner updated successfully.' })
      } else {
        await apiRequest('/banners', { method: 'POST', body: JSON.stringify(payload) })
        addToast({ title: 'Banner added successfully.' })
      }

      setEditingBannerId(null)
      setBannerForm(bannerInitialState)
      await Promise.all([loadBanners(), loadSummary()])
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Delete ${productName}?`)) {
      return
    }

    try {
      await apiRequest(`/products/${productId}`, { method: 'DELETE' })
      addToast({ title: 'Product deleted successfully.' })
      await Promise.all([loadProducts(productPage), loadSummary()])
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    }
  }

  const handleDeleteBanner = async (bannerId, title) => {
    if (!window.confirm(`Delete banner "${title}"?`)) {
      return
    }

    try {
      await apiRequest(`/banners/${bannerId}`, { method: 'DELETE' })
      addToast({ title: 'Banner deleted successfully.' })
      await Promise.all([loadBanners(), loadSummary()])
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    }
  }

  const handleOrderUpdate = async (orderId, patch) => {
    try {
      const data = await apiRequest(`/admin/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(patch) })
      setOrders((current) => current.map((order) => (order._id === orderId ? data.order : order)))
      addToast({ title: 'Order updated successfully.' })
      await loadSummary()
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order?')) {
      return
    }

    try {
      await apiRequest(`/admin/orders/${orderId}`, { method: 'DELETE' })
      addToast({ title: 'Order deleted successfully.' })
      await Promise.all([loadOrders(orderPage), loadSummary()])
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    }
  }

  const selectedSizes = useMemo(() => parseSizesText(productForm.sizesText), [productForm.sizesText])

  const summaryCards = summary
    ? [
        { label: 'Total Products', value: summary.totalProducts, icon: 'box' },
        { label: 'Total Orders', value: summary.totalOrders, icon: 'bag' },
        { label: 'Pending Orders', value: summary.pendingOrders, icon: 'clock' },
        { label: 'Delivered Orders', value: summary.deliveredOrders, icon: 'check' },
        { label: 'Total Banners', value: summary.totalBanners, icon: 'image' },
        { label: 'Top Category', value: summary.categoryBreakdown?.[0]?._id || 'N/A', icon: 'tag' },
      ]
    : []

  return (
    <div className="space-y-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Admin dashboard</p>
        <h1 className="mt-2 font-heading text-4xl text-white">{section === 'orders' ? 'Manage orders' : section === 'products' ? 'Manage products' : section === 'banners' ? 'Manage banners' : 'Store control panel'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
          Track orders, payment method, payment status, delivery progress, products, and homepage banners from one separate admin panel.
        </p>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </section>

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-[#141416] p-4 shadow-glow">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
                  {item.icon === 'box' ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.2 6.66 3.7L12 11.6 5.34 7.9 12 4.2Zm-7 5.42 6 3.33v6.85l-6-3.33V9.62Zm8 10.18v-6.85l6-3.33v6.85l-6 3.33Z" /></svg> : item.icon === 'bag' ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6 7V6a6 6 0 1 1 12 0v1h2v15H4V7h2Zm2 0h8V6a4 4 0 1 0-8 0v1Z" /></svg> : item.icon === 'clock' ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h5v-2h-4V6h-2v7Z" /></svg> : item.icon === 'check' ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg> : item.icon === 'image' ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v10h16V7H4Zm3 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm11 7H6l2.5-3 2 2.5 3.5-4L18 16Z" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M10.59 2H4a2 2 0 0 0-2 2v6.59a2 2 0 0 0 .59 1.41l9.41 9.41a2 2 0 0 0 2.83 0l6.58-6.58a2 2 0 0 0 0-2.83L12 2.59A2 2 0 0 0 10.59 2ZM7.5 8A1.5 1.5 0 1 1 9 6.5 1.5 1.5 0 0 1 7.5 8Z" /></svg>}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                  <p className="mt-1 font-semibold text-white">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {section === 'dashboard' ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow">
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Quick actions</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/admin/products" className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white hover:bg-white/10">Manage Products</Link>
              <Link to="/admin/orders" className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white hover:bg-white/10">Manage Orders</Link>
              <Link to="/admin/banners" className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white hover:bg-white/10">Manage Banners</Link>
              <Link to="/" className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white hover:bg-white/10">View Store</Link>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow">
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Recent Orders</p>
            <div className="mt-4 space-y-3">
              {orders.slice(0, 4).map((order) => (
                <div key={order._id} className="rounded-[1.1rem] border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-white">{order.product?.name || 'Product removed'}</p>
                  <p className="mt-1 text-sm text-white/60">{order.customerName} • {order.paymentMethod.toUpperCase()} • {order.orderStatus}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {section === 'products' ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-gold">Product form</p>
              <h2 className="mt-2 font-heading text-3xl text-white">{editingProductId ? 'Edit Product' : 'Add Product'}</h2>
              <form onSubmit={submitProduct} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Product Name</span><input required name="name" value={productForm.name} onChange={handleProductChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Price</span><input required min="1" type="number" name="price" value={productForm.price} onChange={handleProductChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Stock</span><input required min="0" type="number" name="stock" value={productForm.stock} onChange={handleProductChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Discount %</span><input min="0" max="90" type="number" name="discountPercentage" value={productForm.discountPercentage} onChange={handleProductChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Category</span><input required list="product-categories" name="category" value={productForm.category} onChange={handleProductChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <datalist id="product-categories">{productCategories.map((category) => <option key={category} value={category} />)}</datalist>
                <label className="space-y-2"><span className="text-sm font-medium">Group ID</span><input name="groupId" value={productForm.groupId} onChange={handleProductChange} placeholder="same id for all color variants" className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Color Name</span><input name="colorName" value={productForm.colorName} onChange={handleProductChange} placeholder="Red" className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Color Code</span><input type="color" name="colorHex" value={productForm.colorHex || '#000000'} onChange={handleProductChange} className="h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-2 text-sm outline-none" /></label>
                <label className="space-y-2"><span className="text-sm font-medium">Subcategory</span><input list="product-subcategories" name="subcategory" value={productForm.subcategory} onChange={handleProductChange} placeholder={productForm.category === 'Undergarments' ? 'Choose undergarment type' : 'Optional'} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
                <datalist id="product-subcategories">{(productForm.category === 'Undergarments' ? undergarmentSubcategories : products.map((product) => product.subcategory).filter(Boolean)).map((subcategory) => <option key={subcategory} value={subcategory} />)}</datalist>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium">Sizes</span>
                  <input name="sizesText" value={productForm.sizesText} onChange={handleProductChange} placeholder="S, M, L, XL or 26, 28, 30" className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" />
                  <p className="text-xs text-white/45">You can type sizes or tap buttons below to add/remove quickly.</p>
                  <div className="space-y-3 pt-1">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/55">Standard sizes</p>
                      <div className="flex flex-wrap gap-2">
                        {standardSizeOptions.map((sizeOption) => {
                          const isSelected = selectedSizes.includes(sizeOption)
                          return (
                            <button
                              key={sizeOption}
                              type="button"
                              onClick={() => toggleProductSize(sizeOption)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                isSelected
                                  ? 'border-gold bg-gold/20 text-white'
                                  : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                              }`}
                            >
                              {sizeOption}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/55">Jeans sizes (26-40)</p>
                      <div className="flex flex-wrap gap-2">
                        {jeansSizeOptions.map((sizeOption) => {
                          const isSelected = selectedSizes.includes(sizeOption)
                          return (
                            <button
                              key={sizeOption}
                              type="button"
                              onClick={() => toggleProductSize(sizeOption)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                isSelected
                                  ? 'border-gold bg-gold/20 text-white'
                                  : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                              }`}
                            >
                              {sizeOption}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </label>
                <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Description</span><textarea name="description" value={productForm.description} onChange={handleProductChange} rows="4" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Add product details for your direct store." /></label>
                <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Product Images</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleProductFiles} className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" /><p className="text-xs text-white/45">Upload up to 5 product images. First image is the main image.</p></label>
                {productForm.gallery.length > 0 ? (
                  <div className="sm:col-span-2 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    {productForm.gallery.map((imageItem, index) => (
                      <div key={imageItem.id || imageItem.url || index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111113] p-3">
                        <ImageWithFallback src={imageItem.preview || imageItem.url} alt={`Product preview ${index + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white">{index === 0 ? 'Main Image' : `Image ${index + 1}`}</p>
                          <p className="text-xs text-white/50">{imageItem.file?.name || 'Existing image'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => moveGalleryImage(index, 'up')} disabled={index === 0} className="rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:opacity-40">Up</button>
                          <button type="button" onClick={() => moveGalleryImage(index, 'down')} disabled={index === productForm.gallery.length - 1} className="rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:opacity-40">Down</button>
                          <label className="rounded-full border border-white/10 px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5">
                            Replace
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => replaceGalleryImage(index, event.target.files?.[0])} />
                          </label>
                          <button type="button" onClick={() => removeGalleryImage(index)} className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-300">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="sm:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" disabled={uploadingImages} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e5c17f] disabled:opacity-70">{uploadingImages ? 'Uploading Images...' : editingProductId ? 'Update Product' : 'Add Product'}</button>
                  {editingProductId ? <button type="button" onClick={() => { setEditingProductId(null); setProductForm(productInitialState) }} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/5">Cancel</button> : null}
                </div>
              </form>
            </section>

            <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
              <div className="flex items-end justify-between gap-3"><div><p className="text-sm uppercase tracking-[0.24em] text-gold">Products</p><h2 className="mt-1 font-heading text-3xl text-white">All products</h2></div><span className="text-sm text-white/60">Page {productPagination.page} of {productPagination.totalPages}</span></div>
              {loading ? (
                <div className="mt-5 grid grid-cols-1 gap-4 min-[430px]:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {products
                    .filter((product) => product.category !== 'Saree')
                    .map((product) => (
                      <div key={product._id} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-3 sm:p-4">
                        <ImageWithFallback src={(product.images && product.images[0]) || product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">{product.name}</p>
                          <p className="mt-1 text-sm text-white/65">₹{product.price} • Stock {product.stock} • {product.discountPercentage || 0}% OFF</p>
                          <p className="mt-1 text-xs text-white/45">{(product.sizes || []).join(', ') || 'No sizes'} • {product.category}{product.subcategory ? ` • ${product.subcategory}` : ''}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProductId(product._id)
                              setProductForm({
                                name: product.name,
                                price: String(product.price),
                                stock: String(product.stock ?? 0),
                                discountPercentage: String(product.discountPercentage ?? 0),
                                groupId: product.groupId || '',
                                colorName: product.colorName || '',
                                colorHex: product.colorHex || '#000000',
                                sizesText: (product.sizes || []).join(', '),
                                category: product.category,
                                subcategory: product.subcategory || '',
                                description: product.description || '',
                                gallery: (product.images?.length ? product.images : product.image ? [product.image] : []).map((imageUrl, index) => ({
                                  id: `existing-${product._id}-${index}`,
                                  url: imageUrl,
                                  preview: imageUrl,
                                })),
                              })
                            }}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteProduct(product._id, product.name)} className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-red-500/40 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/10">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {productPagination.totalPages > 1 ? <div className="mt-5 flex flex-wrap gap-2">{Array.from({ length: productPagination.totalPages }).map((_, index) => <button key={index + 1} type="button" onClick={() => loadProducts(index + 1)} className={`rounded-full border px-4 py-2 text-sm transition ${productPage === index + 1 ? 'border-gold/60 bg-gold/20 text-white' : 'border-white/10 bg-white/5 text-white/70'}`}>{index + 1}</button>)}</div> : null}
            </section>
          </section>
        </>
      ) : null}

      {section === 'orders' ? (
        <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <div className="flex items-end justify-between gap-3"><div><p className="text-sm uppercase tracking-[0.24em] text-gold">Orders</p><h2 className="mt-1 font-heading text-3xl text-white">All orders</h2></div><span className="text-sm text-white/60">Page {orderPagination.page} of {orderPagination.totalPages}</span></div>
          <div className="mt-5 space-y-3">
            {orders.map((order) => (
               <div key={order._id} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback src={(order.product?.images && order.product.images[0]) || order.product?.image} alt={order.product?.name || 'Product'} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold text-white">{order.product?.name || 'Product removed'}</p>
                      <p className="mt-1 text-sm text-white/60">{order.customerName} • {order.email} • {order.phone}</p>
                      <p className="mt-1 text-xs text-white/45">{order.address || 'No address added'}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">Payment</p>
                      <p className="mt-1 text-sm font-semibold text-white">{order.paymentMethod.toUpperCase()}</p>
                    </div>
                    <label className="block text-xs text-white/45">
                      Payment Status
                      <select value={order.paymentStatus} onChange={(event) => handleOrderUpdate(order._id, { paymentStatus: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f10] px-3 py-2 text-sm text-white outline-none">
                        {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs text-white/45">
                      Order Status
                      <select value={order.orderStatus} onChange={(event) => handleOrderUpdate(order._id, { orderStatus: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f0f10] px-3 py-2 text-sm text-white outline-none">
                        {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/admin/orders/${order._id}`} className="text-sm font-semibold text-gold">View details</Link>
                    {['delivered', 'cancelled'].includes(order.orderStatus) ? (
                      <button type="button" onClick={() => handleDeleteOrder(order._id)} className="text-sm font-semibold text-red-400">Delete order</button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {orderPagination.totalPages > 1 ? <div className="mt-5 flex flex-wrap gap-2">{Array.from({ length: orderPagination.totalPages }).map((_, index) => <button key={index + 1} type="button" onClick={() => loadOrders(index + 1)} className={`rounded-full border px-4 py-2 text-sm transition ${orderPage === index + 1 ? 'border-gold/60 bg-gold/20 text-white' : 'border-white/10 bg-white/5 text-white/70'}`}>{index + 1}</button>)}</div> : null}
        </section>
      ) : null}

      {section === 'banners' ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Banner form</p>
            <h2 className="mt-2 font-heading text-3xl text-white">{editingBannerId ? 'Edit Banner' : 'Add Banner'}</h2>
            <form onSubmit={submitBanner} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Title</span><input required name="title" value={bannerForm.title} onChange={handleBannerChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Subtitle</span><input name="subtitle" value={bannerForm.subtitle} onChange={handleBannerChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Banner Image</span><input type="file" accept="image/*" onChange={handleBannerFiles} className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" /><p className="text-xs text-white/45">Upload banner image like product upload, or keep existing image while editing.</p></label>
              {bannerForm.image ? <div className="sm:col-span-2"><ImageWithFallback src={bannerForm.image} alt="Banner preview" className="h-28 w-full rounded-2xl object-cover" /></div> : null}
              <label className="space-y-2"><span className="text-sm font-medium">CTA Label</span><input name="ctaLabel" value={bannerForm.ctaLabel} onChange={handleBannerChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">CTA Link</span><input name="ctaLink" value={bannerForm.ctaLink} onChange={handleBannerChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
              <label className="space-y-2"><span className="text-sm font-medium">Order</span><input type="number" name="order" value={bannerForm.order} onChange={handleBannerChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
              <label className="flex items-center gap-3 pt-8 text-sm text-white/80"><input type="checkbox" name="isActive" checked={bannerForm.isActive} onChange={handleBannerChange} /> Active banner</label>
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button type="submit" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e5c17f]">{editingBannerId ? 'Update Banner' : 'Add Banner'}</button>
                {editingBannerId ? <button type="button" onClick={() => { setEditingBannerId(null); setBannerForm(bannerInitialState) }} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/5">Cancel</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
            <div className="flex items-end justify-between gap-3"><div><p className="text-sm uppercase tracking-[0.24em] text-gold">Homepage banners</p><h2 className="mt-1 font-heading text-3xl text-white">Banner manager</h2></div><span className="text-sm text-white/60">{banners.length} banners</span></div>
            <div className="mt-5 space-y-3">{banners.map((banner) => <div key={banner._id} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-3 sm:p-4"><ImageWithFallback src={banner.image} alt={banner.title} className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{banner.title}</p><p className="mt-1 text-sm text-white/65">Order {banner.order} • {banner.isActive ? 'Active' : 'Hidden'}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingBannerId(banner._id); setBannerForm({ title: banner.title, subtitle: banner.subtitle || '', image: banner.image, ctaLabel: banner.ctaLabel || 'Shop Now', ctaLink: banner.ctaLink || '#products', order: banner.order || 0, isActive: banner.isActive }) }} className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/5">Edit</button><button type="button" onClick={() => handleDeleteBanner(banner._id, banner.title)} className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-red-500/40 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/10">Delete</button></div></div>)}</div>
          </section>
        </section>
      ) : null}
    </div>
  )
}

export default AdminPage
