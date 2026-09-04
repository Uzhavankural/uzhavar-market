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
    const active = products.filter(
      (product) => product.status === 'active'
    ).length

    const inactive = products.filter(
      (product) => product.status !== 'active'
    ).length

    const pending = products.filter(
      (product) => product.approval_status === 'pending'
    ).length

    const rejected = products.filter(
      (product) => product.approval_status === 'rejected'
    ).length

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
    if (status === 'active') return styles.approvedBadge
    if (status === 'rejected') return styles.rejectedBadge
    if (status === 'pending') return styles.pendingBadge
    return styles.neutralBadge
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
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>🌾</div>
          <p>Loading your products...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <nav style={styles.navbar}>
        <div style={styles.logo}>🌾 Uzhavar Market</div>

        <button
          onClick={() => router.push('/farmer')}
          style={styles.backButton}
        >
          ← Dashboard
        </button>
      </nav>

      <section style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Products</h1>

            <p style={styles.subtitle}>
              Manage the products you have added.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={() => loadProducts(true)}
              disabled={refreshing}
              style={styles.refreshButton}
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>

            <button
              onClick={() => router.push('/farmer/add-product')}
              style={styles.addButton}
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* SUMMARY */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>📦</div>
            <div>
              <div style={styles.summaryNumber}>{stats.total}</div>
              <div style={styles.summaryLabel}>Total Products</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>🟢</div>
            <div>
              <div style={styles.summaryNumber}>{stats.active}</div>
              <div style={styles.summaryLabel}>Active</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>⏳</div>
            <div>
              <div style={styles.summaryNumber}>{stats.pending}</div>
              <div style={styles.summaryLabel}>Pending Approval</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>🔴</div>
            <div>
              <div style={styles.summaryNumber}>{stats.inactive}</div>
              <div style={styles.summaryLabel}>Inactive</div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        {products.length > 0 && (
          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.filterRow}>
              <button
                onClick={() => setFilter('all')}
                style={
                  filter === 'all'
                    ? styles.filterActive
                    : styles.filterButton
                }
              >
                All ({stats.total})
              </button>

              <button
                onClick={() => setFilter('active')}
                style={
                  filter === 'active'
                    ? styles.filterActive
                    : styles.filterButton
                }
              >
                Active ({stats.active})
              </button>

              <button
                onClick={() => setFilter('inactive')}
                style={
                  filter === 'inactive'
                    ? styles.filterActive
                    : styles.filterButton
                }
              >
                Inactive ({stats.inactive})
              </button>

              <button
                onClick={() => setFilter('pending')}
                style={
                  filter === 'pending'
                    ? styles.filterActive
                    : styles.filterButton
                }
              >
                Pending ({stats.pending})
              </button>

              <button
                onClick={() => setFilter('rejected')}
                style={
                  filter === 'rejected'
                    ? styles.filterActive
                    : styles.filterButton
                }
              >
                Rejected ({stats.rejected})
              </button>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {products.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📦</div>

            <h2 style={styles.emptyTitle}>No products yet</h2>

            <p style={styles.emptyText}>
              You haven't added any products yet.
            </p>

            <button
              onClick={() => router.push('/farmer/add-product')}
              style={styles.addButton}
            >
              Add Your First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🔍</div>

            <h2 style={styles.emptyTitle}>
              No matching products
            </h2>

            <p style={styles.emptyText}>
              Search or filter change panni try pannunga.
            </p>

            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
              style={styles.resetButton}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div style={styles.resultText}>
              Showing {filteredProducts.length} of {products.length}{' '}
              products
            </div>

            {/* PRODUCTS */}
            <div style={styles.grid}>
              {filteredProducts.map((product) => {
                const commission = Number(
                  product.commission_amount || 0
                )

                const farmerPrice = Number(product.price || 0)

                const customerPrice = getCustomerPrice(product)

                const stock = Number(
                  product.stock_quantity || 0
                )

                return (
                  <div
                    key={product.id}
                    style={styles.card}
                  >
                    {/* IMAGE */}
                    {product.image_url ? (
                      <div style={styles.imageWrapper}>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={styles.image}
                        />

                        <div style={styles.imageStatus}>
                          {getStatusLabel(product.status)}
                        </div>
                      </div>
                    ) : (
                      <div style={styles.noImage}>
                        <span>🌱</span>

                        <div style={styles.noImageStatus}>
                          {getStatusLabel(product.status)}
                        </div>
                      </div>
                    )}

                    <div style={styles.cardContent}>
                      {/* NAME */}
                      <div style={styles.nameRow}>
                        <h2 style={styles.productName}>
                          {product.name}
                        </h2>

                        <span
                          style={getApprovalStyle(
                            product.approval_status
                          )}
                        >
                          {getApprovalLabel(
                            product.approval_status
                          )}
                        </span>
                      </div>

                      {/* DESCRIPTION */}
                      <p style={styles.description}>
                        {product.description ||
                          'No description available'}
                      </p>

                      {/* PRICE DETAILS */}
                      <div style={styles.priceSection}>
                        <div style={styles.priceRow}>
                          <span>Farmer Price</span>
                          <strong>
                            ₹{farmerPrice.toLocaleString('en-IN')}
                            {product.unit
                              ? ` / ${product.unit}`
                              : ''}
                          </strong>
                        </div>

                        <div style={styles.priceRow}>
                          <span>Commission</span>
                          <span>
                            ₹{commission.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.customerPriceRow}>
                          <span>Customer Price</span>
                          <strong>
                            ₹
                            {customerPrice.toLocaleString(
                              'en-IN'
                            )}
                            {product.unit
                              ? ` / ${product.unit}`
                              : ''}
                          </strong>
                        </div>
                      </div>

                      {/* STOCK */}
                      <div style={styles.stockBox}>
                        <div>
                          <span style={styles.stockLabel}>
                            Stock
                          </span>

                          <strong style={styles.stockValue}>
                            {stock} {product.unit || ''}
                          </strong>
                        </div>

                        <div
                          style={
                            stock > 0
                              ? styles.stockAvailable
                              : styles.stockEmpty
                          }
                        >
                          {stock > 0
                            ? 'In Stock'
                            : 'Out of Stock'}
                        </div>
                      </div>

                      {/* APPROVAL */}
                      <div style={styles.approvalInfo}>
                        <span>Approval Status</span>

                        <strong>
                          {getApprovalLabel(
                            product.approval_status
                          )}
                        </strong>
                      </div>

                      {/* EDIT */}
                      <button
                        onClick={() =>
                          router.push(
                            `/farmer/products/edit/${product.id}`
                          )
                        }
                        style={styles.editButton}
                      >
                        ✏️ Edit Product
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

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7f8f5',
    fontFamily: 'Arial, sans-serif',
  },

  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f7f8f5',
    fontFamily: 'Arial, sans-serif',
  },

  loadingCard: {
    background: '#ffffff',
    padding: '35px 50px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
    color: '#374151',
  },

  loadingIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },

  navbar: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '18px 6%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
  },

  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#166534',
  },

  backButton: {
    padding: '9px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#374151',
  },

  container: {
    width: '90%',
    maxWidth: '1250px',
    margin: '0 auto',
    padding: '40px 0',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '20px',
    flexWrap: 'wrap',
  },

  title: {
    margin: '0 0 8px',
    fontSize: '32px',
    color: '#1f2937',
  },

  subtitle: {
    margin: 0,
    color: '#6b7280',
  },

  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  addButton: {
    padding: '11px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },

  refreshButton: {
    padding: '11px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
  },

  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '13px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },

  summaryCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  summaryIcon: {
    width: '45px',
    height: '45px',
    borderRadius: '10px',
    background: '#f0fdf4',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '22px',
  },

  summaryNumber: {
    fontSize: '23px',
    fontWeight: '700',
    color: '#1f2937',
  },

  summaryLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '3px',
  },

  controls: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '25px',
  },

  searchBox: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '9px',
    padding: '0 12px',
    background: '#ffffff',
    marginBottom: '15px',
  },

  searchIcon: {
    fontSize: '16px',
  },

  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: '11px',
    fontSize: '15px',
  },

  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },

  filterButton: {
    padding: '8px 13px',
    border: '1px solid #d1d5db',
    borderRadius: '20px',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },

  filterActive: {
    padding: '8px 13px',
    border: '1px solid #166534',
    borderRadius: '20px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },

  resultText: {
    marginBottom: '15px',
    color: '#6b7280',
    fontSize: '14px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    overflow: 'hidden',
  },

  imageWrapper: {
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    display: 'block',
  },

  imageStatus: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#ffffff',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },

  noImage: {
    height: '220px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0fdf4',
    fontSize: '50px',
    position: 'relative',
  },

  noImageStatus: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#ffffff',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },

  cardContent: {
    padding: '20px',
  },

  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },

  productName: {
    margin: '0 0 10px',
    fontSize: '21px',
    color: '#1f2937',
  },

  description: {
    margin: '0 0 18px',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
    minHeight: '42px',
  },

  approvedBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  pendingBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  rejectedBadge: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  neutralBadge: {
    background: '#f3f4f6',
    color: '#4b5563',
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  priceSection: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '13px',
  },

  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  },

  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '9px 0',
  },

  customerPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    color: '#166534',
    fontSize: '14px',
  },

  stockBox: {
    marginTop: '12px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },

  stockLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '3px',
  },

  stockValue: {
    fontSize: '15px',
    color: '#1f2937',
  },

  stockAvailable: {
    background: '#dcfce7',
    color: '#166534',
    padding: '5px 8px',
    borderRadius: '15px',
    fontSize: '11px',
    fontWeight: '700',
  },

  stockEmpty: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '5px 8px',
    borderRadius: '15px',
    fontSize: '11px',
    fontWeight: '700',
  },

  approvalInfo: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6b7280',
  },

  editButton: {
    width: '100%',
    marginTop: '15px',
    padding: '11px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },

  emptyCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '60px 30px',
    textAlign: 'center',
  },

  emptyIcon: {
    fontSize: '50px',
  },

  emptyTitle: {
    color: '#1f2937',
    marginBottom: '8px',
  },

  emptyText: {
    color: '#6b7280',
    marginBottom: '20px',
  },

  resetButton: {
    padding: '10px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
  },
}