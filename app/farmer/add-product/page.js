'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AddProduct() {
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState('')
  const [image, setImage] = useState(null)

  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function checkFarmerAndLoadCategories() {
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

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoryError) {
        setMessage(categoryError.message)
      } else {
        setCategories(categoryData || [])
      }

      setLoading(false)
    }

    checkFarmerAndLoadCategories()
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()

    setMessage('')

    if (!name || !categoryId || !price || !unit || !stock) {
      setMessage('Please fill all required fields.')
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

    let imageUrl = null

    // Upload image if selected
    if (image) {
      const fileExtension = image.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image)

      if (uploadError) {
        setMessage(`Image upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      imageUrl = publicUrlData.publicUrl
    }

    // Save product
    const { error: productError } = await supabase
      .from('products')
      .insert({
        farmer_id: user.id,
        category_id: categoryId,
        name: name,
        description: description,
        price: Number(price),
        unit: unit,
        stock_quantity: Number(stock),
        image_url: imageUrl,
        status: 'active',
      })

    if (productError) {
      setMessage(`Product save failed: ${productError.message}`)
      setSaving(false)
      return
    }

    setMessage('Product added successfully!')

    setName('')
    setDescription('')
    setCategoryId('')
    setPrice('')
    setUnit('kg')
    setStock('')
    setImage(null)

    const fileInput = document.getElementById('product-image')

    if (fileInput) {
      fileInput.value = ''
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <p style={styles.loadingText}>
          Loading...
        </p>
      </main>
    )
  }

  return (
    <main style={styles.page}>

      <nav style={styles.navbar}>

        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <button
          onClick={() => router.push('/farmer')}
          style={styles.backButton}
        >
          ← Dashboard
        </button>

      </nav>

      <section style={styles.container}>

        <div style={styles.card}>

          <h1 style={styles.title}>
            Add New Product
          </h1>

          <p style={styles.subtitle}>
            Add your farm product for customers to purchase.
          </p>

          <form onSubmit={handleSubmit}>

            <label style={styles.label}>
              Product Name *
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Organic Tomato"
              style={styles.input}
              required
            />

            <label style={styles.label}>
              Category *
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={styles.input}
              required
            >
              <option value="">
                Select Category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.icon || '🌱'} {category.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your product..."
              rows="5"
              style={styles.textarea}
            />

            <label style={styles.label}>
              Price *
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Example: 80"
              min="0"
              step="0.01"
              style={styles.input}
              required
            />

            <label style={styles.label}>
              Unit *
            </label>

            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={styles.input}
              required
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram</option>
              <option value="litre">Litre</option>
              <option value="piece">Piece</option>
              <option value="packet">Packet</option>
              <option value="box">Box</option>
              <option value="bottle">Bottle</option>
            </select>

            <label style={styles.label}>
              Stock Quantity *
            </label>

            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Example: 100"
              min="0"
              step="0.01"
              style={styles.input}
              required
            />

            <label style={styles.label}>
              Product Image
            </label>

            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              style={styles.fileInput}
            />

            <button
              type="submit"
              disabled={saving}
              style={styles.button}
            >
              {saving ? 'Adding Product...' : 'Add Product'}
            </button>

          </form>

          {message && (
            <p style={styles.message}>
              {message}
            </p>
          )}

        </div>

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
  },

  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
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
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
  },

  container: {
    width: '90%',
    maxWidth: '700px',
    margin: '0 auto',
    padding: '40px 0',
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '35px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
  },

  title: {
    margin: '0 0 8px',
    color: '#1f2937',
    fontSize: '30px',
  },

  subtitle: {
    margin: '0 0 30px',
    color: '#6b7280',
  },

  label: {
    display: 'block',
    marginTop: '18px',
    marginBottom: '7px',
    fontSize: '14px',
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
  },

  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
  },

  fileInput: {
    width: '100%',
    padding: '10px 0',
    fontSize: '14px',
  },

  button: {
    width: '100%',
    padding: '14px',
    marginTop: '28px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  message: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#166534',
  },
}