'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditProduct() {
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('')
  const [stock, setStock] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (params?.id) {
      loadProduct()
    }
  }, [params?.id])

  async function loadProduct() {
    setLoading(true)
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

    if (
      profileError ||
      !profile ||
      profile.role !== 'farmer'
    ) {
      router.replace('/')
      return
    }

    const { data: productData, error: productError } =
      await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('farmer_id', user.id)
        .single()

    if (productError || !productData) {
      setError(
        'Product not found or you do not have permission to edit it.'
      )
      setLoading(false)
      return
    }

    const { data: categoryData, error: categoryError } =
      await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (categoryError) {
      console.log('CATEGORY ERROR:', categoryError)
    }

    setProduct(productData)
    setCategories(categoryData || [])

    setName(productData.name || '')
    setCategoryId(productData.category_id || '')
    setDescription(productData.description || '')
    setPrice(productData.price ?? '')
    setUnit(productData.unit || '')
    setStock(productData.stock_quantity ?? '')

    setLoading(false)
  }

  const commission = useMemo(() => {
    return Number(product?.commission_amount || 0)
  }, [product])

  const customerPrice = useMemo(() => {
    return Number(price || 0) + commission
  }, [price, commission])

  async function handleUpdate(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    const trimmedName = name.trim()
    const trimmedUnit = unit.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      setError('Please enter product name.')
      return
    }

    if (!categoryId) {
      setError('Please select a category.')
      return
    }

    if (!price || Number(price) < 0) {
      setError('Please enter a valid price.')
      return
    }

    if (!trimmedUnit) {
      setError('Please enter the product unit.')
      return
    }

    if (stock === '' || Number(stock) < 0) {
      setError('Please enter a valid stock quantity.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: trimmedName,
        category_id: categoryId,
        description: trimmedDescription,
        price: Number(price),
        unit: trimmedUnit,
        stock_quantity: Number(stock),
      })
      .eq('id', params.id)
      .eq('farmer_id', user.id)

    if (updateError) {
      console.log('UPDATE ERROR:', updateError)

      setError(
        'Unable to update product. Please try again.'
      )

      setSaving(false)
      return
    }

    setSuccess('Product updated successfully!')

    setTimeout(() => {
      router.push('/farmer/products')
    }, 800)
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

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>🌾</div>
          <p>Loading product...</p>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>⚠️</div>

          <p style={styles.notFoundText}>
            {error || 'Product not found.'}
          </p>

          <button
            onClick={() =>
              router.push('/farmer/products')
            }
            style={styles.backToProductsButton}
          >
            ← My Products
          </button>
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

        <button
          onClick={() =>
            router.push('/farmer/products')
          }
          style={styles.backButton}
        >
          ← My Products
        </button>
      </nav>

      <section style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Edit Product
            </h1>

            <p style={styles.subtitle}>
              Update your product details and stock.
            </p>
          </div>

          <div
            style={getApprovalStyle(
              product.approval_status
            )}
          >
            {getApprovalLabel(
              product.approval_status
            )}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div style={styles.successBox}>
            ✓ {success}
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          style={styles.form}
        >
          {/* PRODUCT IMAGE */}
          {product.image_url ? (
            <div style={styles.imageSection}>
              <img
                src={product.image_url}
                alt={product.name}
                style={styles.productImage}
              />
            </div>
          ) : (
            <div style={styles.noImage}>
              🌱
            </div>
          )}

          {/* PRODUCT NAME */}
          <label style={styles.label}>
            Product Name *
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            style={styles.input}
            placeholder="Enter product name"
          />

          {/* CATEGORY */}
          <label style={styles.label}>
            Category *
          </label>

          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value)
            }
            style={styles.input}
          >
            <option value="">
              Select category
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.icon
                  ? `${category.icon} `
                  : ''}
                {category.name}
              </option>
            ))}
          </select>

          {/* DESCRIPTION */}
          <label style={styles.label}>
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={styles.textarea}
            placeholder="Describe your product"
          />

          {/* PRICE + UNIT */}
          <div style={styles.twoColumn}>
            <div>
              <label style={styles.label}>
                Farmer Price *
              </label>

              <div style={styles.inputWithPrefix}>
                <span style={styles.prefix}>₹</span>

                <input
                  type="number"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  style={styles.priceInput}
                  placeholder="60"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>
                Unit *
              </label>

              <input
                type="text"
                value={unit}
                onChange={(e) =>
                  setUnit(e.target.value)
                }
                style={styles.input}
                placeholder="kg"
              />
            </div>
          </div>

          {/* STOCK */}
          <label style={styles.label}>
            Stock Quantity *
          </label>

          <input
            type="number"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            style={styles.input}
            placeholder="50"
            min="0"
            step="0.01"
          />

          {/* PRICE SUMMARY */}
          <div style={styles.priceSummary}>
            <h3 style={styles.summaryTitle}>
              Price Summary
            </h3>

            <div style={styles.summaryRow}>
              <span>Farmer Price</span>

              <strong>
                ₹
                {Number(price || 0).toLocaleString(
                  'en-IN'
                )}
                {unit ? ` / ${unit}` : ''}
              </strong>
            </div>

            <div style={styles.summaryRow}>
              <span>Platform Commission</span>

              <strong>
                ₹
                {commission.toLocaleString(
                  'en-IN'
                )}
              </strong>
            </div>

            <div style={styles.summaryDivider} />

            <div style={styles.customerPriceRow}>
              <span>Customer Price</span>

              <strong>
                ₹
                {customerPrice.toLocaleString(
                  'en-IN'
                )}
                {unit ? ` / ${unit}` : ''}
              </strong>
            </div>
          </div>

          {/* PRODUCT STATUS */}
          <div style={styles.statusSection}>
            <div>
              <span style={styles.statusLabel}>
                Product Status
              </span>

              <strong style={styles.statusValue}>
                {product.status === 'active'
                  ? '🟢 Active'
                  : '🔴 Inactive'}
              </strong>
            </div>

            <div>
              <span style={styles.statusLabel}>
                Approval Status
              </span>

              <strong>
                {getApprovalLabel(
                  product.approval_status
                )}
              </strong>
            </div>
          </div>

          {/* INFO */}
          <div style={styles.infoBox}>
            ℹ️ <span>
              Commission and approval status are
              managed by the platform admin.
            </span>
          </div>

          {/* BUTTONS */}
          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() =>
                router.push('/farmer/products')
              }
              style={styles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? 'Saving...'
                : '✓ Save Changes'}
            </button>
          </div>
        </form>
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

  notFoundText: {
    color: '#6b7280',
    marginBottom: '20px',
  },

  backToProductsButton: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
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
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 0',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '25px',
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

  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '13px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
  },

  successBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '13px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
  },

  form: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '30px',
  },

  imageSection: {
    marginBottom: '20px',
  },

  productImage: {
    width: '100%',
    height: '260px',
    objectFit: 'cover',
    borderRadius: '10px',
    display: 'block',
  },

  noImage: {
    height: '180px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0fdf4',
    borderRadius: '10px',
    fontSize: '55px',
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    marginTop: '18px',
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    background: '#ffffff',
    boxSizing: 'border-box',
    outline: 'none',
  },

  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'Arial, sans-serif',
  },

  twoColumn: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '15px',
  },

  inputWithPrefix: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
  },

  prefix: {
    paddingLeft: '12px',
    color: '#6b7280',
    fontWeight: '600',
  },

  priceInput: {
    width: '100%',
    padding: '12px 10px',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
  },

  priceSummary: {
    marginTop: '25px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px',
  },

  summaryTitle: {
    margin: '0 0 15px',
    fontSize: '16px',
    color: '#1f2937',
  },

  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '9px',
  },

  summaryDivider: {
    borderTop: '1px solid #e5e7eb',
    margin: '12px 0',
  },

  customerPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    color: '#166534',
    fontSize: '16px',
  },

  statusSection: {
    marginTop: '20px',
    padding: '15px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
  },

  statusLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '5px',
  },

  statusValue: {
    color: '#1f2937',
  },

  infoBox: {
    marginTop: '18px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    padding: '12px 14px',
    borderRadius: '9px',
    fontSize: '13px',
    lineHeight: '1.5',
  },

  approvedBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '6px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  pendingBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '6px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  rejectedBadge: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '6px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  neutralBadge: {
    background: '#f3f4f6',
    color: '#4b5563',
    padding: '6px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '30px',
    flexWrap: 'wrap',
  },

  cancelButton: {
    padding: '12px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#374151',
  },

  saveButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },
}