'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function MyProducts() {
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
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

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('PRODUCT ERROR:', error)
      setLoading(false)
      return
    }

    setProducts(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <p>Loading your products...</p>
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
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Products</h1>

            <p style={styles.subtitle}>
              Manage the products you have added.
            </p>
          </div>

          <button
            onClick={() => router.push('/farmer/add-product')}
            style={styles.addButton}
          >
            + Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📦</div>

            <h2>No products yet</h2>

            <p>You haven't added any products yet.</p>

            <button
              onClick={() => router.push('/farmer/add-product')}
              style={styles.addButton}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {products.map((product) => (
              <div key={product.id} style={styles.card}>

                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.noImage}>🌱</div>
                )}

                <div style={styles.cardContent}>

                  <h2 style={styles.productName}>
                    {product.name}
                  </h2>

                  <p style={styles.description}>
                    {product.description || 'No description'}
                  </p>

                  <div style={styles.infoRow}>
                    <strong>₹{product.price}</strong>
                    <span>/ {product.unit}</span>
                  </div>

                  <div style={styles.stock}>
                    Stock: {product.stock_quantity} {product.unit}
                  </div>

                  <div style={styles.status}>
                    {product.status === 'active'
                      ? '🟢 Active'
                      : '🔴 Inactive'}
                  </div>

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
            ))}
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 0',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '20px',
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

  addButton: {
    padding: '11px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '25px',
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    display: 'block',
  },

  noImage: {
    height: '220px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0fdf4',
    fontSize: '50px',
  },

  cardContent: {
    padding: '20px',
  },

  productName: {
    margin: '0 0 10px',
    fontSize: '21px',
    color: '#1f2937',
  },

  description: {
    margin: '0 0 15px',
    color: '#6b7280',
    fontSize: '14px',
    minHeight: '40px',
  },

  infoRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '5px',
    fontSize: '18px',
    color: '#166534',
  },

  stock: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#374151',
  },

  status: {
    marginTop: '10px',
    fontSize: '14px',
    fontWeight: '600',
  },

  editButton: {
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
}