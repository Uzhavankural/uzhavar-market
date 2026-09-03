'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProductDetails() {
  const params = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [farmer, setFarmer] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [])

  async function loadProduct() {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('status', 'active')
      .single()

    if (productError || !productData) {
      console.log('PRODUCT ERROR:', productError)
      setLoading(false)
      return
    }

    const { data: farmerData } = await supabase
      .from('profiles')
      .select('full_name, farm_name, district, village, bio')
      .eq('id', productData.farmer_id)
      .single()

    const { data: categoryData } = await supabase
      .from('categories')
      .select('name, icon')
      .eq('id', productData.category_id)
      .single()

    setProduct(productData)
    setFarmer(farmerData)
    setCategory(categoryData)
    setLoading(false)
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <p>Loading product...</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.notFound}>
          <h2>Product not found</h2>
          <button
            onClick={() => router.push('/')}
            style={styles.backButton}
          >
            ← Back to Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <nav style={styles.navbar}>
        <div style={styles.logo}>🌾 Uzhavar Market</div>

        <button
          onClick={() => router.push('/')}
          style={styles.backButton}
        >
          ← Back to Products
        </button>
      </nav>

      <section style={styles.container}>
        <div style={styles.productSection}>
          <div style={styles.imageBox}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={styles.image}
              />
            ) : (
              <div style={styles.noImage}>🌱</div>
            )}
          </div>

          <div style={styles.details}>
            {category && (
              <div style={styles.category}>
                {category.icon} {category.name}
              </div>
            )}

            <h1 style={styles.title}>{product.name}</h1>

            <p style={styles.description}>
              {product.description || 'No description available.'}
            </p>

            <div style={styles.price}>
              ₹{(
  Number(product.price) +
  Number(product.commission_amount || 0)
).toFixed(2)}
              <span style={styles.unit}> / {product.unit}</span>
            </div>

            <div style={styles.stock}>
              🟢 {product.stock_quantity} {product.unit} available
            </div>

            <button
              onClick={() => alert('Cart feature coming next!')}
              style={styles.cartButton}
            >
              🛒 Add to Cart
            </button>

            <div style={styles.farmerCard}>
              <h2 style={styles.farmerTitle}>👨‍🌾 Farmer Details</h2>

              <p>
                <strong>Farmer:</strong>{' '}
                {farmer?.full_name || 'Farmer'}
              </p>

              {farmer?.farm_name && (
                <p>
                  <strong>Farm:</strong> {farmer.farm_name}
                </p>
              )}

              {farmer?.district && (
                <p>
                  <strong>District:</strong> {farmer.district}
                </p>
              )}

              {farmer?.village && (
                <p>
                  <strong>Village:</strong> {farmer.village}
                </p>
              )}

              {farmer?.bio && (
                <p>
                  <strong>About:</strong> {farmer.bio}
                </p>
              )}
            </div>
          </div>
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
    padding: '50px 0',
  },

  productSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '50px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '30px',
  },

  imageBox: {
    width: '100%',
    minHeight: '450px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#f0fdf4',
  },

  image: {
    width: '100%',
    height: '450px',
    objectFit: 'cover',
    display: 'block',
  },

  noImage: {
    width: '100%',
    height: '450px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '80px',
  },

  details: {
    padding: '10px 0',
  },

  category: {
    display: 'inline-block',
    padding: '7px 12px',
    background: '#f0fdf4',
    color: '#166534',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '15px',
  },

  title: {
    margin: '0 0 15px',
    fontSize: '36px',
    color: '#1f2937',
  },

  description: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#6b7280',
    marginBottom: '25px',
  },

  price: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#166534',
  },

  unit: {
    fontSize: '17px',
    fontWeight: '400',
    color: '#6b7280',
  },

  stock: {
    marginTop: '12px',
    color: '#166534',
    fontWeight: '600',
  },

  cartButton: {
    width: '100%',
    marginTop: '25px',
    padding: '14px',
    border: 'none',
    borderRadius: '9px',
    background: '#166534',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },

  farmerCard: {
    marginTop: '30px',
    padding: '20px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    lineHeight: '1.6',
    color: '#374151',
  },

  farmerTitle: {
    margin: '0 0 15px',
    fontSize: '20px',
    color: '#166534',
  },

  notFound: {
    textAlign: 'center',
  },
}