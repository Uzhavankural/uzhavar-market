'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function FarmerEarningsPage() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [settlements, setSettlements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkFarmer()
  }, [])

  // =====================================================
  // CHECK FARMER
  // =====================================================

  async function checkFarmer() {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

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

      if (data.role !== 'farmer') {
        setProfile(data)
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setProfile(data)

      await loadFarmerEarnings(user.id)
    } catch (error) {
      console.log('FARMER EARNINGS PAGE ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // LOAD FARMER EARNINGS
  // =====================================================

  async function loadFarmerEarnings(farmerId) {
    setRefreshing(true)

    try {
      const { data: items, error: itemsError } = await supabase
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

      if (itemsError) {
        console.log('FARMER EARNINGS ITEMS ERROR:', itemsError)
        setSettlements([])
        return
      }

      const orderItems = items || []

      if (orderItems.length === 0) {
        setSettlements([])
        return
      }

      // Get unique order IDs
      const orderIds = [
        ...new Set(
          orderItems.map((item) => item.order_id)
        ),
      ]

      // Load order details
      const {
        data: orders,
        error: ordersError,
      } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          delivery_address,
          district,
          village,
          total_amount,
          order_status,
          payment_status,
          created_at
        `)
        .in('id', orderIds)

      if (ordersError) {
        console.log('FARMER EARNINGS ORDERS ERROR:', ordersError)
        setSettlements([])
        return
      }

      const orderMap = {}

      ;(orders || []).forEach((order) => {
        orderMap[order.id] = order
      })

      // =================================================
      // ONLY DELIVERED ORDERS
      // =================================================

      const completedItems = orderItems
        .map((item) => {
          const order = orderMap[item.order_id]

          if (!order) {
            return null
          }

          // Only completed/delivered orders
          if (order.order_status !== 'delivered') {
            return null
          }

          const quantity = Number(item.quantity || 0)

          const farmerPrice = Number(
            item.farmer_price || 0
          )

          const customerPrice = Number(
            item.price || 0
          )

          const itemTotal = Number(
            item.item_total || 0
          )

          // Farmer amount = farmer price × quantity
          const farmerAmount =
            farmerPrice * quantity

          // Commission is PER UNIT
          const commissionPerUnit =
            item.commission_amount !== null &&
            item.commission_amount !== undefined
              ? Number(item.commission_amount)
              : Math.max(
                  0,
                  customerPrice - farmerPrice
                )

          // Total commission = per-unit × quantity
          const commissionTotal =
            commissionPerUnit * quantity

          const calculatedSettlement =
            farmerAmount

          const settlementAmount =
            item.settlement_amount !== null &&
            item.settlement_amount !== undefined
              ? Number(item.settlement_amount)
              : calculatedSettlement

          return {
            ...item,

            customer_name:
              order.customer_name || 'Customer',

            customer_phone:
              order.customer_phone || '',

            delivery_address:
              order.delivery_address || '',

            district:
              order.district || '',

            village:
              order.village || '',

            order_total_amount:
              Number(order.total_amount || 0),

            order_status:
              order.order_status,

            payment_status:
              order.payment_status,

            order_created_at:
              order.created_at,

            calculated_farmer_amount:
              farmerAmount,

            commission_per_unit:
              commissionPerUnit,

            calculated_commission:
              commissionTotal,

            calculated_customer_total:
              customerPrice * quantity,

            final_settlement_amount:
              settlementAmount,

            item_total_value:
              itemTotal,
          }
        })
        .filter(Boolean)

      setSettlements(completedItems)
    } catch (error) {
      console.log('LOAD FARMER EARNINGS ERROR:', error)
      setSettlements([])
    } finally {
      setRefreshing(false)
    }
  }

  // =====================================================
  // REFRESH
  // =====================================================

  async function handleRefresh() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    await loadFarmerEarnings(user.id)
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // =====================================================
  // MONEY FORMAT
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
  // DATE FORMAT
  // =====================================================

  function formatDate(date) {
    if (!date) return '-'

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function formatDateTime(date) {
    if (!date) return '-'

    return new Date(date).toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  // =====================================================
  // FILTER
  // =====================================================

  const filteredSettlements = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase()

    return settlements.filter((item) => {
      const matchesSearch =
        !search ||
        item.customer_name
          ?.toLowerCase()
          .includes(search) ||
        item.customer_phone
          ?.toLowerCase()
          .includes(search) ||
        item.product_name
          ?.toLowerCase()
          .includes(search) ||
        item.order_id
          ?.toLowerCase()
          .includes(search)

      const isPaid =
        item.settlement_status === 'paid'

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && isPaid) ||
        (statusFilter === 'pending' && !isPaid)

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    settlements,
    searchTerm,
    statusFilter,
  ])

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalSales = settlements.reduce(
    (total, item) =>
      total +
      Number(
        item.calculated_customer_total || 0
      ),
    0
  )

  const totalFarmerEarnings =
    settlements.reduce(
      (total, item) =>
        total +
        Number(
          item.calculated_farmer_amount || 0
        ),
      0
    )

  const totalCommission =
    settlements.reduce(
      (total, item) =>
        total +
        Number(
          item.calculated_commission || 0
        ),
      0
    )

  const paidSettlements =
    settlements.filter(
      (item) =>
        item.settlement_status === 'paid'
    )

  const pendingSettlements =
    settlements.filter(
      (item) =>
        item.settlement_status !== 'paid'
    )

  const totalPaid =
    paidSettlements.reduce(
      (total, item) =>
        total +
        Number(
          item.final_settlement_amount || 0
        ),
      0
    )

  const totalPending =
    pendingSettlements.reduce(
      (total, item) =>
        total +
        Number(
          item.final_settlement_amount || 0
        ),
      0
    )

  const completedOrderIds = new Set(
    settlements.map(
      (item) => item.order_id
    )
  )

  const paidOrderIds = new Set(
    paidSettlements.map(
      (item) => item.order_id
    )
  )

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
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>
            🌾
          </div>

          <p style={styles.loadingText}>
            Loading earnings...
          </p>
        </div>
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
        <div style={styles.accessBox}>
          <div style={styles.accessIcon}>
            🚫
          </div>

          <h2 style={styles.accessTitle}>
            You don't have access to the
            Farmer Earnings Panel.
          </h2>

          <p style={styles.accessText}>
            This page is available only for
            farmer users.
          </p>

          <button
            onClick={() =>
              router.push(dashboardPath)
            }
            style={styles.primaryButton}
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
  // PAGE
  // =====================================================

  return (
    <main style={styles.page}>

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav style={styles.navbar}>

        <button
          onClick={() =>
            router.push('/farmer')
          }
          style={styles.logoButton}
        >
          🌾 Uzhavar Market
        </button>

        <div style={styles.navRight}>

          <button
            onClick={() =>
              router.push('/farmer')
            }
            style={styles.backButton}
          >
            ← Dashboard
          </button>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>

        </div>

      </nav>

      <section style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div style={styles.headerCard}>

          <div>
            <p style={styles.smallTitle}>
              FARMER FINANCE
            </p>

            <h1 style={styles.title}>
              My Earnings & Settlements 💰
            </h1>

            <p style={styles.subtitle}>
              View your completed orders,
              farmer earnings and settlement
              status.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              ...styles.refreshButton,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing
              ? '⏳ Refreshing...'
              : '🔄 Refresh'}
          </button>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div style={styles.summaryGrid}>

          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              🛒
            </span>

            <p style={styles.summaryLabel}>
              Completed Orders
            </p>

            <h2 style={styles.summaryNumber}>
              {completedOrderIds.size}
            </h2>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              💰
            </span>

            <p style={styles.summaryLabel}>
              Farmer Earnings
            </p>

            <h2
              style={{
                ...styles.summaryNumber,
                color: '#166534',
              }}
            >
              ₹{formatMoney(
                totalFarmerEarnings
              )}
            </h2>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              💼
            </span>

            <p style={styles.summaryLabel}>
              Platform Commission
            </p>

            <h2 style={styles.summaryNumber}>
              ₹{formatMoney(totalCommission)}
            </h2>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>
              🌾
            </span>

            <p style={styles.summaryLabel}>
              Customer Sales
            </p>

            <h2 style={styles.summaryNumber}>
              ₹{formatMoney(totalSales)}
            </h2>
          </div>

        </div>

        {/* =================================================
            SETTLEMENT SUMMARY
        ================================================= */}

        <div style={styles.settlementSummary}>

          <div>
            <p style={styles.summarySmallLabel}>
              Settlement Overview
            </p>

            <h2 style={styles.settlementTitle}>
              Farmer Settlement
            </h2>
          </div>

          <div style={styles.settlementStats}>

            <div style={styles.settlementStat}>
              <span
                style={{
                  ...styles.settlementStatNumber,
                  color: '#166534',
                }}
              >
                ₹{formatMoney(totalPaid)}
              </span>

              <span style={styles.settlementStatLabel}>
                Paid
              </span>
            </div>

            <div style={styles.settlementStat}>
              <span
                style={{
                  ...styles.settlementStatNumber,
                  color: '#b7791f',
                }}
              >
                ₹{formatMoney(totalPending)}
              </span>

              <span style={styles.settlementStatLabel}>
                Pending
              </span>
            </div>

            <div style={styles.settlementStat}>
              <span style={styles.settlementStatNumber}>
                {paidOrderIds.size}
              </span>

              <span style={styles.settlementStatLabel}>
                Paid Orders
              </span>
            </div>

            <div style={styles.settlementStat}>
              <span style={styles.settlementStatNumber}>
                {pendingOrderIds.size}
              </span>

              <span style={styles.settlementStatLabel}>
                Pending Orders
              </span>
            </div>

          </div>

        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div style={styles.filterCard}>

          <div style={styles.searchWrapper}>

            <span style={styles.searchIcon}>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search customer name, mobile, product or order ID..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              style={styles.searchInput}
            />

          </div>

          <div style={styles.filterButtons}>

            <button
              onClick={() =>
                setStatusFilter('all')
              }
              style={{
                ...styles.filterButton,
                ...(statusFilter === 'all'
                  ? styles.activeFilter
                  : {}),
              }}
            >
              All
            </button>

            <button
              onClick={() =>
                setStatusFilter('paid')
              }
              style={{
                ...styles.filterButton,
                ...(statusFilter === 'paid'
                  ? styles.activeFilter
                  : {}),
              }}
            >
              ✓ Paid
            </button>

            <button
              onClick={() =>
                setStatusFilter('pending')
              }
              style={{
                ...styles.filterButton,
                ...(statusFilter === 'pending'
                  ? styles.activeFilter
                  : {}),
              }}
            >
              ⏳ Pending
            </button>

          </div>

        </div>

        {/* =================================================
            RESULT COUNT
        ================================================= */}

        <div style={styles.resultHeader}>

          <div>
            <h2 style={styles.sectionTitle}>
              Completed Orders
            </h2>

            <p style={styles.resultText}>
              Showing {filteredSettlements.length}{' '}
              of {settlements.length} completed
              order items
            </p>
          </div>

        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredSettlements.length === 0 ? (

          <div style={styles.emptyBox}>

            <div style={styles.emptyIcon}>
              🌱
            </div>

            <h3 style={styles.emptyTitle}>
              {settlements.length === 0
                ? 'No completed orders yet'
                : 'No matching orders'}
            </h3>

            <p style={styles.emptyText}>
              {settlements.length === 0
                ? 'Your earnings and settlement details will appear here after an order is delivered.'
                : 'Try changing the search or settlement filter.'}
            </p>

          </div>

        ) : (

          <div style={styles.orderList}>

            {filteredSettlements.map((item) => {

              const isPaid =
                item.settlement_status === 'paid'

              return (
                <div
                  key={item.id}
                  style={styles.orderCard}
                >

                  {/* =================================================
                      ORDER HEADER
                  ================================================= */}

                  <div style={styles.orderHeader}>

                    <div>

                      <p style={styles.orderId}>
                        Order #{item.order_id.slice(0, 8)}
                      </p>

                      <p style={styles.orderDate}>
                        {formatDate(
                          item.order_created_at
                        )}
                      </p>

                    </div>

                    <div style={styles.badges}>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...styles.deliveredBadge,
                        }}
                      >
                        ✓ Delivered
                      </span>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(isPaid
                            ? styles.paidBadge
                            : styles.pendingBadge),
                        }}
                      >
                        {isPaid
                          ? '✓ Settlement Paid'
                          : '⏳ Settlement Pending'}
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      CUSTOMER
                  ================================================= */}

                  <div style={styles.customerSection}>

                    <div style={styles.customerIcon}>
                      👤
                    </div>

                    <div style={styles.customerInfo}>

                      <h3 style={styles.customerName}>
                        {item.customer_name}
                      </h3>

                      {item.customer_phone && (
                        <p style={styles.customerPhone}>
                          📱 {item.customer_phone}
                        </p>
                      )}

                      {(item.village ||
                        item.district) && (
                        <p style={styles.customerLocation}>
                          📍{' '}
                          {[
                            item.village,
                            item.district,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* =================================================
                      PRODUCT
                  ================================================= */}

                  <div style={styles.productSection}>

                    <div style={styles.productInfo}>

                      <h3 style={styles.productName}>
                        🌾 {item.product_name}
                      </h3>

                      <p style={styles.quantityText}>
                        Quantity: {item.quantity}{' '}
                        {item.unit}
                      </p>

                    </div>

                    <div style={styles.priceGrid}>

                      <div style={styles.priceItem}>

                        <span style={styles.priceLabel}>
                          Customer Price
                        </span>

                        <strong style={styles.priceValue}>
                          ₹{formatMoney(item.price)}
                          {' / '}
                          {item.unit || 'unit'}
                        </strong>

                      </div>

                      <div style={styles.priceItem}>

                        <span style={styles.priceLabel}>
                          Farmer Price
                        </span>

                        <strong style={styles.priceValue}>
                          ₹{formatMoney(
                            item.farmer_price
                          )}
                          {' / '}
                          {item.unit || 'unit'}
                        </strong>

                      </div>

                      <div style={styles.priceItem}>

                        <span style={styles.priceLabel}>
                          Commission
                        </span>

                        <strong style={styles.priceValue}>
                          ₹{formatMoney(
                            item.commission_per_unit
                          )}
                          {' / '}
                          {item.unit || 'unit'}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      TOTALS
                  ================================================= */}

                  <div style={styles.totalGrid}>

                    <div style={styles.totalItem}>

                      <span style={styles.totalLabel}>
                        Customer Total
                      </span>

                      <strong style={styles.totalValue}>
                        ₹{formatMoney(
                          item.calculated_customer_total
                        )}
                      </strong>

                    </div>

                    <div style={styles.totalItem}>

                      <span style={styles.totalLabel}>
                        Farmer Earnings
                      </span>

                      <strong
                        style={{
                          ...styles.totalValue,
                          color: '#166534',
                        }}
                      >
                        ₹{formatMoney(
                          item.calculated_farmer_amount
                        )}
                      </strong>

                    </div>

                    <div style={styles.totalItem}>

                      <span style={styles.totalLabel}>
                        Total Commission
                      </span>

                      <strong style={styles.totalValue}>
                        ₹{formatMoney(
                          item.calculated_commission
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* =================================================
                      SETTLEMENT
                  ================================================= */}

                  <div style={styles.settlementBottom}>

                    <div>

                      <p style={styles.settlementLabel}>
                        Farmer Settlement Amount
                      </p>

                      <h2 style={styles.settlementAmount}>
                        ₹{formatMoney(
                          item.final_settlement_amount
                        )}
                      </h2>

                    </div>

                    <div style={styles.settlementRight}>

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
                              {formatDateTime(
                                item.settlement_paid_at
                              )}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span
                            style={styles.pendingBadgeLarge}
                          >
                            ⏳ Pending Settlement
                          </span>

                          <span style={styles.paidAt}>
                            Waiting for admin settlement.
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

      </section>

    </main>
  )
}

// =========================================================
// STYLES
// =========================================================

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

  loadingBox: {
    textAlign: 'center',
  },

  loadingIcon: {
    fontSize: '45px',
    marginBottom: '10px',
  },

  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
  },

  accessBox: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: '30px',
  },

  accessIcon: {
    fontSize: '50px',
    marginBottom: '15px',
  },

  accessTitle: {
    margin: '0 0 10px',
    color: '#1f2937',
  },

  accessText: {
    margin: '0 0 25px',
    color: '#6b7280',
    fontSize: '15px',
  },

  primaryButton: {
    padding: '11px 20px',
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
    padding: '16px 6%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
  },

  logoButton: {
    border: 'none',
    background: 'transparent',
    color: '#166534',
    fontSize: '22px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },

  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  backButton: {
    padding: '9px 15px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
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
    padding: '35px 0 50px',
  },

  headerCard: {
    background: '#166534',
    color: '#ffffff',
    padding: '30px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },

  smallTitle: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    margin: '0 0 8px',
    opacity: 0.85,
  },

  title: {
    fontSize: '30px',
    margin: '0 0 8px',
  },

  subtitle: {
    margin: 0,
    opacity: 0.9,
    fontSize: '15px',
  },

  refreshButton: {
    padding: '10px 16px',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#166534',
    cursor: 'pointer',
    fontWeight: '700',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '18px',
    marginTop: '22px',
  },

  summaryCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
  },

  summaryIcon: {
    fontSize: '27px',
  },

  summaryLabel: {
    margin: '10px 0 5px',
    fontSize: '12px',
    color: '#6b7280',
  },

  summaryNumber: {
    margin: 0,
    fontSize: '23px',
    color: '#1f2937',
  },

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

  summarySmallLabel: {
    margin: 0,
    color: '#6b7280',
    fontSize: '12px',
  },

  settlementTitle: {
    margin: '5px 0 0',
    fontSize: '20px',
    color: '#1f2937',
  },

  settlementStats: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
  },

  settlementStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },

  settlementStatNumber: {
    fontSize: '19px',
    fontWeight: '700',
  },

  settlementStatLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },

  filterCard: {
    marginTop: '22px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },

  searchWrapper: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '9px',
    padding: '0 12px',
    background: '#ffffff',
  },

  searchIcon: {
    fontSize: '17px',
  },

  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: '11px 10px',
    fontSize: '14px',
    background: 'transparent',
  },

  filterButtons: {
    display: 'flex',
    gap: '8px',
  },

 filterButton: {
  padding: '9px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  background: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
  fontWeight: '600',
},

activeFilter: {
  background: '#166534',
  color: '#ffffff',
  border: '1px solid #166534',
},

  resultHeader: {
    marginTop: '30px',
  },

  sectionTitle: {
    margin: 0,
    color: '#1f2937',
    fontSize: '23px',
  },

  resultText: {
    margin: '5px 0 0',
    color: '#6b7280',
    fontSize: '13px',
  },

  emptyBox: {
    marginTop: '18px',
    padding: '50px 20px',
    textAlign: 'center',
    background: '#ffffff',
    border: '1px dashed #d1d5db',
    borderRadius: '14px',
  },

  emptyIcon: {
    fontSize: '45px',
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

  orderList: {
    marginTop: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  orderCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    overflow: 'hidden',
  },

  orderHeader: {
    background: '#fafcf9',
    borderBottom: '1px solid #e5e7eb',
    padding: '15px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },

  orderId: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#1f2937',
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
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },

  deliveredBadge: {
    background: '#d4edda',
    color: '#155724',
  },

  paidBadge: {
    background: '#d4edda',
    color: '#155724',
  },

  pendingBadge: {
    background: '#fff3cd',
    color: '#856404',
  },

  customerSection: {
    padding: '17px 18px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
  },

  customerIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#f0f7ef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },

  customerInfo: {
    minWidth: 0,
  },

  customerName: {
    margin: 0,
    fontSize: '16px',
    color: '#1f2937',
  },

  customerPhone: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },

  customerLocation: {
    margin: '3px 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },

  productSection: {
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },

  productInfo: {
    flex: 1,
    minWidth: '200px',
  },

  productName: {
    margin: 0,
    fontSize: '17px',
    color: '#1f2937',
  },

  quantityText: {
    margin: '7px 0 0',
    fontSize: '13px',
    color: '#6b7280',
  },

  priceGrid: {
    display: 'flex',
    gap: '28px',
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

  priceValue: {
    fontSize: '14px',
    color: '#1f2937',
  },

  totalGrid: {
    margin: '0 18px 18px',
    padding: '15px',
    background: '#fafafa',
    border: '1px solid #eeeeee',
    borderRadius: '10px',
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '15px',
  },

  totalItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  totalLabel: {
    fontSize: '10px',
    color: '#9ca3af',
  },

  totalValue: {
    fontSize: '17px',
    color: '#1f2937',
  },

  settlementBottom: {
    margin: '0 18px 18px',
    padding: '16px',
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
    fontSize: '24px',
    color: '#166534',
  },

  settlementRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
  },

  completedBadge: {
    background: '#d4edda',
    color: '#155724',
    padding: '7px 11px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },

  pendingBadgeLarge: {
    background: '#fff3cd',
    color: '#856404',
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
}