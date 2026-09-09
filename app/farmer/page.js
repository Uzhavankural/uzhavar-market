'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function FarmerDashboard() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [productCount, setProductCount] = useState(0)
  const [completedOrderCount, setCompletedOrderCount] = useState(0)

  // =====================================================
  // CHECK FARMER
  // =====================================================

  useEffect(() => {
    async function checkFarmer() {
      try {
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

        // =================================================
        // FARMER ILLA
        // =================================================

        if (data.role !== 'farmer') {
          setProfile(data)
          setAccessDenied(true)
          setLoading(false)
          return
        }

        setProfile(data)

        // =================================================
        // FARMER OWN PRODUCTS COUNT
        // =================================================

        const {
          count: productsCount,
          error: productError,
        } = await supabase
          .from('products')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('farmer_id', user.id)

        if (productError) {
          console.log('PRODUCT COUNT ERROR:', productError)
        } else {
          setProductCount(productsCount || 0)
        }

        // =================================================
        // COMPLETED ORDERS COUNT
        // =================================================

        const {
          data: orderItems,
          error: orderItemsError,
        } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('farmer_id', user.id)

        if (orderItemsError) {
          console.log(
            'FARMER ORDER ITEMS ERROR:',
            orderItemsError
          )
        } else if (orderItems && orderItems.length > 0) {
          const orderIds = [
            ...new Set(
              orderItems.map(
                (item) => item.order_id
              )
            ),
          ]

          const {
            data: completedOrders,
            error: completedOrdersError,
          } = await supabase
            .from('orders')
            .select('id')
            .in('id', orderIds)
            .eq('order_status', 'delivered')

          if (completedOrdersError) {
            console.log(
              'COMPLETED ORDERS ERROR:',
              completedOrdersError
            )
          } else {
            setCompletedOrderCount(
              completedOrders?.length || 0
            )
          }
        } else {
          setCompletedOrderCount(0)
        }

        // Dashboard ready
        setLoading(false)

      } catch (error) {
        console.log(
          'FARMER DASHBOARD ERROR:',
          error
        )

        setLoading(false)
      }
    }

    checkFarmer()
  }, [router])

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <p style={styles.loadingText}>
          Loading dashboard...
        </p>
      </main>
    )
  }

  // =====================================================
  // ACCESS DENIED
  // =====================================================

  if (accessDenied) {
    const dashboardPath =
      profile?.role === 'admin'
        ? '/admin'
        : '/customer'

    const dashboardText =
      profile?.role === 'admin'
        ? 'Go to Admin Dashboard'
        : 'Go to Customer Dashboard'

    return (
      <main style={styles.loadingPage}>
        <div
          style={{
            textAlign: 'center',
            maxWidth: '500px',
            padding: '30px',
          }}
        >
          <div
            style={{
              fontSize: '50px',
              marginBottom: '15px',
            }}
          >
            🚫
          </div>

          <h2
            style={{
              margin: '0 0 10px',
              color: '#1f2937',
            }}
          >
            You don't have access to the Farmer Panel.
          </h2>

          <p
            style={{
              margin: '0 0 25px',
              color: '#6b7280',
              fontSize: '15px',
            }}
          >
            This panel is available only for farmer users.
          </p>

          <button
            onClick={() =>
              router.push(dashboardPath)
            }
            style={{
              padding: '11px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#166534',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {dashboardText}
          </button>
        </div>
      </main>
    )
  }

  // =====================================================
  // PROFILE ERROR
  // =====================================================

  if (!profile) {
    return (
      <main style={styles.loadingPage}>
        <p style={styles.loadingText}>
          Unable to load your farmer profile.
        </p>
      </main>
    )
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <main style={styles.page}>

      {/* =================================================
          NAVBAR
      ================================================= */}

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

        {/* =================================================
            WELCOME
        ================================================= */}

        <div style={styles.welcomeCard}>

          <p style={styles.smallTitle}>
            FARMER DASHBOARD
          </p>

          <h1 style={styles.title}>
            Welcome, {profile.full_name}! 👨‍🌾
          </h1>

          <p style={styles.subtitle}>
            Manage your farm products, orders and earnings from here.
          </p>

        </div>

        {/* =================================================
            MAIN STATS
        ================================================= */}

        <div style={styles.statsGrid}>

          {/* PRODUCTS */}

          <div style={styles.statCard}>

            <div style={styles.statIcon}>
              📦
            </div>

            <h3 style={styles.statNumber}>
              {productCount}
            </h3>

            <p style={styles.statLabel}>
              Products
            </p>

          </div>

          {/* COMPLETED ORDERS */}

          <div style={styles.statCard}>

            <div style={styles.statIcon}>
              🛒
            </div>

            <h3 style={styles.statNumber}>
              {completedOrderCount}
            </h3>

            <p style={styles.statLabel}>
              Completed Orders
            </p>

          </div>

          {/* MY ORDERS */}

          <div
            style={{
              ...styles.statCard,
              cursor: 'pointer',
            }}
            onClick={() =>
              router.push('/farmer/orders')
            }
          >

            <div style={styles.statIcon}>
              📋
            </div>

            <h3
              style={{
                ...styles.statNumber,
                color: '#166534',
              }}
            >
              View
            </h3>

            <p style={styles.statLabel}>
              My Orders →
            </p>

          </div>

        </div>

        {/* =================================================
            FARMER EARNINGS & SETTLEMENTS
        ================================================= */}

        <h2 style={styles.sectionTitle}>
          Earnings & Settlements
        </h2>

        <button
          onClick={() =>
            router.push('/farmer/earnings')
          }
          style={styles.earningsNavigationCard}
        >

          <div style={styles.earningsNavigationLeft}>

            <div style={styles.earningsNavigationIcon}>
              💰
            </div>

            <div>

              <h3 style={styles.earningsNavigationTitle}>
                My Earnings & Settlements
              </h3>

              <p style={styles.earningsNavigationText}>
                View completed orders, farmer earnings,
                platform commission and settlement status.
              </p>

            </div>

          </div>

          <div style={styles.earningsArrow}>
            View Details →
          </div>

        </button>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <h2 style={styles.sectionTitle}>
          Quick Actions
        </h2>

        <div style={styles.actionGrid}>

          {/* =================================================
              ADD PRODUCT
          ================================================= */}

          <button
            onClick={() =>
              router.push('/farmer/add-product')
            }
            style={styles.actionCard}
          >

            <span style={styles.actionIcon}>
              ➕
            </span>

            <strong>
              Add Product
            </strong>

            <span style={styles.actionText}>
              Add a new farm product
            </span>

          </button>

          {/* =================================================
              MY PRODUCTS
          ================================================= */}

          <button
            onClick={() =>
              router.push('/farmer/products')
            }
            style={styles.actionCard}
          >

            <span style={styles.actionIcon}>
              📦
            </span>

            <strong>
              My Products
            </strong>

            <span style={styles.actionText}>
              Manage your products
            </span>

          </button>

          {/* =================================================
              ORDERS
          ================================================= */}

          <button
            onClick={() =>
              router.push('/farmer/orders')
            }
            style={styles.actionCard}
          >

            <span style={styles.actionIcon}>
              🛒
            </span>

            <strong>
              Orders
            </strong>

            <span style={styles.actionText}>
              View customer orders
            </span>

          </button>

          {/* =================================================
              EARNINGS
          ================================================= */}

          <button
            onClick={() =>
              router.push('/farmer/earnings')
            }
            style={styles.actionCard}
          >

            <span style={styles.actionIcon}>
              💰
            </span>

            <strong>
              Earnings & Settlements
            </strong>

            <span style={styles.actionText}>
              View completed orders and settlements
            </span>

          </button>

          {/* =================================================
              PROFILE
          ================================================= */}

          <button
            onClick={() =>
              router.push('/farmer/profile')
            }
            style={styles.actionCard}
          >

            <span style={styles.actionIcon}>
              👤
            </span>

            <strong>
              My Profile
            </strong>

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

  // =====================================================
  // PAGE
  // =====================================================

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

  // =====================================================
  // NAVBAR
  // =====================================================

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

  // =====================================================
  // CONTAINER
  // =====================================================

  container: {
    width: '90%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 0',
  },

  // =====================================================
  // WELCOME
  // =====================================================

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

  // =====================================================
  // MAIN STATS
  // =====================================================

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
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

  // =====================================================
  // SECTION TITLE
  // =====================================================

  sectionTitle: {
    marginTop: '40px',
    marginBottom: '20px',
    color: '#1f2937',
  },

  // =====================================================
  // EARNINGS NAVIGATION CARD
  // =====================================================

  earningsNavigationCard: {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #dfe8df',
    borderRadius: '14px',
    padding: '22px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'left',
    boxSizing: 'border-box',
  },

  earningsNavigationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },

  earningsNavigationIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: '#f0f7ef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '25px',
    flexShrink: 0,
  },

  earningsNavigationTitle: {
    margin: '0 0 5px',
    fontSize: '19px',
    color: '#166534',
  },

  earningsNavigationText: {
    margin: 0,
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.5',
  },

  earningsArrow: {
    color: '#166534',
    fontWeight: '700',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  actionGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
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