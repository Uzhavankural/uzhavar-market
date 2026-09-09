'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function FarmerOrders() {
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  // SEARCH
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  // ==================================================
  // LOAD ORDERS
  // ==================================================

  async function loadOrders() {
    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      // ------------------------------------------------
      // CHECK FARMER PROFILE
      // ------------------------------------------------

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('PROFILE ERROR:', profileError)

        setMessage('Farmer profile not found.')
        setLoading(false)
        return
      }

      if (profile.role !== 'farmer') {
        setMessage('Only farmers can access this page.')
        setLoading(false)
        return
      }

      // ------------------------------------------------
      // GET FARMER ORDER ITEMS
      // ------------------------------------------------

      const {
        data: orderItems,
        error: itemsError,
      } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          unit,
          item_total,
          commission_amount,
          farmer_price,
          settlement_status,
          settlement_amount,
          settlement_paid_at,
          created_at
        `)
        .eq('farmer_id', user.id)
        .order('created_at', {
          ascending: false,
        })

      if (itemsError) {
        console.error(
          'ORDER ITEMS ERROR:',
          JSON.stringify(itemsError, null, 2)
        )

        setMessage('Unable to load your orders.')
        setLoading(false)
        return
      }

      if (!orderItems || orderItems.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // ------------------------------------------------
      // GET ORDER DETAILS
      // ------------------------------------------------

      const orderIds = [
        ...new Set(
          orderItems.map((item) => item.order_id)
        ),
      ]

      const {
        data: orderDetails,
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
          order_status,
          payment_status,
          created_at
        `)
        .in('id', orderIds)

      if (ordersError) {
        console.error(
          'ORDERS ERROR:',
          JSON.stringify(ordersError, null, 2)
        )

        setMessage('Unable to load order details.')
        setLoading(false)
        return
      }

      // ------------------------------------------------
      // COMBINE ORDER + ORDER ITEM
      // ------------------------------------------------

      const combinedOrders = orderItems.map((item) => {
        const order = orderDetails?.find(
          (order) => order.id === item.order_id
        )

        const itemTotal = Number(
          item.item_total || 0
        )

        const farmerPrice = Number(
          item.farmer_price || 0
        )

        const quantity = Number(
          item.quantity || 0
        )

        // Farmer amount =
        // farmer price per unit × quantity
        const calculatedFarmerAmount =
          farmerPrice * quantity

        // Commission is stored PER UNIT
        const commissionPerUnit = Number(
          item.commission_amount ??
            (
              quantity > 0
                ? (itemTotal - calculatedFarmerAmount) /
                  quantity
                : 0
            )
        )

        // Total commission =
        // commission per unit × quantity
        const calculatedCommission =
          commissionPerUnit * quantity

        const settlementAmount =
          item.settlement_amount !== null &&
          item.settlement_amount !== undefined
            ? Number(item.settlement_amount)
            : calculatedFarmerAmount

        return {
          ...item,
          order,

          calculatedFarmerAmount,
          calculatedCommission,
          calculatedSettlement: settlementAmount,
        }
      })

      setOrders(combinedOrders)
    } catch (error) {
      console.error(
        'FARMER ORDERS ERROR:',
        JSON.stringify(error, null, 2)
      )

      setMessage('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ==================================================
  // FARMER ORDER STATUS UPDATE
  // ==================================================
  //
  // IMPORTANT:
  // Farmer can ONLY:
  //
  // confirmed → shipped
  //
  // Farmer CANNOT:
  //
  // pending → confirmed
  // shipped → delivered
  //
  // ==================================================

  async function updateOrderStatus(
    orderId,
    newStatus
  ) {
    setUpdating(orderId)
    setMessage('')

    try {
      // ------------------------------------------------
      // GET CURRENT USER
      // ------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('Please login again.')
        return
      }

      // ------------------------------------------------
      // FIND CURRENT ORDER
      // ------------------------------------------------

      const currentItem = orders.find(
        (item) =>
          item.order?.id === orderId
      )

      if (!currentItem?.order) {
        setMessage('Order not found.')
        return
      }

      const currentStatus = String(
        currentItem.order.order_status || ''
      )
        .trim()
        .toLowerCase()

      // ------------------------------------------------
      // ONLY CONFIRMED → SHIPPED
      // ------------------------------------------------

      if (
        currentStatus !== 'confirmed' ||
        newStatus !== 'shipped'
      ) {
        setMessage(
          'You can ship an order only after admin confirms it.'
        )
        return
      }

      // ------------------------------------------------
      // UPDATE ORDER
      // ------------------------------------------------

      const {
        data: updatedOrder,
        error,
      } = await supabase
        .from('orders')
        .update({
          order_status: 'shipped',
        })
        .eq('id', orderId)
        .eq('order_status', 'confirmed')
        .select('id, order_status')
        .single()

      if (error) {
        console.error(
          'SHIP ORDER ERROR:',
          JSON.stringify(error, null, 2)
        )

        setMessage(
          error.message ||
            'Unable to mark order as shipped.'
        )

        return
      }

      if (!updatedOrder) {
        setMessage(
          'Order could not be updated. It may already have changed.'
        )

        return
      }

      // ------------------------------------------------
      // UPDATE LOCAL UI
      // ------------------------------------------------

      setOrders((currentOrders) =>
        currentOrders.map((item) => {
          if (
            item.order &&
            item.order.id === orderId
          ) {
            return {
              ...item,

              order: {
                ...item.order,

                order_status: 'shipped',
              },
            }
          }

          return item
        })
      )

      setMessage(
        'Order marked as shipped successfully.'
      )
    } catch (error) {
      console.error(
        'SHIP ORDER ERROR:',
        JSON.stringify(error, null, 2)
      )

      setMessage('Something went wrong.')
    } finally {
      setUpdating(null)
    }
  }

  // ==================================================
  // NEXT ACTION
  // ==================================================

  function getNextAction(status) {
    const currentStatus = String(
      status || ''
    )
      .trim()
      .toLowerCase()

    // ------------------------------------------------
    // PENDING
    // ------------------------------------------------
    // Admin must verify payment and confirm order.
    // Farmer cannot confirm.
    // ------------------------------------------------

    if (currentStatus === 'pending') {
      return {
        text: '🔒 Waiting for Admin Confirmation',
        nextStatus: null,
        disabled: true,
      }
    }

    // ------------------------------------------------
    // CONFIRMED
    // ------------------------------------------------
    // Farmer can ship.
    // ------------------------------------------------

    if (currentStatus === 'confirmed') {
      return {
        text: '🚚 Ship Order',
        nextStatus: 'shipped',
        disabled: false,
      }
    }

    // ------------------------------------------------
    // SHIPPED
    // ------------------------------------------------
    // Customer must confirm delivery.
    // Farmer cannot mark delivered.
    // ------------------------------------------------

    if (currentStatus === 'shipped') {
      return {
        text: '⏳ Waiting for Customer Delivery Confirmation',
        nextStatus: null,
        disabled: true,
      }
    }

    // ------------------------------------------------
    // DELIVERED
    // ------------------------------------------------
    // Customer already confirmed delivery.
    // Admin can pay farmer.
    // ------------------------------------------------

    if (currentStatus === 'delivered') {
      return {
        text: '✓ Delivery Confirmed by Customer',
        nextStatus: null,
        disabled: true,
      }
    }

    return null
  }

  // ==================================================
  // FILTER + SEARCH
  // ==================================================

  const filteredOrders = useMemo(() => {
    let result = orders

    // ------------------------------------------------
    // STATUS FILTER
    // ------------------------------------------------

    if (filter === 'pending') {
      result = result.filter(
        (item) =>
          String(
            item.order?.order_status || ''
          ).toLowerCase() === 'pending'
      )
    }

    if (filter === 'confirmed') {
      result = result.filter(
        (item) =>
          String(
            item.order?.order_status || ''
          ).toLowerCase() === 'confirmed'
      )
    }

    if (filter === 'shipped') {
      result = result.filter(
        (item) =>
          String(
            item.order?.order_status || ''
          ).toLowerCase() === 'shipped'
      )
    }

    if (filter === 'delivered') {
      result = result.filter(
        (item) =>
          String(
            item.order?.order_status || ''
          ).toLowerCase() === 'delivered'
      )
    }

    if (filter === 'paid') {
      result = result.filter(
        (item) =>
          String(
            item.settlement_status || ''
          ).toLowerCase() === 'paid'
      )
    }

    if (filter === 'settlement_pending') {
      result = result.filter(
        (item) =>
          String(
            item.settlement_status || ''
          ).toLowerCase() !== 'paid'
      )
    }

    // ------------------------------------------------
    // CUSTOMER SEARCH
    // ------------------------------------------------

    const search = searchTerm
      .trim()
      .toLowerCase()

    if (search) {
      result = result.filter((item) => {
        const customerName = String(
          item.order?.customer_name || ''
        ).toLowerCase()

        const customerPhone = String(
          item.order?.customer_phone || ''
        ).toLowerCase()

        return (
          customerName.includes(search) ||
          customerPhone.includes(search)
        )
      })
    }

    return result
  }, [
    orders,
    filter,
    searchTerm,
  ])

  // ==================================================
  // SUMMARY CALCULATIONS
  // ==================================================

  const summary = useMemo(() => {
    let sales = 0
    let commission = 0
    let earned = 0
    let pendingSettlement = 0

    let deliveredCount = 0
    let paidSettlementCount = 0
    let pendingSettlementCount = 0

    const deliveredOrderIds = new Set()

    orders.forEach((item) => {
      const itemTotal = Number(
        item.item_total || 0
      )

      const calculatedCommission = Number(
        item.calculatedCommission || 0
      )

      const settlementAmount = Number(
        item.calculatedSettlement || 0
      )

      sales += itemTotal
      commission += calculatedCommission

      const status = String(
        item.order?.order_status || ''
      ).toLowerCase()

      const settlementStatus = String(
        item.settlement_status || ''
      ).toLowerCase()

      if (status === 'delivered') {
        deliveredOrderIds.add(
          item.order_id
        )
      }

      if (settlementStatus === 'paid') {
        earned += settlementAmount
        paidSettlementCount += 1
      } else {
        pendingSettlement += settlementAmount
        pendingSettlementCount += 1
      }
    })

    deliveredCount =
      deliveredOrderIds.size

    return {
      sales,
      commission,
      earned,
      pendingSettlement,
      deliveredCount,
      paidSettlementCount,
      pendingSettlementCount,
    }
  }, [orders])

  // ==================================================
  // STATUS STYLE
  // ==================================================

  function getStatusStyle(status) {
    const currentStatus = String(
      status || ''
    ).toLowerCase()

    if (currentStatus === 'pending') {
      return {
        background: '#fff7ed',
        color: '#c2410c',
      }
    }

    if (currentStatus === 'confirmed') {
      return {
        background: '#eff6ff',
        color: '#1d4ed8',
      }
    }

    if (currentStatus === 'shipped') {
      return {
        background: '#f5f3ff',
        color: '#6d28d9',
      }
    }

    if (currentStatus === 'delivered') {
      return {
        background: '#ecfdf5',
        color: '#047857',
      }
    }

    if (currentStatus === 'cancelled') {
      return {
        background: '#fef2f2',
        color: '#b91c1c',
      }
    }

    return {
      background: '#f3f4f6',
      color: '#374151',
    }
  }

  // ==================================================
  // SETTLEMENT STYLE
  // ==================================================

  function getSettlementStyle(status) {
    if (
      String(status || '')
        .toLowerCase() === 'paid'
    ) {
      return {
        background: '#ecfdf5',
        color: '#047857',
      }
    }

    return {
      background: '#fff7ed',
      color: '#c2410c',
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>

          <div style={styles.loadingIcon}>
            🌾
          </div>

          <p style={styles.loadingText}>
            Loading your orders...
          </p>

        </div>
      </main>
    )
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* BACK */}

        <button
          onClick={() =>
            router.push('/farmer')
          }
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        {/* HEADER */}

        <div style={styles.header}>

          <div>
            <p style={styles.smallTitle}>
              FARMER PANEL
            </p>

            <h1 style={styles.title}>
              My Orders
            </h1>

            <p style={styles.subtitle}>
              Manage your customer orders and
              track your earnings.
            </p>
          </div>

          <button
            onClick={loadOrders}
            style={styles.refreshButton}
          >
            ↻ Refresh
          </button>

        </div>

        {/* MESSAGE */}

        {message && (
          <div
            style={
              message.includes(
                'successfully'
              )
                ? styles.success
                : styles.error
            }
          >
            {message}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div style={styles.summaryGrid}>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🛒
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Total Sales
              </p>

              <h2 style={styles.summaryNumber}>
                ₹{summary.sales.toFixed(2)}
              </h2>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🌾
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Farmer Earnings
              </p>

              <h2 style={styles.summaryNumber}>
                ₹{summary.earned.toFixed(2)}
              </h2>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              ⏳
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Pending Settlement
              </p>

              <h2 style={styles.summaryNumber}>
                ₹
                {summary.pendingSettlement.toFixed(
                  2
                )}
              </h2>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              📦
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Delivered Orders
              </p>

              <h2 style={styles.summaryNumber}>
                {summary.deliveredCount}
              </h2>
            </div>
          </div>

        </div>

        {/* EARNINGS OVERVIEW */}

        {orders.length > 0 && (
          <section
            style={styles.earningsSection}
          >

            <div
              style={styles.sectionHeader}
            >
              <div>

                <h2
                  style={styles.sectionTitle}
                >
                  Earnings Overview
                </h2>

                <p
                  style={styles.sectionSubtitle}
                >
                  Track your farmer amount and
                  platform commission.
                </p>

              </div>
            </div>

            <div style={styles.earningsGrid}>

              <div style={styles.earningBox}>
                <span
                  style={styles.earningLabel}
                >
                  Farmer Sales
                </span>

                <strong
                  style={styles.earningValue}
                >
                  ₹{summary.sales.toFixed(2)}
                </strong>
              </div>

              <div style={styles.earningBox}>
                <span
                  style={styles.earningLabel}
                >
                  Platform Commission
                </span>

                <strong
                  style={styles.commissionValue}
                >
                  ₹
                  {summary.commission.toFixed(
                    2
                  )}
                </strong>
              </div>

              <div style={styles.earningBox}>
                <span
                  style={styles.earningLabel}
                >
                  Settlements Paid
                </span>

                <strong
                  style={styles.paidValue}
                >
                  {summary.paidSettlementCount}
                </strong>
              </div>

              <div style={styles.earningBox}>
                <span
                  style={styles.earningLabel}
                >
                  Settlements Pending
                </span>

                <strong
                  style={styles.pendingValue}
                >
                  {summary.pendingSettlementCount}
                </strong>
              </div>

            </div>

          </section>
        )}

        {/* SEARCH */}

        {orders.length > 0 && (
          <section
            style={styles.searchSection}
          >

            <div
              style={styles.searchHeader}
            >
              <div>

                <h2
                  style={styles.sectionTitle}
                >
                  🔍 Find Customer Order
                </h2>

                <p
                  style={styles.sectionSubtitle}
                >
                  Search using customer name or
                  mobile number.
                </p>

              </div>
            </div>

            <div
              style={styles.searchWrapper}
            >

              <span
                style={styles.searchIcon}
              >
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Search customer name or mobile number..."
                style={styles.searchInput}
              />

              {searchTerm && (
                <button
                  onClick={() =>
                    setSearchTerm('')
                  }
                  style={
                    styles.clearSearchButton
                  }
                >
                  ✕
                </button>
              )}

            </div>

            {searchTerm.trim() && (
              <p
                style={styles.searchResultText}
              >
                {filteredOrders.length}{' '}
                {filteredOrders.length === 1
                  ? 'order'
                  : 'orders'}{' '}
                found
              </p>
            )}

          </section>
        )}

        {/* FILTERS */}

        {orders.length > 0 && (
          <section
            style={styles.filterSection}
          >

            <h2 style={styles.sectionTitle}>
              Order Filters
            </h2>

            <div style={styles.filterGrid}>

              <button
                onClick={() =>
                  setFilter('all')
                }
                style={{
                  ...styles.filterButton,
                  ...(filter === 'all'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                All ({orders.length})
              </button>

              <button
                onClick={() =>
                  setFilter('pending')
                }
                style={{
                  ...styles.filterButton,
                  ...(filter === 'pending'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                Pending
              </button>

              <button
                onClick={() =>
                  setFilter('confirmed')
                }
                style={{
                  ...styles.filterButton,
                  ...(filter === 'confirmed'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                Confirmed
              </button>

              <button
                onClick={() =>
                  setFilter('shipped')
                }
                style={{
                  ...styles.filterButton,
                  ...(filter === 'shipped'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                Shipped
              </button>

              <button
                onClick={() =>
                  setFilter('delivered')
                }
                style={{
                  ...styles.filterButton,
                  ...(filter === 'delivered'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                Delivered
              </button>

              <button
                onClick={() =>
                  setFilter('paid')
                }
                style={{
                  ...styles.filterButton,
                  ...(filter === 'paid'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                Settlement Paid
              </button>

              <button
                onClick={() =>
                  setFilter(
                    'settlement_pending'
                  )
                }
                style={{
                  ...styles.filterButton,
                  ...(filter ===
                  'settlement_pending'
                    ? styles.activeFilter
                    : {}),
                }}
              >
                Settlement Pending
              </button>

            </div>

          </section>
        )}

        {/* NO ORDERS */}

        {!message &&
          orders.length === 0 && (
            <div
              style={styles.emptyCard}
            >

              <div style={styles.emptyIcon}>
                📦
              </div>

              <h2
                style={styles.emptyTitle}
              >
                No Orders Yet
              </h2>

              <p style={styles.emptyText}>
                Orders for your products will
                appear here when customers place
                them.
              </p>

            </div>
          )}

        {/* SEARCH / FILTER EMPTY */}

        {orders.length > 0 &&
          filteredOrders.length === 0 && (
            <div
              style={
                styles.emptyFilterCard
              }
            >

              <div
                style={
                  styles.emptyFilterIcon
                }
              >
                🔍
              </div>

              <h3>
                No matching orders
              </h3>

              <p>
                {searchTerm.trim()
                  ? 'No customer found with that name or mobile number.'
                  : 'There are no orders in this filter.'}
              </p>

              {searchTerm.trim() && (
                <button
                  onClick={() =>
                    setSearchTerm('')
                  }
                  style={
                    styles.clearSearchLargeButton
                  }
                >
                  Clear Search
                </button>
              )}

            </div>
          )}

        {/* ORDERS */}

        {filteredOrders.length > 0 && (
          <div style={styles.ordersList}>

            {filteredOrders.map((item) => {
              const order = item.order

              if (!order) {
                return null
              }

              const nextAction =
                getNextAction(
                  order.order_status
                )

              const orderStatus =
                String(
                  order.order_status || ''
                ).toLowerCase()

              const settlementStatus =
                String(
                  item.settlement_status ||
                    'pending'
                ).toLowerCase()

              return (
                <div
                  key={item.id}
                  style={styles.orderCard}
                >

                  {/* ORDER HEADER */}

                  <div
                    style={styles.orderHeader}
                  >

                    <div>

                      <p
                        style={styles.orderLabel}
                      >
                        PRODUCT ORDER
                      </p>

                      <h2
                        style={
                          styles.productName
                        }
                      >
                        {item.product_name}
                      </h2>

                      <p
                        style={styles.orderId}
                      >
                        Order ID: {item.order_id}
                      </p>

                    </div>

                    <div
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(
                          order.order_status
                        ),
                      }}
                    >
                      {order.order_status ||
                        'Unknown'}
                    </div>

                  </div>

                  {/* PRODUCT DETAILS */}

                  <div
                    style={
                      styles.productDetails
                    }
                  >

                    <div
                      style={styles.detailBox}
                    >
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Customer Price
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        ₹
                        {Number(
                          item.price || 0
                        ).toFixed(2)}
                        {' / '}
                        {item.unit}
                      </strong>
                    </div>

                    <div
                      style={styles.detailBox}
                    >
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Quantity
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {item.quantity}{' '}
                        {item.unit}
                      </strong>
                    </div>

                    <div
                      style={styles.detailBox}
                    >
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Customer Total
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        ₹
                        {Number(
                          item.item_total || 0
                        ).toFixed(2)}
                      </strong>
                    </div>

                  </div>

                  {/* FARMER EARNINGS */}

                  <div
                    style={
                      styles.earningsCard
                    }
                  >

                    <div
                      style={
                        styles.earningsCardHeader
                      }
                    >

                      <div>

                        <h3
                          style={
                            styles.earningsTitle
                          }
                        >
                          🌾 Farmer Earnings
                        </h3>

                        <p
                          style={
                            styles.earningsHint
                          }
                        >
                          Your amount after platform
                          commission.
                        </p>

                      </div>

                      <div
                        style={{
                          ...styles.settlementBadge,
                          ...getSettlementStyle(
                            settlementStatus
                          ),
                        }}
                      >
                        {settlementStatus ===
                        'paid'
                          ? '✓ Settlement Paid'
                          : '⏳ Settlement Pending'}
                      </div>

                    </div>

                    <div
                      style={styles.moneyGrid}
                    >

                      <div>
                        <span
                          style={
                            styles.moneyLabel
                          }
                        >
                          Farmer Price
                        </span>

                        <strong
                          style={
                            styles.moneyValue
                          }
                        >
                          ₹
                          {Number(
                            item.farmer_price ||
                              0
                          ).toFixed(2)}
                          {' / '}
                          {item.unit}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.moneyLabel
                          }
                        >
                          Farmer Amount
                        </span>

                        <strong
                          style={
                            styles.moneyValue
                          }
                        >
                          ₹
                          {item.calculatedFarmerAmount.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.moneyLabel
                          }
                        >
                          Platform Commission
                        </span>

                        <strong
                          style={
                            styles.commissionMoney
                          }
                        >
                          ₹
                          {item.calculatedCommission.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.moneyLabel
                          }
                        >
                          Settlement Amount
                        </span>

                        <strong
                          style={
                            styles.settlementMoney
                          }
                        >
                          ₹
                          {item.calculatedSettlement.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                    </div>

                    {settlementStatus ===
                      'paid' &&
                      item.settlement_paid_at && (
                        <div
                          style={
                            styles.paidDate
                          }
                        >
                          Paid on:{' '}
                          {new Date(
                            item.settlement_paid_at
                          ).toLocaleString()}
                        </div>
                      )}

                  </div>

                  {/* CUSTOMER DETAILS */}

                  <div
                    style={
                      styles.customerSection
                    }
                  >

                    <h3
                      style={
                        styles.customerHeading
                      }
                    >
                      Customer Details
                    </h3>

                    <div
                      style={
                        styles.customerGrid
                      }
                    >

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          Name
                        </span>

                        <strong>
                          {order.customer_name ||
                            '-'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          Phone
                        </span>

                        <strong>
                          {order.customer_phone ||
                            '-'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          District
                        </span>

                        <strong>
                          {order.district || '-'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          Village / Town
                        </span>

                        <strong>
                          {order.village || '-'}
                        </strong>
                      </div>

                    </div>

                    <div
                      style={styles.addressBox}
                    >
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Delivery Address
                      </span>

                      <strong>
                        {order.delivery_address ||
                          '-'}
                      </strong>
                    </div>

                  </div>

                  {/* ORDER ACTION */}

                  <div
                    style={
                      styles.actionSection
                    }
                  >

                    {nextAction ? (
                      <button
                        onClick={() => {
                          if (
                            !nextAction.disabled
                          ) {
                            updateOrderStatus(
                              order.id,
                              nextAction.nextStatus
                            )
                          }
                        }}
                        disabled={
                          nextAction.disabled ||
                          updating === order.id
                        }
                        style={{
                          ...styles.actionButton,

                          opacity:
                            nextAction.disabled ||
                            updating === order.id
                              ? 0.6
                              : 1,

                          cursor:
                            nextAction.disabled ||
                            updating === order.id
                              ? 'not-allowed'
                              : 'pointer',

                          background:
                            nextAction.disabled
                              ? '#9ca3af'
                              : '#2e7d32',
                        }}
                      >
                        {updating === order.id
                          ? 'Updating...'
                          : nextAction.text}
                      </button>
                    ) : orderStatus ===
                      'delivered' ? (
                      <div
                        style={
                          styles.completed
                        }
                      >
                        ✓ Delivery Confirmed by
                        Customer
                      </div>
                    ) : (
                      <div
                        style={styles.noAction}
                      >
                        No action available
                      </div>
                    )}

                  </div>

                  {/* FOOTER */}

                  <div
                    style={styles.footer}
                  >

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Payment Status
                      </span>

                      <strong
                        style={{
                          textTransform:
                            'capitalize',
                        }}
                      >
                        {order.payment_status ||
                          '-'}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Order Date
                      </span>

                      <strong>
                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleString()
                          : '-'}
                      </strong>
                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>
    </main>
  )
}

// ==================================================
// STYLES
// ==================================================

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7f5',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
  },

  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f5f7f5',
    fontFamily: 'Arial, sans-serif',
  },

  loadingCard: {
    background: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow:
      '0 2px 12px rgba(0,0,0,0.08)',
  },

  loadingIcon: {
    fontSize: '45px',
    marginBottom: '15px',
  },

  loadingText: {
    margin: 0,
    color: '#555',
    fontSize: '16px',
  },

  container: {
    maxWidth: '1150px',
    margin: '0 auto',
  },

  backButton: {
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
    color: '#166534',
    fontWeight: '600',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },

  smallTitle: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    color: '#2e7d32',
  },

  title: {
    fontSize: '36px',
    margin: '0 0 8px',
    color: '#1f2937',
  },

  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '15px',
  },

  refreshButton: {
    padding: '11px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#2e7d32',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '16px',
    borderRadius: '10px',
    color: '#b91c1c',
    marginBottom: '25px',
  },

  success: {
    background: '#ecfdf5',
    border: '1px solid #bbf7d0',
    padding: '16px',
    borderRadius: '10px',
    color: '#047857',
    marginBottom: '25px',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '18px',
    marginBottom: '30px',
  },

  summaryCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '22px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow:
      '0 2px 8px rgba(0,0,0,0.04)',
  },

  summaryIcon: {
    fontSize: '30px',
  },

  summaryLabel: {
    margin: '0 0 6px',
    color: '#6b7280',
    fontSize: '13px',
  },

  summaryNumber: {
    margin: 0,
    fontSize: '22px',
    color: '#1f2937',
  },

  earningsSection: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '30px',
    border: '1px solid #e5e7eb',
  },

  sectionHeader: {
    marginBottom: '20px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#1f2937',
  },

  sectionSubtitle: {
    margin: '7px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },

  earningsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '15px',
  },

  earningBox: {
    background: '#f8faf8',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '18px',
  },

  earningLabel: {
    display: 'block',
    color: '#6b7280',
    fontSize: '13px',
    marginBottom: '8px',
  },

  earningValue: {
    fontSize: '21px',
    color: '#166534',
  },

  commissionValue: {
    fontSize: '21px',
    color: '#b45309',
  },

  paidValue: {
    fontSize: '21px',
    color: '#047857',
  },

  pendingValue: {
    fontSize: '21px',
    color: '#c2410c',
  },

  // ------------------------------------------------
  // SEARCH
  // ------------------------------------------------

  searchSection: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '25px',
    border: '1px solid #e5e7eb',
  },

  searchHeader: {
    marginBottom: '18px',
  },

  searchWrapper: {
    position: 'relative',
    width: '100%',
  },

  searchIcon: {
    position: 'absolute',
    left: '15px',
    top: '50%',
    transform:
      'translateY(-50%)',
    fontSize: '18px',
    pointerEvents: 'none',
  },

  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding:
      '14px 48px 14px 45px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    color: '#1f2937',
    background: '#ffffff',
  },

  clearSearchButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform:
      'translateY(-50%)',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    background: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    fontWeight: 'bold',
  },

  searchResultText: {
    margin: '12px 0 0',
    fontSize: '13px',
    color: '#166534',
    fontWeight: '600',
  },

  clearSearchLargeButton: {
    marginTop: '15px',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // ------------------------------------------------
  // FILTER
  // ------------------------------------------------

  filterSection: {
    marginBottom: '25px',
  },

  filterGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '15px',
  },

  filterButton: {
    padding: '9px 14px',
    borderRadius: '20px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },

  activeFilter: {
    background: '#166534',
    color: '#ffffff',
    border: '1px solid #166534',
  },

  // ------------------------------------------------
  // EMPTY
  // ------------------------------------------------

  emptyCard: {
    background: '#ffffff',
    padding: '65px 20px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.08)',
  },

  emptyIcon: {
    fontSize: '55px',
    marginBottom: '15px',
  },

  emptyTitle: {
    margin: '0 0 10px',
    color: '#1f2937',
  },

  emptyText: {
    margin: 0,
    color: '#6b7280',
  },

  emptyFilterCard: {
    background: '#ffffff',
    padding: '40px',
    borderRadius: '14px',
    textAlign: 'center',
    marginBottom: '20px',
  },

  emptyFilterIcon: {
    fontSize: '35px',
    marginBottom: '10px',
  },

  // ------------------------------------------------
  // ORDERS
  // ------------------------------------------------

  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  orderCard: {
    background: '#ffffff',
    padding: '25px',
    borderRadius: '16px',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.07)',
    border: '1px solid #e5e7eb',
  },

  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    paddingBottom: '20px',
    borderBottom:
      '1px solid #eee',
  },

  orderLabel: {
    margin: '0 0 5px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#6b7280',
  },

  productName: {
    margin: '0 0 7px',
    fontSize: '22px',
    color: '#1f2937',
  },

  orderId: {
    margin: 0,
    color: '#777',
    fontSize: '12px',
    wordBreak: 'break-all',
  },

  statusBadge: {
    flexShrink: 0,
    padding: '8px 13px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '13px',
    textTransform: 'capitalize',
  },

  productDetails: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '15px',
    padding: '20px 0',
  },

  detailBox: {
    background: '#fafafa',
    padding: '15px',
    borderRadius: '10px',
  },

  detailLabel: {
    display: 'block',
    color: '#777',
    fontSize: '12px',
    marginBottom: '6px',
  },

  detailValue: {
    color: '#1f2937',
    fontSize: '16px',
  },

  // ------------------------------------------------
  // EARNINGS
  // ------------------------------------------------

  earningsCard: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '13px',
    padding: '20px',
    marginTop: '5px',
  },

  earningsCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '20px',
  },

  earningsTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#166534',
  },

  earningsHint: {
    margin: '5px 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },

  settlementBadge: {
    padding: '7px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  moneyGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '15px',
  },

  moneyLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '6px',
  },

  moneyValue: {
    fontSize: '17px',
    color: '#166534',
  },

  commissionMoney: {
    fontSize: '17px',
    color: '#b45309',
  },

  settlementMoney: {
    fontSize: '18px',
    color: '#047857',
  },

  paidDate: {
    marginTop: '15px',
    paddingTop: '12px',
    borderTop:
      '1px solid #bbf7d0',
    fontSize: '12px',
    color: '#047857',
  },

  // ------------------------------------------------
  // CUSTOMER
  // ------------------------------------------------

  customerSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginTop: '20px',
  },

  customerHeading: {
    margin: '0 0 15px',
    fontSize: '17px',
    color: '#1f2937',
  },

  customerGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '15px',
  },

  addressBox: {
    marginTop: '15px',
    padding: '13px',
    background: '#f9fafb',
    borderRadius: '8px',
  },

  // ------------------------------------------------
  // ACTION
  // ------------------------------------------------

  actionSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginTop: '20px',
  },

  actionButton: {
    width: '100%',
    padding: '13px',
    border: 'none',
    borderRadius: '9px',
    background: '#2e7d32',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  completed: {
    padding: '13px',
    textAlign: 'center',
    borderRadius: '9px',
    background: '#e8f5e9',
    color: '#2e7d32',
    fontWeight: 'bold',
  },

  noAction: {
    padding: '13px',
    textAlign: 'center',
    borderRadius: '9px',
    background: '#f3f4f6',
    color: '#6b7280',
    fontWeight: '600',
  },

  // ------------------------------------------------
  // FOOTER
  // ------------------------------------------------

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginTop: '20px',
  },
}