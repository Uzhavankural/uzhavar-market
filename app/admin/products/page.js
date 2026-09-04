'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminProducts() {
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [farmers, setFarmers] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const [editingCommissionId, setEditingCommissionId] =
    useState(null)

  const [commissionValue, setCommissionValue] =
    useState('')

  const [savingCommission, setSavingCommission] =
    useState(false)

  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setMessage('')
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (
      profileError ||
      !profile ||
      profile.role !== 'admin'
    ) {
      router.replace('/')
      return
    }

    const {
      data: productData,
      error: productError,
    } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (productError) {
      console.log('PRODUCT ERROR:', productError)
      setError('Unable to load products.')
      setProducts([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    setProducts(productData || [])

    const farmerIds = [
      ...new Set(
        (productData || [])
          .map((product) => product.farmer_id)
          .filter(Boolean)
      ),
    ]

    if (farmerIds.length > 0) {
      const {
        data: farmerData,
        error: farmerError,
      } = await supabase
        .from('profiles')
        .select('id, full_name, farm_name, phone')
        .in('id', farmerIds)

      if (farmerError) {
        console.log('FARMER ERROR:', farmerError)
      }

      const farmerMap = {}

      ;(farmerData || []).forEach((farmer) => {
        farmerMap[farmer.id] = farmer
      })

      setFarmers(farmerMap)
    } else {
      setFarmers({})
    }

    setLoading(false)
    setRefreshing(false)
  }

  const stats = useMemo(() => {
    const total = products.length

    const active = products.filter(
      (product) => product.status === 'active'
    ).length

    const pending = products.filter(
      (product) =>
        product.approval_status === 'pending'
    ).length

    const rejected = products.filter(
      (product) =>
        product.approval_status === 'rejected'
    ).length

    const inactive = products.filter(
      (product) => product.status !== 'active'
    ).length

    return {
      total,
      active,
      pending,
      rejected,
      inactive,
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return products.filter((product) => {
      const farmer = farmers[product.farmer_id]

      const matchesSearch =
        !keyword ||
        product.name
          ?.toLowerCase()
          .includes(keyword) ||
        product.description
          ?.toLowerCase()
          .includes(keyword) ||
        farmer?.full_name
          ?.toLowerCase()
          .includes(keyword) ||
        farmer?.farm_name
          ?.toLowerCase()
          .includes(keyword)

      let matchesFilter = true

      if (filter === 'active') {
        matchesFilter = product.status === 'active'
      }

      if (filter === 'inactive') {
        matchesFilter = product.status !== 'active'
      }

      if (filter === 'pending') {
        matchesFilter =
          product.approval_status === 'pending'
      }

      if (filter === 'approved') {
        matchesFilter =
          product.approval_status === 'active'
      }

      if (filter === 'rejected') {
        matchesFilter =
          product.approval_status === 'rejected'
      }

      return matchesSearch && matchesFilter
    })
  }, [products, farmers, search, filter])

  function getFarmer(product) {
    return farmers[product.farmer_id] || null
  }

  function getCustomerPrice(product) {
    const farmerPrice = Number(product.price || 0)
    const commission = Number(
      product.commission_amount || 0
    )

    return farmerPrice + commission
  }

  function getApprovalLabel(status) {
    if (status === 'active') return '✓ Approved'
    if (status === 'pending') return '⏳ Pending'
    if (status === 'rejected') return '✕ Rejected'

    return '— Not Set'
  }

  function getApprovalStyle(status) {
    if (status === 'active') {
      return styles.approvedBadge
    }

    if (status === 'pending') {
      return styles.pendingBadge
    }

    if (status === 'rejected') {
      return styles.rejectedBadge
    }

    return styles.neutralBadge
  }

  function startCommissionEdit(product) {
    setEditingCommissionId(product.id)

    setCommissionValue(
      product.commission_amount ?? 0
    )

    setMessage('')
    setError('')
  }

  function cancelCommissionEdit() {
    setEditingCommissionId(null)
    setCommissionValue('')
  }

  async function saveCommission(product) {
    const value = Number(commissionValue)

    if (
      commissionValue === '' ||
      Number.isNaN(value) ||
      value < 0
    ) {
      setError(
        'Please enter a valid commission amount.'
      )
      return
    }

    setSavingCommission(true)
    setError('')
    setMessage('')

    const { error: updateError } =
      await supabase
        .from('products')
        .update({
          commission_amount: value,
        })
        .eq('id', product.id)

    if (updateError) {
      console.log(
        'COMMISSION UPDATE ERROR:',
        updateError
      )

      setError(
        'Unable to update commission amount.'
      )

      setSavingCommission(false)
      return
    }

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id
          ? {
              ...item,
              commission_amount: value,
            }
          : item
      )
    )

    setEditingCommissionId(null)
    setCommissionValue('')
    setSavingCommission(false)

    setMessage(
      `Commission updated for ${product.name}.`
    )
  }

  async function updateApproval(product, status) {
    let confirmationMessage = ''

    if (status === 'active') {
      confirmationMessage =
        `Approve "${product.name}"?`
    }

    if (status === 'rejected') {
      confirmationMessage =
        `Reject "${product.name}"?`
    }

    if (
      !window.confirm(confirmationMessage)
    ) {
      return
    }

    setUpdatingId(product.id)
    setError('')
    setMessage('')

    const updateData = {
      approval_status: status,
      status:
        status === 'active'
          ? 'active'
          : 'inactive',
    }

    const { error: updateError } =
      await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

    if (updateError) {
      console.log(
        'APPROVAL UPDATE ERROR:',
        updateError
      )

      setError(
        'Unable to update product approval.'
      )

      setUpdatingId(null)
      return
    }

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id
          ? {
              ...item,
              ...updateData,
            }
          : item
      )
    )

    setUpdatingId(null)

    setMessage(
      status === 'active'
        ? `${product.name} approved successfully.`
        : `${product.name} rejected.`
    )
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(product.id)
    setError('')
    setMessage('')

    // Check whether this product has been ordered
    const {
      data: orderItems,
      error: orderCheckError,
    } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', product.id)
      .limit(1)

    if (orderCheckError) {
      console.log(
        'ORDER CHECK ERROR:',
        orderCheckError
      )

      setError(
        'Unable to check product orders.'
      )

      setDeletingId(null)
      return
    }

    if (
      orderItems &&
      orderItems.length > 0
    ) {
      setError(
        'This product cannot be deleted because it has existing orders. You can make it inactive instead.'
      )

      setDeletingId(null)
      return
    }

    const { error: deleteError } =
      await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

    if (deleteError) {
      console.log(
        'DELETE ERROR:',
        deleteError
      )

      setError(
        'Unable to delete product.'
      )

      setDeletingId(null)
      return
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (item) => item.id !== product.id
      )
    )

    setDeletingId(null)

    setMessage(
      `${product.name} deleted successfully.`
    )
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            🌾
          </div>

          <p>Loading products...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <div style={styles.navActions}>
          <button
            onClick={() =>
              loadProducts(true)
            }
            disabled={refreshing}
            style={styles.refreshButton}
          >
            {refreshing
              ? 'Refreshing...'
              : '↻ Refresh'}
          </button>

          <button
            onClick={() =>
              router.push('/admin')
            }
            style={styles.backButton}
          >
            ← Admin Dashboard
          </button>
        </div>
      </nav>

      <section style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Product Management
            </h1>

            <p style={styles.subtitle}>
              Manage farmer products, pricing,
              commission and approvals.
            </p>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={styles.successBox}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* SUMMARY */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              📦
            </div>

            <div>
              <div style={styles.summaryNumber}>
                {stats.total}
              </div>

              <div style={styles.summaryLabel}>
                Total Products
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🟢
            </div>

            <div>
              <div style={styles.summaryNumber}>
                {stats.active}
              </div>

              <div style={styles.summaryLabel}>
                Active
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              ⏳
            </div>

            <div>
              <div style={styles.summaryNumber}>
                {stats.pending}
              </div>

              <div style={styles.summaryLabel}>
                Pending Approval
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🔴
            </div>

            <div>
              <div style={styles.summaryNumber}>
                {stats.rejected}
              </div>

              <div style={styles.summaryLabel}>
                Rejected
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div style={styles.controls}>
          <div style={styles.searchBox}>
            <span>🔍</span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search product or farmer..."
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
              onClick={() => setFilter('approved')}
              style={
                filter === 'approved'
                  ? styles.filterActive
                  : styles.filterButton
              }
            >
              Approved
            </button>

            <button
              onClick={() => setFilter('rejected')}
              style={
                filter === 'rejected'
                  ? styles.filterActive
                  : styles.filterButton
              }
            >
              Rejected
            </button>

            <button
              onClick={() => setFilter('inactive')}
              style={
                filter === 'inactive'
                  ? styles.filterActive
                  : styles.filterButton
              }
            >
              Inactive
            </button>
          </div>
        </div>

        {/* RESULT */}
        <div style={styles.resultText}>
          Showing {filteredProducts.length} of{' '}
          {products.length} products
        </div>

        {/* PRODUCTS */}
        {filteredProducts.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📦
            </div>

            <h2>No products found</h2>

            <p>
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProducts.map((product) => {
              const farmer = getFarmer(product)

              const farmerPrice = Number(
                product.price || 0
              )

              const commission = Number(
                product.commission_amount || 0
              )

              const customerPrice =
                getCustomerPrice(product)

              const stock = Number(
                product.stock_quantity || 0
              )

              const isEditingCommission =
                editingCommissionId ===
                product.id

              return (
                <div
                  key={product.id}
                  style={styles.card}
                >
                  {/* IMAGE */}
                  {product.image_url ? (
                    <div
                      style={styles.imageWrapper}
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={styles.image}
                      />

                      <div
                        style={
                          getApprovalStyle(
                            product.approval_status
                          )
                        }
                      >
                        {getApprovalLabel(
                          product.approval_status
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={styles.noImage}>
                      <span>🌱</span>

                      <div
                        style={
                          getApprovalStyle(
                            product.approval_status
                          )
                        }
                      >
                        {getApprovalLabel(
                          product.approval_status
                        )}
                      </div>
                    </div>
                  )}

                  <div style={styles.cardContent}>
                    {/* PRODUCT NAME */}
                    <h2
                      style={styles.productName}
                    >
                      {product.name}
                    </h2>

                    <p
                      style={styles.description}
                    >
                      {product.description ||
                        'No description'}
                    </p>

                    {/* FARMER */}
                    <div style={styles.farmerBox}>
                      <div
                        style={
                          styles.farmerTitle
                        }
                      >
                        👨‍🌾 Farmer
                      </div>

                      <strong>
                        {farmer?.full_name ||
                          'Unknown Farmer'}
                      </strong>

                      {farmer?.farm_name && (
                        <span>
                          {farmer.farm_name}
                        </span>
                      )}

                      {farmer?.phone && (
                        <span>
                          📞 {farmer.phone}
                        </span>
                      )}
                    </div>

                    {/* PRICING */}
                    <div
                      style={styles.priceSection}
                    >
                      <div
                        style={
                          styles.priceRow
                        }
                      >
                        <span>
                          Farmer Price
                        </span>

                        <strong>
                          ₹
                          {farmerPrice.toLocaleString(
                            'en-IN'
                          )}
                          {product.unit
                            ? ` / ${product.unit}`
                            : ''}
                        </strong>
                      </div>

                      {/* COMMISSION */}
                      <div
                        style={
                          styles.commissionRow
                        }
                      >
                        <span>
                          Commission
                        </span>

                        {isEditingCommission ? (
                          <div
                            style={
                              styles.commissionEdit
                            }
                          >
                            <div
                              style={
                                styles.commissionInputWrapper
                              }
                            >
                              <span>
                                ₹
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  commissionValue
                                }
                                onChange={(e) =>
                                  setCommissionValue(
                                    e.target.value
                                  )
                                }
                                style={
                                  styles.commissionInput
                                }
                                autoFocus
                              />
                            </div>

                            <button
                              onClick={() =>
                                saveCommission(
                                  product
                                )
                              }
                              disabled={
                                savingCommission
                              }
                              style={
                                styles.smallSaveButton
                              }
                            >
                              {savingCommission
                                ? '...'
                                : 'Save'}
                            </button>

                            <button
                              onClick={
                                cancelCommissionEdit
                              }
                              disabled={
                                savingCommission
                              }
                              style={
                                styles.smallCancelButton
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div
                            style={
                              styles.commissionDisplay
                            }
                          >
                            <strong>
                              ₹
                              {commission.toLocaleString(
                                'en-IN'
                              )}
                            </strong>

                            <button
                              onClick={() =>
                                startCommissionEdit(
                                  product
                                )
                              }
                              style={
                                styles.editCommissionButton
                              }
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        style={styles.divider}
                      />

                      {/* CUSTOMER PRICE */}
                      <div
                        style={
                          styles.customerPriceRow
                        }
                      >
                        <span>
                          Customer Price
                        </span>

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
                      <span>Stock</span>

                      <strong>
                        {stock}{' '}
                        {product.unit || ''}
                      </strong>

                      <span
                        style={
                          stock > 0
                            ? styles.stockAvailable
                            : styles.stockEmpty
                        }
                      >
                        {stock > 0
                          ? 'In Stock'
                          : 'Out of Stock'}
                      </span>
                    </div>

                    {/* STATUS */}
                    <div style={styles.statusBox}>
                      <div>
                        <span
                          style={
                            styles.statusLabel
                          }
                        >
                          Product Status
                        </span>

                        <strong>
                          {product.status ===
                          'active'
                            ? '🟢 Active'
                            : '🔴 Inactive'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.statusLabel
                          }
                        >
                          Approval
                        </span>

                        <strong>
                          {getApprovalLabel(
                            product.approval_status
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* APPROVAL BUTTONS */}
                    {product.approval_status ===
                      'pending' && (
                      <div
                        style={
                          styles.approvalButtons
                        }
                      >
                        <button
                          onClick={() =>
                            updateApproval(
                              product,
                              'active'
                            )
                          }
                          disabled={
                            updatingId ===
                            product.id
                          }
                          style={
                            styles.approveButton
                          }
                        >
                          {updatingId ===
                          product.id
                            ? 'Updating...'
                            : '✓ Approve'}
                        </button>

                        <button
                          onClick={() =>
                            updateApproval(
                              product,
                              'rejected'
                            )
                          }
                          disabled={
                            updatingId ===
                            product.id
                          }
                          style={
                            styles.rejectButton
                          }
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}

                    {/* REACTIVATE APPROVED PRODUCT */}
                    {product.approval_status ===
                      'active' &&
                      product.status !==
                        'active' && (
                        <button
                          onClick={() =>
                            updateApproval(
                              product,
                              'active'
                            )
                          }
                          disabled={
                            updatingId ===
                            product.id
                          }
                          style={
                            styles.activateButton
                          }
                        >
                          🟢 Activate Product
                        </button>
                      )}

                    {/* DELETE */}
                    <button
                      onClick={() =>
                        deleteProduct(product)
                      }
                      disabled={
                        deletingId === product.id
                      }
                      style={
                        styles.deleteButton
                      }
                    >
                      {deletingId === product.id
                        ? 'Deleting...'
                        : '🗑️ Delete Product'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
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
    padding: '40px 60px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
    color: '#374151',
  },

  loadingIcon: {
    fontSize: '42px',
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
    flexWrap: 'wrap',
  },

  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#166534',
  },

  navActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  refreshButton: {
    padding: '9px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
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
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '40px 0',
  },

  header: {
    marginBottom: '25px',
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

  successBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '13px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
  },

  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '13px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
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
    marginBottom: '15px',
  },

  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '9px',
    padding: '0 12px',
    marginBottom: '15px',
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
      'repeat(auto-fit, minmax(320px, 1fr))',
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

  imageWrapper: {
    position: 'relative',
  },

  noImage: {
    height: '220px',
    background: '#f0fdf4',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '55px',
    position: 'relative',
  },

  approvedBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  pendingBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  rejectedBadge: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  neutralBadge: {
    background: '#f3f4f6',
    color: '#4b5563',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  cardContent: {
    padding: '20px',
  },

  productName: {
    margin: '0 0 8px',
    fontSize: '21px',
    color: '#1f2937',
  },

  description: {
    margin: '0 0 15px',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
    minHeight: '40px',
  },

  farmerBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '13px',
    color: '#374151',
    marginBottom: '14px',
  },

  farmerTitle: {
    color: '#166534',
    fontWeight: '700',
    marginBottom: '3px',
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
    marginBottom: '10px',
  },

  commissionRow: {
    fontSize: '13px',
    color: '#6b7280',
  },

  commissionDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  editCommissionButton: {
    border: 'none',
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '5px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
  },

  commissionEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  commissionInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#ffffff',
    paddingLeft: '7px',
  },

  commissionInput: {
    width: '70px',
    border: 'none',
    outline: 'none',
    padding: '7px 5px',
    fontSize: '13px',
  },

  smallSaveButton: {
    border: 'none',
    background: '#166534',
    color: '#ffffff',
    padding: '7px 9px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
  },

  smallCancelButton: {
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    padding: '6px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
  },

  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '10px 0',
  },

  customerPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    color: '#166534',
    fontSize: '15px',
  },

  stockBox: {
    marginTop: '12px',
    padding: '11px',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },

  stockAvailable: {
    marginLeft: 'auto',
    background: '#dcfce7',
    color: '#166534',
    padding: '5px 8px',
    borderRadius: '15px',
    fontSize: '10px',
    fontWeight: '700',
  },

  stockEmpty: {
    marginLeft: 'auto',
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '5px 8px',
    borderRadius: '15px',
    fontSize: '10px',
    fontWeight: '700',
  },

  statusBox: {
    marginTop: '12px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    fontSize: '13px',
  },

  statusLabel: {
    display: 'block',
    color: '#6b7280',
    fontSize: '11px',
    marginBottom: '4px',
  },

  approvalButtons: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    marginTop: '15px',
  },

  approveButton: {
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },

  rejectButton: {
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    background: '#dc2626',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },

  activateButton: {
    width: '100%',
    marginTop: '15px',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },

  deleteButton: {
    width: '100%',
    marginTop: '10px',
    padding: '9px',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    background: '#fffafa',
    color: '#b91c1c',
    cursor: 'pointer',
    fontWeight: '600',
  },

  emptyCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '60px 30px',
    textAlign: 'center',
    color: '#6b7280',
  },

  emptyIcon: {
    fontSize: '50px',
    marginBottom: '10px',
  },
}