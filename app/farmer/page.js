'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function FarmerDashboard() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [productCount, setProductCount] = useState(0)

  // Earnings / settlement data
  const [settlements, setSettlements] = useState([])
  const [earningsLoading, setEarningsLoading] = useState(true)

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

      // Farmer earnings / settlements
      await loadFarmerSettlements(user.id)

      setLoading(false)
    }

    checkFarmer()
  }, [router])

  // =====================================================
  // LOAD FARMER EARNINGS / SETTLEMENTS
  // =====================================================

  async function loadFarmerSettlements(farmerId) {
    setEarningsLoading(true)

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        farmer_id,
        product_name,
        price,
        quantity,
        unit,
        item_total,
        commission_amount,
        farmer_price,
        settlement_status,
        settlement_amount,
        settlement_paid_at
      `)
      .eq('farmer_id', farmerId)
      .order('id', {
        ascending: false,
      })

    if (error) {
      console.log('FARMER SETTLEMENT ERROR:', error)
      setSettlements([])
      setEarningsLoading(false)
      return
    }

    const items = data || []

    if (items.length === 0) {
      setSettlements([])
      setEarningsLoading(false)
      return
    }

    // Get unique order IDs
    const orderIds = [
      ...new Set(
        items.map((item) => item.order_id)
      ),
    ]

    // Load order status/payment status
    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from('orders')
      .select(`
        id,
        order_status,
        payment_status,
        created_at
      `)
      .in('id', orderIds)

    if (ordersError) {
      console.log('FARMER ORDERS ERROR:', ordersError)

      setSettlements(items)
      setEarningsLoading(false)
      return
    }

    const orderMap = {}

    ;(orders || []).forEach((order) => {
      orderMap[order.id] = order
    })

    const finalData = items.map((item) => {
      const order = orderMap[item.order_id]

      const farmerPrice = Number(
        item.farmer_price || 0
      )

      const quantity = Number(
        item.quantity || 0
      )

      const calculatedFarmerAmount =
        farmerPrice * quantity

      const settlementAmount =
        Number(
          item.settlement_amount ??
            calculatedFarmerAmount
        )

      const itemTotal = Number(
        item.item_total || 0
      )

      const commission =
        Number(
          item.commission_amount ??
            Math.max(
              0,
              itemTotal -
                calculatedFarmerAmount
            )
        )

      return {
        ...item,

        order_status:
          order?.order_status || 'unknown',

        payment_status:
          order?.payment_status || 'unknown',

        order_created_at:
          order?.created_at || null,

        calculated_farmer_amount:
          calculatedFarmerAmount,

        calculated_commission:
          commission,

        final_settlement_amount:
          settlementAmount,
      }
    })

    setSettlements(finalData)
    setEarningsLoading(false)
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  function formatMoney(amount) {
    return Number(amount || 0).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )
  }

  // =====================================================
  // CALCULATIONS
  // =====================================================

  // Delivered items only
  const deliveredItems = settlements.filter(
    (item) =>
      item.order_status === 'delivered'
  )

  // Paid settlements
  const paidSettlements = settlements.filter(
    (item) =>
      item.settlement_status === 'paid'
  )

  // Pending settlement
  // Delivered + Payment Paid + Settlement not paid
  const pendingSettlements = settlements.filter(
    (item) =>
      item.settlement_status !== 'paid' &&
      item.order_status === 'delivered' &&
      item.payment_status === 'paid'
  )

  // Total earned / already settled
  const totalEarned = paidSettlements.reduce(
    (total, item) =>
      total +
      Number(
        item.final_settlement_amount || 0
      ),
    0
  )

  // Pending settlement amount
  const pendingAmount = pendingSettlements.reduce(
    (total, item) =>
      total +
      Number(
        item.calculated_farmer_amount || 0
      ),
    0
  )

  // Total farmer sales from delivered orders
  const totalFarmerSales = deliveredItems.reduce(
    (total, item) =>
      total +
      Number(
        item.calculated_farmer_amount || 0
      ),
    0
  )

  // Total commission from delivered orders
  const totalCommission = deliveredItems.reduce(
    (total, item) =>
      total +
      Number(
        item.calculated_commission || 0
      ),
    0
  )

  // Unique completed orders
  const completedOrderIds = new Set(
    deliveredItems.map(
      (item) => item.order_id
    )
  )

  // Unique paid orders
  const paidOrderIds = new Set(
    paidSettlements.map(
      (item) => item.order_id
    )
  )

  // Unique pending orders
  const pendingOrderIds = new Set(
    pendingSettlements.map(
      (item) => item.order_id
    )
  )

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

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              🛒
            </div>

            <h3 style={styles.statNumber}>
              {completedOrderIds.size}
            </h3>

            <p style={styles.statLabel}>
              Completed Orders
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              💰
            </div>

            <h3
              style={{
                ...styles.statNumber,
                color: '#166534',
              }}
            >
              ₹{formatMoney(totalEarned)}
            </h3>

            <p style={styles.statLabel}>
              Total Earned
            </p>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              ⏳
            </div>

            <h3
              style={{
                ...styles.statNumber,
                color: '#b7791f',
              }}
            >
              ₹{formatMoney(pendingAmount)}
            </h3>

            <p style={styles.statLabel}>
              Pending Settlement
            </p>
          </div>

        </div>

        {/* =================================================
            EARNINGS OVERVIEW
        ================================================= */}

        <h2 style={styles.sectionTitle}>
          Earnings Overview
        </h2>

        <div style={styles.earningsGrid}>

          {/* Total Earned */}

          <div style={styles.earningCard}>
            <div style={styles.earningIcon}>
              💰
            </div>

            <div>
              <p style={styles.earningLabel}>
                Total Earned
              </p>

              <h3
                style={{
                  ...styles.earningNumber,
                  color: '#166534',
                }}
              >
                ₹{formatMoney(totalEarned)}
              </h3>

              <p style={styles.earningSmall}>
                Successfully settled
              </p>
            </div>
          </div>

          {/* Pending */}

          <div style={styles.earningCard}>
            <div style={styles.earningIcon}>
              ⏳
            </div>

            <div>
              <p style={styles.earningLabel}>
                Pending Settlement
              </p>

              <h3
                style={{
                  ...styles.earningNumber,
                  color: '#b7791f',
                }}
              >
                ₹{formatMoney(pendingAmount)}
              </h3>

              <p style={styles.earningSmall}>
                Waiting for admin settlement
              </p>
            </div>
          </div>

          {/* Farmer Sales */}

          <div style={styles.earningCard}>
            <div style={styles.earningIcon}>
              🌾
            </div>

            <div>
              <p style={styles.earningLabel}>
                Farmer Sales
              </p>

              <h3 style={styles.earningNumber}>
                ₹{formatMoney(totalFarmerSales)}
              </h3>

              <p style={styles.earningSmall}>
                From delivered orders
              </p>
            </div>
          </div>

          {/* Commission */}

          <div style={styles.earningCard}>
            <div style={styles.earningIcon}>
              💼
            </div>

            <div>
              <p style={styles.earningLabel}>
                Platform Commission
              </p>

              <h3 style={styles.earningNumber}>
                ₹{formatMoney(totalCommission)}
              </h3>

              <p style={styles.earningSmall}>
                Commission on delivered sales
              </p>
            </div>
          </div>

        </div>

        {/* =================================================
            SETTLEMENT SUMMARY
        ================================================= */}

        <div style={styles.settlementSummary}>

          <div>
            <p style={styles.summaryLabel}>
              Settlement Status
            </p>

            <h3 style={styles.summaryTitle}>
              Your Earnings
            </h3>
          </div>

          <div style={styles.summaryStats}>

            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>
                {paidSettlements.length}
              </span>

              <span style={styles.summaryText}>
                Paid Items
              </span>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>
                {pendingSettlements.length}
              </span>

              <span style={styles.summaryText}>
                Pending Items
              </span>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>
                {paidOrderIds.size}
              </span>

              <span style={styles.summaryText}>
                Paid Orders
              </span>
            </div>

            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>
                {pendingOrderIds.size}
              </span>

              <span style={styles.summaryText}>
                Pending Orders
              </span>
            </div>

          </div>

        </div>

        {/* =================================================
            SETTLEMENT DETAILS
        ================================================= */}

        <div style={styles.settlementSection}>

          <div style={styles.sectionHeader}>

            <div>
              <h2 style={styles.sectionTitleSmall}>
                My Earnings & Settlements
              </h2>

              <p style={styles.sectionDescription}>
                Track your product sales, commission and settlement status.
              </p>
            </div>

            <button
              onClick={async () => {
                const {
                  data: { user },
                } = await supabase.auth.getUser()

                if (user) {
                  await loadFarmerSettlements(
                    user.id
                  )
                }
              }}
              style={styles.refreshButton}
            >
              🔄 Refresh
            </button>

          </div>

          {earningsLoading ? (
            <div style={styles.emptyBox}>
              <p>
                Loading earnings...
              </p>
            </div>
          ) : settlements.length === 0 ? (
            <div style={styles.emptyBox}>

              <div style={styles.emptyIcon}>
                🌱
              </div>

              <h3 style={styles.emptyTitle}>
                No sales yet
              </h3>

              <p style={styles.emptyText}>
                Your sales and settlement details will appear here after customers place orders.
              </p>

            </div>
          ) : (
            <div style={styles.settlementList}>

              {settlements.map((item) => {

                const isPaid =
                  item.settlement_status === 'paid'

                const isPending =
                  !isPaid &&
                  item.order_status === 'delivered' &&
                  item.payment_status === 'paid'

                return (
                  <div
                    key={item.id}
                    style={styles.settlementCard}
                  >

                    {/* ORDER INFO */}

                    <div style={styles.settlementTop}>

                      <div>
                        <p style={styles.orderId}>
                          Order #{item.order_id.slice(0, 8)}
                        </p>

                        {item.order_created_at && (
                          <p style={styles.orderDate}>
                            {new Date(
                              item.order_created_at
                            ).toLocaleDateString(
                              'en-IN'
                            )}
                          </p>
                        )}
                      </div>

                      <div style={styles.badges}>

                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(item.order_status === 'delivered'
                              ? styles.deliveredBadge
                              : styles.otherStatusBadge),
                          }}
                        >
                          {item.order_status}
                        </span>

                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(item.payment_status === 'paid'
                              ? styles.paidBadge
                              : styles.paymentBadge),
                          }}
                        >
                          Payment: {item.payment_status}
                        </span>

                      </div>

                    </div>

                    {/* PRODUCT */}

                    <div style={styles.productSection}>

                      <div style={styles.productInfo}>

                        <h3 style={styles.productName}>
                          🌾 {item.product_name}
                        </h3>

                        <p style={styles.quantityText}>
                          Quantity: {item.quantity} {item.unit}
                        </p>

                      </div>

                      <div style={styles.priceGrid}>

                        <div style={styles.priceItem}>
                          <span style={styles.priceLabel}>
                            Customer Price
                          </span>

                          <strong>
                            ₹{formatMoney(item.price)}
                          </strong>
                        </div>

                        <div style={styles.priceItem}>
                          <span style={styles.priceLabel}>
                            Farmer Price
                          </span>

                          <strong>
                            ₹{formatMoney(item.farmer_price)}
                          </strong>
                        </div>

                        <div style={styles.priceItem}>
                          <span style={styles.priceLabel}>
                            Commission
                          </span>

                          <strong>
                            ₹{formatMoney(
                              item.calculated_commission
                            )}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* SETTLEMENT */}

                    <div style={styles.settlementBottom}>

                      <div>
                        <p style={styles.settlementLabel}>
                          Farmer Settlement
                        </p>

                        <h3 style={styles.settlementAmount}>
                          ₹{formatMoney(
                            item.final_settlement_amount
                          )}
                        </h3>
                      </div>

                      <div style={styles.settlementStatus}>

                        {isPaid ? (
                          <>
                            <span
                              style={styles.completedBadge}
                            >
                              ✓ Settlement Completed
                            </span>

                            {item.settlement_paid_at && (
                              <span style={styles.paidAt}>
                                Paid on:{' '}
                                {new Date(
                                  item.settlement_paid_at
                                ).toLocaleString(
                                  'en-IN'
                                )}
                              </span>
                            )}
                          </>
                        ) : isPending ? (
                          <>
                            <span
                              style={styles.pendingBadge}
                            >
                              ⏳ Pending Settlement
                            </span>

                            <span style={styles.paidAt}>
                              Payment verified. Waiting for admin settlement.
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              style={styles.waitingBadge}
                            >
                              Waiting
                            </span>

                            <span style={styles.paidAt}>
                              Settlement will be available after delivery and payment verification.
                            </span>
                          </>
                        )}

                      </div>

                    </div>

                  </div>
                )
              })}

            </div>
          )}

        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <h2 style={styles.sectionTitle}>
          Quick Actions
        </h2>

        <div style={styles.actionGrid}>

          {/* Add Product */}

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

          {/* My Products */}

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

          {/* Orders */}

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

          {/* My Profile */}

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
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
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

  /* =====================================================
     EARNINGS
  ===================================================== */

  earningsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '20px',
  },

  earningCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },

  earningIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#f0f7ef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },

  earningLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
  },

  earningNumber: {
    margin: '7px 0 3px',
    fontSize: '22px',
    color: '#1f2937',
  },

  earningSmall: {
    margin: 0,
    fontSize: '11px',
    color: '#9ca3af',
  },

  /* =====================================================
     SETTLEMENT SUMMARY
  ===================================================== */

  settlementSummary: {
    marginTop: '20px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },

  summaryLabel: {
    margin: 0,
    color: '#6b7280',
    fontSize: '12px',
  },

  summaryTitle: {
    margin: '5px 0 0',
    fontSize: '20px',
  },

  summaryStats: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
  },

  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },

  summaryNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#166534',
  },

  summaryText: {
    fontSize: '11px',
    color: '#6b7280',
  },

  /* =====================================================
     SETTLEMENT SECTION
  ===================================================== */

  settlementSection: {
    marginTop: '25px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '22px',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },

  sectionTitleSmall: {
    margin: 0,
    color: '#1f2937',
    fontSize: '20px',
  },

  sectionDescription: {
    margin: '5px 0 0',
    color: '#6b7280',
    fontSize: '13px',
  },

  refreshButton: {
    padding: '9px 14px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  settlementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  settlementCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },

  settlementTop: {
    background: '#fafcf9',
    borderBottom: '1px solid #e5e7eb',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },

  orderId: {
    margin: 0,
    fontWeight: '700',
    fontSize: '14px',
  },

  orderDate: {
    margin: '4px 0 0',
    color: '#9ca3af',
    fontSize: '11px',
  },

  badges: {
    display: 'flex',
    gap: '7px',
    flexWrap: 'wrap',
  },

  statusBadge: {
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  deliveredBadge: {
    background: '#d4edda',
    color: '#155724',
  },

  otherStatusBadge: {
    background: '#eeeeee',
    color: '#555555',
  },

  paidBadge: {
    background: '#d4edda',
    color: '#155724',
  },

  paymentBadge: {
    background: '#fff3cd',
    color: '#856404',
  },

  productSection: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },

  productInfo: {
    flex: 1,
    minWidth: '180px',
  },

  productName: {
    margin: 0,
    fontSize: '17px',
    color: '#1f2937',
  },

  quantityText: {
    margin: '7px 0 0',
    color: '#6b7280',
    fontSize: '13px',
  },

  priceGrid: {
    display: 'flex',
    gap: '25px',
    flexWrap: 'wrap',
  },

  priceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  priceLabel: {
    fontSize: '10px',
    color: '#9ca3af',
  },

  settlementBottom: {
    margin: '0 16px 16px',
    padding: '15px',
    borderRadius: '10px',
    background: '#f7faf7',
    border: '1px solid #dfe8df',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },

  settlementLabel: {
    margin: 0,
    fontSize: '11px',
    color: '#6b7280',
  },

  settlementAmount: {
    margin: '5px 0 0',
    fontSize: '22px',
    color: '#166534',
  },

  settlementStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '5px',
  },

  completedBadge: {
    background: '#d4edda',
    color: '#155724',
    padding: '7px 11px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },

  pendingBadge: {
    background: '#fff3cd',
    color: '#856404',
    padding: '7px 11px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },

  waitingBadge: {
    background: '#eeeeee',
    color: '#555555',
    padding: '7px 11px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },

  paidAt: {
    fontSize: '10px',
    color: '#777777',
    textAlign: 'right',
  },

  emptyBox: {
    padding: '45px 20px',
    textAlign: 'center',
    border: '1px dashed #d1d5db',
    borderRadius: '10px',
  },

  emptyIcon: {
    fontSize: '42px',
    marginBottom: '8px',
  },

  emptyTitle: {
    margin: '5px 0',
    color: '#374151',
  },

  emptyText: {
    margin: 0,
    color: '#6b7280',
    fontSize: '13px',
  },

  /* =====================================================
     QUICK ACTIONS
  ===================================================== */

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