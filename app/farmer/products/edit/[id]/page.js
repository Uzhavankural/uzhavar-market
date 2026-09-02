'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    loadProduct()
  }, [])

  async function loadProduct() {
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

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('farmer_id', user.id)
      .single()

    if (productError || !productData) {
      alert('Product not found or you do not have permission to edit it.')
      router.replace('/farmer/products')
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
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
    setPrice(productData.price || '')
    setUnit(productData.unit || '')
    setStock(productData.stock_quantity || '')

    setLoading(false)
  }

  async function handleUpdate(e) {
    e.preventDefault()

    if (!name || !categoryId || !price || !unit || stock === '') {
      alert('Please fill all required fields.')
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

    const { error } = await supabase
      .from('products')
      .update({
        name: name,
        category_id: categoryId,
        description: description,
        price: Number(price),
        unit: unit,
        stock_quantity: Number(stock),
      })
      .eq('id', params.id)
      .eq('farmer_id', user.id)

    if (error) {
      console.log('UPDATE ERROR:', error)
      alert('Unable to update product.')
      setSaving(false)
      return
    }

    alert('Product updated successfully!')
    router.push('/farmer/products')
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <p>Loading product...</p>
      </main>
    )
  }

  if (!product) {
    return null
  }

  return (
    <main style={styles.page}>
      <nav style={styles.navbar}>
        <div style={styles.logo}>🌾 Uzhavar Market</div>

        <button
          onClick={() => router.push('/farmer/products')}
          style={styles.backButton}
        >
          ← My Products
        </button>
      </nav>

      <section style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Edit Product</h1>
          <p style={styles.subtitle}>
            Update your product details.
          </p>
        </div>

        <form onSubmit={handleUpdate} style={styles.form}>
          <label style={styles.label}>Product Name *</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="Enter product name"
          />

          <label style={styles.label}>Category *</label>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={styles.input}
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <label style={styles.label}>Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
            placeholder="Describe your product"
          />

          <label style={styles.label}>Price *</label>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={styles.input}
            placeholder="Example: 60"
            min="0"
          />

          <label style={styles.label}>Unit *</label>

          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={styles.input}
            placeholder="Example: kg"
          />

          <label style={styles.label}>Stock Quantity *</label>

          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            style={styles.input}
            placeholder="Example: 50"
            min="0"
          />

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => router.push('/farmer/products')}
              style={styles.cancelButton}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={styles.saveButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
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

  navbar: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '18px 6%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },

  container: {
    width: '90%',
    maxWidth: '800px',
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

  form: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '30px',
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
  },

  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'vertical',
  },

  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '30px',
  },

  cancelButton: {
    padding: '12px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
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