'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function FarmerDashboard() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    async function checkFarmer() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // User login pannala
      if (!user) {
        router.replace('/login')
        return
      }

      // Profile-la role check
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        console.log('PROFILE ERROR:', error)
        setLoading(false)
        return
      }
      console.log('FARMER USER:', user.email)
console.log('FARMER ROLE:', data.role)

      // Farmer illa
      if (data.role !== 'farmer') {
        router.replace('/')
        return
      }

      setProfile(data)

      // Farmer-oda own products count
      const { count, error: productError } = await supabase
        .from('products')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('farmer_id', user.id)

      if (productError) {
        console.log('PRODUCT COUNT ERROR:', productError)
      } else {
        setProductCount(count || 0)
      }

      setLoading(false)
    }

    checkFarmer()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <p style={styles.loadingText}>
          Loading dashboard...
        </p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main style={styles.loadingPage}>
        <p style={styles.loadingText}>
          Unable to load your farmer profile.
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
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </button>

      </nav>

      <section style={styles.container}>

        <div style={styles.welcomeCard}>

          <p style={styles.smallTitle}>
            FARMER DASHBOARD
          </p>

          <h1 style={styles.title}>
            Welcome, {profile.full_name}! 👨‍🌾
          </h1>

          <p style={styles.subtitle}>
            Manage your farm products and sales from here.
          </p>

        </div>

        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📦</div>
            <h3 style={styles.statNumber}>
              {productCount}
            </h3>
            <p style={styles.statLabel}>
              Products
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>🛒</div>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>
              Orders
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <h3 style={styles.statNumber}>₹0</h3>
            <p style={styles.statLabel}>
              Sales
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>
              Rating
            </p>
          </div>

        </div>

        <h2 style={styles.sectionTitle}>
          Quick Actions
        </h2>

        <div style={styles.actionGrid}>

          {/* Add Product */}
          <button
            onClick={() => router.push('/farmer/add-product')}
            style={styles.actionCard}
          >
            <span style={styles.actionIcon}>➕</span>

            <strong>Add Product</strong>

            <span style={styles.actionText}>
              Add a new farm product
            </span>
          </button>

          {/* My Products */}
          <button
            onClick={() => router.push('/farmer/products')}
            style={styles.actionCard}
          >
            <span style={styles.actionIcon}>📦</span>

            <strong>My Products</strong>

            <span style={styles.actionText}>
              Manage your products
            </span>
          </button>

          {/* Orders */}
          <button
            onClick={() => router.push('/farmer/orders')}
            style={styles.actionCard}
          >
            <span style={styles.actionIcon}>🛒</span>

            <strong>Orders</strong>

            <span style={styles.actionText}>
              View customer orders
            </span>
          </button>

          {/* My Profile */}
          <button
            onClick={() => router.push('/farmer/profile')}
            style={styles.actionCard}
          >
            <span style={styles.actionIcon}>👤</span>

            <strong>My Profile</strong>

            <span style={styles.actionText}>
              Manage farm details
            </span>
          </button>

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

  logoutButton: {
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 0',
  },

  welcomeCard: {
    background: '#166534',
    color: '#ffffff',
    padding: '35px',
    borderRadius: '16px',
  },

  smallTitle: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1px',
    margin: '0 0 10px',
  },

  title: {
    fontSize: '32px',
    margin: '0 0 10px',
  },

  subtitle: {
    margin: 0,
    opacity: 0.9,
    fontSize: '16px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '20px',
    marginTop: '25px',
  },

  statCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '22px',
  },

  statIcon: {
    fontSize: '28px',
  },

  statNumber: {
    fontSize: '25px',
    margin: '12px 0 5px',
    color: '#1f2937',
  },

  statLabel: {
    margin: 0,
    color: '#6b7280',
  },

  sectionTitle: {
    marginTop: '40px',
    marginBottom: '20px',
    color: '#1f2937',
  },

  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '20px',
  },

  actionCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '25px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '16px',
  },

  actionIcon: {
    fontSize: '30px',
  },

  actionText: {
    fontSize: '14px',
    color: '#6b7280',
  },
}