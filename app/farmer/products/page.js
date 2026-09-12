'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function MyProducts() {
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'farmer') {
      router.replace('/')
      return
    }

    const { data, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false })

    if (productError) {
      console.log('PRODUCT ERROR:', productError)
      setError('Products load panna mudiyala. Please try again.')
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  const stats = useMemo(() => {
    const active = products.filter((product) => product.status === 'active').length
    const inactive = products.filter((product) => product.status !== 'active').length
    const pending = products.filter((product) => product.approval_status === 'pending').length
    const rejected = products.filter((product) => product.approval_status === 'rejected').length

    return {
      total: products.length,
      active,
      inactive,
      pending,
      rejected,
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword)

      let matchesFilter = true

      if (filter === 'active') {
        matchesFilter = product.status === 'active'
      }

      if (filter === 'inactive') {
        matchesFilter = product.status !== 'active'
      }

      if (filter === 'pending') {
        matchesFilter = product.approval_status === 'pending'
      }

      if (filter === 'rejected') {
        matchesFilter = product.approval_status === 'rejected'
      }

      return matchesSearch && matchesFilter
    })
  }, [products, search, filter])

  function getApprovalLabel(status) {
    if (status === 'active') return '✓ Approved'
    if (status === 'rejected') return '✕ Rejected'
    if (status === 'pending') return '⏳ Pending'
    return '— Not Set'
  }

  function getApprovalStyle(status) {
    if (status === 'active') return 'bg-green-100 text-green-800'
    if (status === 'rejected') return 'bg-red-100 text-red-800'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status) {
    return status === 'active' ? '🟢 Active' : '🔴 Inactive'
  }

  function getCustomerPrice(product) {
    const farmerPrice = Number(product.price || 0)
    const commission = Number(product.commission_amount || 0)

    return farmerPrice + commission
  }

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <div className="bg-white p-9 sm:p-12 rounded-2xl border border-gray-200 text-center text-gray-700">
          <div className="text-[40px] mb-2.5">🌾</div>
          <p className="m-0 text-base">Loading your products...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center gap-4 flex-wrap">
        <div className="text-xl sm:text-[22px] font-bold text-green-800">🌾 Uzhavar Market</div>
        <button
          onClick={() => router.push('/farmer')}
          className="px-4 py-2 sm:px-[18px] sm:py-[9px] border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          ← Dashboard
        </button>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-[1250px] mx-auto pt-[30px] sm:pt-[40px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-[30px] gap-4 sm:gap-5 flex-wrap">
          <div>
            <h1 className="m-0 mb-2 text-2xl sm:text-[32px] text-gray-800 font-bold">My Products</h1>
            <p className="m-0 text-gray-500 text-sm sm:text-base">Manage the products you have added.</p>
          </div>
          <div className="flex gap-2.5 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => loadProducts(true)}
              disabled={refreshing}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-[18px] sm:py-[11px] border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold text-sm sm:text-base cursor-pointer hover:bg-gray-50 transition-colors ${
                refreshing ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
            <button
              onClick={() => router.push('/farmer/add-product')}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:px-[18px] sm:py-[11px] border-none rounded-lg bg-green-800 text-white font-semibold text-sm sm:text-base cursor-pointer hover:bg-green-700 transition-colors"
            >
              + Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 sm:px-[16px] sm:py-[13px] rounded-xl mb-5 text-sm sm:text-base">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[15px] mb-6 sm:mb-[25px]">
          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-[18px] flex items-center gap-3 sm:gap-[14px]">
            <div className="w-10 h-10 sm:w-[45px] sm:h-[45px] rounded-lg bg-green-50 flex justify-center items-center text-xl sm:text-[22px] flex-shrink-0">📦</div>
            <div>
              <div className="text-xl sm:text-[23px] font-bold text-gray-800 leading-tight">{stats.total}</div>
              <div className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5 sm:mt-1">Total Products</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-[18px] flex items-center gap-3 sm:gap-[14px]">
            <div className="w-10 h-10 sm:w-[45px] sm:h-[45px] rounded-lg bg-green-50 flex justify-center items-center text-xl sm:text-[22px] flex-shrink-0">🟢</div>
            <div>
              <div className="text-xl sm:text-[23px] font-bold text-gray-800 leading-tight">{stats.active}</div>
              <div className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5 sm:mt-1">Active</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-[18px] flex items-center gap-3 sm:gap-[14px]">
            <div className="w-10 h-10 sm:w-[45px] sm:h-[45px] rounded-lg bg-green-50 flex justify-center items-center text-xl sm:text-[22px] flex-shrink-0">⏳</div>
            <div>
              <div className="text-xl sm:text-[23px] font-bold text-gray-800 leading-tight">{stats.pending}</div>
              <div className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5 sm:mt-1">Pending Approval</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-[18px] flex items-center gap-3 sm:gap-[14px]">
            <div className="w-10 h-10 sm:w-[45px] sm:h-[45px] rounded-lg bg-green-50 flex justify-center items-center text-xl sm:text-[22px] flex-shrink-0">🔴</div>
            <div>
              <div className="text-xl sm:text-[23px] font-bold text-gray-800 leading-tight">{stats.inactive}</div>
              <div className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5 sm:mt-1">Inactive</div>
            </div>
          </div>
        </div>

        {products.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-[18px] mb-6 sm:mb-[25px]">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 mb-4 bg-white transition-colors focus-within:bg-gray-50 focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">
              <span className="text-base">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-none outline-none py-2.5 px-2.5 text-[15px] bg-transparent"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 sm:px-[13px] sm:py-[8px] border rounded-full text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                  filter === 'all'
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 sm:px-[13px] sm:py-[8px] border rounded-full text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                  filter === 'active'
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-3 py-1.5 sm:px-[13px] sm:py-[8px] border rounded-full text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                  filter === 'inactive'
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                Inactive ({stats.inactive})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 sm:px-[13px] sm:py-[8px] border rounded-full text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                  filter === 'pending'
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-1.5 sm:px-[13px] sm:py-[8px] border rounded-full text-xs sm:text-[13px] font-semibold cursor-pointer transition-colors ${
                  filter === 'rejected'
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-[40px_20px] sm:p-[60px_20px] text-center mt-[30px]">
            <div className="text-[50px] mb-[15px]">📦</div>
            <h2 className="m-0 mb-2.5 text-xl sm:text-[24px] text-gray-800 font-bold">No products yet</h2>
            <p className="m-0 mb-5 text-gray-500 text-[15px]">You haven't added any products yet.</p>
            <button
              onClick={() => router.push('/farmer/add-product')}
              className="px-[20px] py-[12px] border-none rounded-lg bg-green-800 text-white font-bold cursor-pointer hover:bg-green-700 transition-colors"
            >
              Add Your First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-[40px_20px] sm:p-[60px_20px] text-center mt-[30px]">
            <div className="text-[50px] mb-[15px]">🔍</div>
            <h2 className="m-0 mb-2.5 text-xl sm:text-[24px] text-gray-800 font-bold">No matching products</h2>
            <p className="m-0 mb-5 text-gray-500 text-[15px]">Search or filter change panni try pannunga.</p>
            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
              className="px-[20px] py-[12px] border border-gray-300 rounded-lg bg-white text-gray-700 font-bold cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 sm:mb-[15px] text-gray-500 text-sm">
              Showing {filteredProducts.length} of {products.length} products
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
              {filteredProducts.map((product) => {
                const commission = Number(product.commission_amount || 0)
                const farmerPrice = Number(product.price || 0)
                const customerPrice = getCustomerPrice(product)
                const stock = Number(product.stock_quantity || 0)

                return (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    {product.image_url ? (
                      <div className="relative">
                        <img src={product.image_url} alt={product.name} className="w-full h-32 sm:h-[220px] object-cover block" />
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-bold shadow-md">
                          {getStatusLabel(product.status)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 sm:h-[220px] flex justify-center items-center bg-green-50 text-4xl sm:text-[50px] relative">
                        <span>🌱</span>
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-bold shadow-md">
                          {getStatusLabel(product.status)}
                        </div>
                      </div>
                    )}

                    <div className="p-2 sm:p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <h2 className="m-0 text-sm sm:text-[20px] text-gray-800 font-bold line-clamp-2 leading-tight">{product.name}</h2>
                      </div>

                      <div className="hidden sm:block mb-4 text-[13px] text-gray-500 line-clamp-2 flex-1">
                        {product.description || 'No description available'}
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-4">
                        <div className="hidden sm:flex justify-between text-[13px] text-gray-600 mb-1.5">
                          <span>Farmer Price</span>
                          <strong className="text-gray-800">₹{farmerPrice.toLocaleString('en-IN')}{product.unit ? ` / ${product.unit_count || 1} ${product.unit}` : ''}</strong>
                        </div>
                        <div className="hidden sm:flex justify-between text-[13px] text-gray-600 mb-1.5">
                          <span>Commission</span>
                          <span className="text-gray-800">₹{commission.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="hidden sm:flex justify-between text-[13px] text-gray-600 mb-3">
                          <span>Delivery</span>
                          <span className="text-gray-800">₹{Number(product.delivery_price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="hidden sm:block border-t border-gray-200 my-2" />
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-[11px] sm:text-[14px]">
                          <span className="text-gray-700 font-semibold hidden sm:inline">Price</span>
                          <strong className="text-green-800 text-[13px] sm:text-[15px]">₹{customerPrice.toLocaleString('en-IN')}{product.unit ? ` / ${product.unit_count || 1} ${product.unit}` : ''}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-2 sm:mb-4 text-[10px] sm:text-[13px]">
                        <div>
                          <strong className="text-gray-800">{stock} available</strong>
                        </div>
                        <div className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded font-bold text-[9px] sm:text-[11px] ${stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {stock > 0 ? 'In Stock' : 'Out'}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 p-1.5 sm:p-2.5 rounded text-[10px] sm:text-[12px] mb-2 sm:mb-4">
                        <strong className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold whitespace-nowrap self-start sm:self-auto ${getApprovalStyle(product.approval_status)}`}>
                          {getApprovalLabel(product.approval_status)}
                        </strong>
                      </div>

                      <button
                        onClick={() => router.push(`/farmer/products/edit/${product.id}`)}
                        className="w-full py-1.5 sm:py-2.5 border border-gray-300 rounded-md sm:rounded-lg bg-white text-gray-700 font-bold cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors mt-auto text-[11px] sm:text-[14px]"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>
    </main>
  )
}