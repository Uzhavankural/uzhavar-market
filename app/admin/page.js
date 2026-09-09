'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState({})
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [message, setMessage] = useState('')
  const [productMessage, setProductMessage] = useState('')

  const [orderSearch, setOrderSearch] = useState('')
  const [commissionValues, setCommissionValues] = useState({})

  useEffect(() => {
    checkAdmin()
  }, [])

  // =====================================================
  // ADMIN CHECK
  // =====================================================

  async function checkAdmin() {
    setLoading(true)
    setAccessDenied(false)
    setMessage('')

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log('AUTH ERROR:', authError)
      setMessage(authError.message || 'Authentication failed.')
      setLoading(false)
      return
    }

    if (!user) {
      router.replace('/login')
      return
    }

    setUser(user)

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      console.log('PROFILE ERROR:', profileError)
      setMessage(
        profileError?.message || 'Profile not found.'
      )
      setLoading(false)
      return
    }

    if (profileData.role !== 'admin') {
      setProfile(profileData)
      setAccessDenied(true)
      setLoading(false)
      return
    }

    setProfile(profileData)

    await Promise.all([
      loadOrders(),
      loadProducts(),
    ])

    setLoading(false)
  }

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  async function loadOrders() {
    setMessage('')

    const {
      data: ordersData,
      error: ordersError,
    } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (ordersError) {
      console.log('ORDERS ERROR:', ordersError)

      setMessage(
        ordersError.message ||
          'Failed to load orders.'
      )

      return
    }

    const allOrders = ordersData || []

    setOrders(allOrders)

    if (allOrders.length === 0) {
      setOrderItems({})
      return
    }

    const orderIds = allOrders.map(
      (order) => order.id
    )

    // ===================================================
    // LOAD ORDER ITEMS
    // ===================================================

    const {
      data: itemsData,
      error: itemsError,
    } = await supabase
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
        settlement_status,
        settlement_amount,
        settlement_paid_at,
        commission_amount,
        farmer_price
      `)
      .in('order_id', orderIds)

    if (itemsError) {
      console.log(
        'ORDER ITEMS ERROR:',
        itemsError
      )

      setMessage(
        itemsError.message ||
          'Failed to load order items.'
      )

      return
    }

    const items = itemsData || []

    // ===================================================
    // FARMER IDS
    // ===================================================

    const farmerIds = [
      ...new Set(
        items
          .map((item) => item.farmer_id)
          .filter(Boolean)
      ),
    ]

    let farmerMap = {}

    if (farmerIds.length > 0) {
      const {
        data: farmersData,
        error: farmersError,
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, farm_name'
        )
        .in('id', farmerIds)

      if (farmersError) {
        console.log(
          'FARMER PROFILES ERROR:',
          farmersError
        )

        setMessage(
          farmersError.message ||
            'Failed to load farmer profiles.'
        )

        return
      }

      ;(farmersData || []).forEach(
        (farmer) => {
          farmerMap[farmer.id] = farmer
        }
      )
    }

    // ===================================================
    // GROUP ORDER ITEMS
    // ===================================================

    const groupedItems = {}

    items.forEach((item) => {
      const farmer =
        farmerMap[item.farmer_id]

      const itemWithFarmer = {
        ...item,

        farmer_name:
          farmer?.full_name ||
          'Unknown Farmer',

        farm_name:
          farmer?.farm_name || '',
      }

      if (!groupedItems[item.order_id]) {
        groupedItems[item.order_id] = []
      }

      groupedItems[item.order_id].push(
        itemWithFarmer
      )
    })

    setOrderItems(groupedItems)
  }

  // =====================================================
  // COMMISSION CALCULATION
  // Commission is PER UNIT
  // =====================================================

  function getCommissionTotal(item) {
    const commissionPerUnit =
      Number(
        item.commission_amount || 0
      )

    const quantity =
      Number(item.quantity || 0)

    return commissionPerUnit * quantity
  }

  // =====================================================
  // FARMER SETTLEMENT CALCULATION
  // =====================================================

  function getFarmerSettlementTotal(item) {
    const farmerPrice =
      Number(
        item.farmer_price || 0
      )

    const quantity =
      Number(item.quantity || 0)

    return farmerPrice * quantity
  }

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  async function loadProducts() {
    setProductMessage('')

    const {
      data,
      error,
    } = await supabase
      .from('products')
      .select(`
        *,
        profiles (
          full_name,
          farm_name
        ),
        categories (
          name
        )
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.log(
        'PRODUCTS ERROR:',
        error
      )

      setProductMessage(
        error.message ||
          'Failed to load products.'
      )

      return
    }

    setProducts(data || [])
  }

  // =====================================================
  // COMMISSION INPUT
  // =====================================================

  function handleCommissionChange(
    productId,
    value
  ) {
    setCommissionValues(
      (current) => ({
        ...current,
        [productId]: value,
      })
    )
  }

  // =====================================================
  // APPROVE PRODUCT
  // =====================================================

  async function approveProduct(product) {
    const commissionValue =
      commissionValues[product.id]

    if (
      commissionValue === undefined ||
      commissionValue === ''
    ) {
      setProductMessage(
        'Please enter a commission before approving the product.'
      )
      return
    }

    const commission =
      Number(commissionValue)

    if (
      !Number.isFinite(commission) ||
      commission < 0
    ) {
      setProductMessage(
        'Please enter a valid commission amount.'
      )
      return
    }

    const farmerPrice =
      Number(product.price || 0)

    const customerPrice =
      farmerPrice + commission

    const confirmed =
      window.confirm(
        `Approve "${product.name}"?\n\n` +
        `Farmer Price: ₹${farmerPrice.toFixed(2)} / ${product.unit}\n` +
        `Commission: ₹${commission.toFixed(2)} / ${product.unit}\n` +
        `Customer Price: ₹${customerPrice.toFixed(2)} / ${product.unit}`
      )

    if (!confirmed) {
      return
    }

    setProductMessage(
      'Approving product...'
    )

    const {
      error,
    } = await supabase
      .from('products')
      .update({
        commission_amount:
          commission,
        approval_status:
          'active',
        status:
          'active',
      })
      .eq('id', product.id)

    if (error) {
      console.log(
        'APPROVE PRODUCT ERROR:',
        error
      )

      setProductMessage(
        error.message ||
          'Failed to approve product.'
      )

      return
    }

    setProducts(
      (currentProducts) =>
        currentProducts.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  commission_amount:
                    commission,
                  approval_status:
                    'active',
                  status:
                    'active',
                }
              : item
        )
    )

    setCommissionValues(
      (current) => {
        const updated = {
          ...current,
        }

        delete updated[product.id]

        return updated
      }
    )

    setProductMessage(
      'Product approved successfully.'
    )
  }

  // =====================================================
  // REJECT PRODUCT
  // =====================================================

  async function rejectProduct(product) {
    const confirmed =
      window.confirm(
        `Reject "${product.name}"?`
      )

    if (!confirmed) {
      return
    }

    setProductMessage(
      'Rejecting product...'
    )

    const {
      error,
    } = await supabase
      .from('products')
      .update({
        approval_status:
          'rejected',
        status:
          'inactive',
      })
      .eq('id', product.id)

    if (error) {
      console.log(
        'REJECT PRODUCT ERROR:',
        error
      )

      setProductMessage(
        error.message ||
          'Failed to reject product.'
      )

      return
    }

    setProducts(
      (currentProducts) =>
        currentProducts.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  approval_status:
                    'rejected',
                  status:
                    'inactive',
                }
              : item
        )
    )

    setProductMessage(
      'Product rejected successfully.'
    )
  }

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  async function deleteProduct(product) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.name}"?`
      )

    if (!confirmed) {
      return
    }

    setProductMessage(
      'Checking product orders...'
    )

    // ---------------------------------------------------
    // CHECK EXISTING ORDERS
    // ---------------------------------------------------

    const {
      data: orderItemsCheck,
      error: orderCheckError,
    } = await supabase
      .from('order_items')
      .select('id')
      .eq(
        'product_id',
        product.id
      )
      .limit(1)

    if (orderCheckError) {
      console.log(
        'ORDER CHECK ERROR:',
        orderCheckError
      )

      setProductMessage(
        orderCheckError.message ||
          'Failed to check product orders.'
      )

      return
    }

    if (
      orderItemsCheck &&
      orderItemsCheck.length > 0
    ) {
      setProductMessage(
        'This product cannot be deleted because it already has an order.'
      )

      return
    }

    setProductMessage(
      'Deleting product...'
    )

    // ---------------------------------------------------
    // DELETE IMAGE
    // ---------------------------------------------------

    if (product.image_url) {
      try {
        const marker =
          '/product-images/'

        if (
          product.image_url.includes(
            marker
          )
        ) {
          const filePath =
            decodeURIComponent(
              product.image_url
                .split(marker)[1]
                .split('?')[0]
            )

          const {
            error: imageDeleteError,
          } = await supabase.storage
            .from(
              'product-images'
            )
            .remove([
              filePath,
            ])

          if (imageDeleteError) {
            console.log(
              'IMAGE DELETE ERROR:',
              imageDeleteError
            )
          }
        }
      } catch (imageError) {
        console.log(
          'IMAGE DELETE ERROR:',
          imageError
        )
      }
    }

    // ---------------------------------------------------
    // DELETE PRODUCT
    // ---------------------------------------------------

    const {
      error,
    } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      console.log(
        'DELETE PRODUCT ERROR:',
        error
      )

      setProductMessage(
        error.message ||
          'Failed to delete product.'
      )

      return
    }

    setProducts(
      (currentProducts) =>
        currentProducts.filter(
          (item) =>
            item.id !== product.id
        )
    )

    setProductMessage(
      'Product deleted successfully.'
    )
  }

  // =====================================================
  // ADMIN ORDER STATUS
  //
  // ADMIN CAN ONLY:
  // pending -> confirmed
  //
  // confirmed -> farmer ships
  // shipped -> customer confirms delivery
  // delivered -> completed
  // =====================================================

  async function updateOrderStatus(
    orderId,
    newStatus
  ) {
    setMessage('')

    const order =
      orders.find(
        (item) =>
          item.id === orderId
      )

    if (!order) {
      setMessage(
        'Order not found.'
      )
      return
    }

    // ---------------------------------------------------
    // ADMIN FLOW VALIDATION
    // ---------------------------------------------------

    if (
      order.order_status === 'pending' &&
      newStatus !== 'confirmed'
    ) {
      setMessage(
        'Admin can only confirm a pending order.'
      )
      return
    }

    if (
      order.order_status !== 'pending'
    ) {
      setMessage(
        'This order status is controlled by the next step in the marketplace flow.'
      )
      return
    }

    // ---------------------------------------------------
    // PAYMENT MUST BE PAID
    // ---------------------------------------------------

    if (
      order.payment_status !== 'paid'
    ) {
      setMessage(
        'Order cannot be confirmed until customer payment is verified.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Confirm Order #${order.id.slice(0, 8)}?\n\n` +
        `Customer: ${order.customer_name || 'Customer'}\n` +
        `Amount: ₹${Number(order.total_amount || 0).toFixed(2)}`
      )

    if (!confirmed) {
      return
    }

    setMessage(
      'Confirming order...'
    )

    const {
      error,
    } = await supabase
      .from('orders')
      .update({
        order_status:
          'confirmed',
      })
      .eq(
        'id',
        orderId
      )
      .eq(
        'order_status',
        'pending'
      )
      .eq(
        'payment_status',
        'paid'
      )

    if (error) {
      console.log(
        'ORDER STATUS UPDATE ERROR:',
        error
      )

      setMessage(
        error.message ||
          'Failed to confirm order.'
      )

      return
    }

    setOrders(
      (currentOrders) =>
        currentOrders.map(
          (currentOrder) =>
            currentOrder.id === orderId
              ? {
                  ...currentOrder,
                  order_status:
                    'confirmed',
                }
              : currentOrder
        )
    )

    setMessage(
      'Order confirmed successfully. Waiting for farmer to ship.'
    )
  }

  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  async function updatePaymentStatus(
    orderId,
    newStatus
  ) {
    setMessage('')

    const order =
      orders.find(
        (item) =>
          item.id === orderId
      )

    if (!order) {
      setMessage(
        'Order not found.'
      )
      return
    }

    if (
      order.payment_status === 'paid'
    ) {
      setMessage(
        'Payment is already verified.'
      )
      return
    }

    if (
      newStatus !== 'paid'
    ) {
      setMessage(
        'Invalid payment status.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Mark payment as PAID?\n\n` +
        `Order: #${order.id.slice(0, 8)}\n` +
        `Customer: ${order.customer_name || 'Customer'}\n` +
        `Amount: ₹${Number(order.total_amount || 0).toFixed(2)}`
      )

    if (!confirmed) {
      return
    }

    setMessage(
      'Verifying payment...'
    )

    const {
      error,
    } = await supabase
      .from('orders')
      .update({
        payment_status:
          'paid',
      })
      .eq(
        'id',
        orderId
      )
      .eq(
        'payment_status',
        'pending'
      )

    if (error) {
      console.log(
        'PAYMENT STATUS ERROR:',
        error
      )

      setMessage(
        error.message ||
          'Failed to update payment status.'
      )

      return
    }

    setOrders(
      (currentOrders) =>
        currentOrders.map(
          (currentOrder) =>
            currentOrder.id === orderId
              ? {
                  ...currentOrder,
                  payment_status:
                    'paid',
                }
              : currentOrder
        )
    )

    setMessage(
      'Payment verified successfully. Order can now be confirmed.'
    )
  }

  // =====================================================
  // FARMER SETTLEMENT
  //
  // ONLY:
  // order_status = delivered
  // payment_status = paid
  // settlement_status != paid
  // =====================================================

  async function settleFarmerItem(
    orderId,
    item
  ) {
    setMessage('')

    const order =
      orders.find(
        (currentOrder) =>
          currentOrder.id === orderId
      )

    if (!order) {
      setMessage(
        'Order not found.'
      )
      return
    }

    if (
      order.order_status !==
      'delivered'
    ) {
      setMessage(
        'Farmer settlement is available only after customer confirms delivery.'
      )
      return
    }

    if (
      order.payment_status !==
      'paid'
    ) {
      setMessage(
        'Farmer settlement is available only after customer payment is verified.'
      )
      return
    }

    if (
      item.settlement_status ===
      'paid'
    ) {
      setMessage(
        'This farmer settlement has already been paid.'
      )
      return
    }

    const farmerPrice =
      Number(
        item.farmer_price || 0
      )

    const quantity =
      Number(
        item.quantity || 0
      )

    const settlementAmount =
      farmerPrice * quantity

    if (
      !Number.isFinite(
        settlementAmount
      ) ||
      settlementAmount < 0
    ) {
      setMessage(
        'Invalid farmer settlement amount.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Pay farmer settlement?\n\n` +
        `Farmer: ${
          item.farmer_name ||
          'Unknown Farmer'
        }\n` +
        `Product: ${item.product_name}\n` +
        `Quantity: ${item.quantity} ${item.unit || ''}\n` +
        `Farmer Price: ₹${farmerPrice.toFixed(2)} / ${item.unit || ''}\n` +
        `Farmer Amount: ₹${settlementAmount.toFixed(2)}`
      )

    if (!confirmed) {
      return
    }

    setMessage(
      'Processing farmer settlement...'
    )

    const paidAt =
      new Date().toISOString()

    const {
      error,
    } = await supabase
      .from('order_items')
      .update({
        settlement_status:
          'paid',

        settlement_amount:
          settlementAmount,

        settlement_paid_at:
          paidAt,
      })
      .eq(
        'id',
        item.id
      )
      .neq(
        'settlement_status',
        'paid'
      )

    if (error) {
      console.log(
        'FARMER SETTLEMENT ERROR:',
        error
      )

      setMessage(
        error.message ||
          'Failed to process farmer settlement.'
      )

      return
    }

    setOrderItems(
      (currentItems) => ({
        ...currentItems,

        [orderId]:
          (
            currentItems[
              orderId
            ] || []
          ).map(
            (currentItem) =>
              currentItem.id ===
              item.id
                ? {
                    ...currentItem,

                    settlement_status:
                      'paid',

                    settlement_amount:
                      settlementAmount,

                    settlement_paid_at:
                      paidAt,
                  }
                : currentItem
          ),
      })
    )

    setMessage(
      `Farmer settlement paid successfully: ₹${settlementAmount.toFixed(2)}`
    )
  }

  // =====================================================
  // NEXT ADMIN ORDER ACTION
  //
  // IMPORTANT:
  // Admin only confirms pending orders.
  // =====================================================

  function getNextOrderAction(
    order
  ) {
    if (
      order.order_status ===
      'pending'
    ) {
      if (
        order.payment_status !==
        'paid'
      ) {
        return {
          type: 'waiting',
          text:
            '🔒 Confirm Order — Payment Pending',
        }
      }

      return {
        type: 'action',
        text:
          '✓ Confirm Order',
        nextStatus:
          'confirmed',
      }
    }

    if (
      order.order_status ===
      'confirmed'
    ) {
      return {
        type: 'waiting',
        text:
          'Waiting for Farmer to Ship',
      }
    }

    if (
      order.order_status ===
      'shipped'
    ) {
      return {
        type: 'waiting',
        text:
          'Waiting for Customer Delivery Confirmation',
      }
    }

    if (
      order.order_status ===
      'delivered'
    ) {
      return {
        type: 'completed',
        text:
          '✓ Delivery Confirmed by Customer',
      }
    }

    return null
  }

  // =====================================================
  // GO TO ORDERS
  // =====================================================

  function goToOrders() {
    const section =
      document.getElementById(
        'all-orders-section'
      )

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    await supabase.auth.signOut()

    router.replace('/login')
  }

  // =====================================================
  // ORDER STATUS STYLE
  // =====================================================

  function getOrderStatusStyle(
    status
  ) {
    if (
      status === 'pending'
    ) {
      return {
        background: '#fff3cd',
        color: '#856404',
      }
    }

    if (
      status === 'confirmed'
    ) {
      return {
        background: '#d1ecf1',
        color: '#0c5460',
      }
    }

    if (
      status === 'shipped'
    ) {
      return {
        background: '#cce5ff',
        color: '#004085',
      }
    }

    if (
      status === 'delivered'
    ) {
      return {
        background: '#d4edda',
        color: '#155724',
      }
    }

    return {
      background: '#eee',
      color: '#333',
    }
  }

  // =====================================================
  // PAYMENT STATUS STYLE
  // =====================================================

  function getPaymentStatusStyle(
    status
  ) {
    if (
      status === 'paid'
    ) {
      return {
        background: '#d4edda',
        color: '#155724',
      }
    }

    return {
      background: '#fff3cd',
      color: '#856404',
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={styles.center}>
        Loading Admin Dashboard...
      </div>
    )
  }

  // =====================================================
  // ACCESS DENIED
  // =====================================================

  if (accessDenied) {
    const dashboardPath =
      profile?.role === 'farmer'
        ? '/farmer'
        : '/customer'

    const dashboardText =
      profile?.role === 'farmer'
        ? 'Go to Farmer Dashboard'
        : 'Go to Customer Dashboard'

    return (
      <div style={styles.center}>
        <h2>
          🚫 You don't have access to the Admin Panel.
        </h2>

        <p>
          This panel is available only for admin users.
        </p>

        <button
          onClick={() =>
            router.push(
              dashboardPath
            )
          }
          style={styles.backButton}
        >
          {dashboardText}
        </button>
      </div>
    )
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (message && !user) {
    return (
      <div style={styles.center}>
        <h2>{message}</h2>

        <button
          onClick={() =>
            router.push('/')
          }
          style={
            styles.backButton
          }
        >
          Go Home
        </button>
      </div>
    )
  }

  // =====================================================
  // ORDER SEARCH
  // =====================================================

  const normalizedSearch =
    orderSearch
      .trim()
      .toLowerCase()

  const filteredOrders =
    normalizedSearch === ''
      ? orders
      : orders.filter((order) => {
          const customerName =
            String(
              order.customer_name || ''
            ).toLowerCase()

          const customerPhone =
            String(
              order.customer_phone || ''
            ).toLowerCase()

          const orderId =
            String(
              order.id || ''
            ).toLowerCase()

          const shortOrderId =
            orderId.slice(0, 8)

          return (
            customerName.includes(
              normalizedSearch
            ) ||
            customerPhone.includes(
              normalizedSearch
            ) ||
            orderId.includes(
              normalizedSearch
            ) ||
            shortOrderId.includes(
              normalizedSearch
            )
          )
        })

  // =====================================================
  // ADMIN EARNINGS
  //
  // Commission counted only from PAID orders.
  // =====================================================

  let totalCommissionEarned = 0
  let totalFarmerSettlement = 0

  orders.forEach((order) => {
    if (
      order.payment_status !==
      'paid'
    ) {
      return
    }

    const items =
      orderItems[order.id] || []

    items.forEach((item) => {
      totalCommissionEarned +=
        getCommissionTotal(item)

      totalFarmerSettlement +=
        getFarmerSettlementTotal(item)
    })
  })

  // =====================================================
  // ORDER COUNTS
  // =====================================================

  const pendingOrders =
    orders.filter(
      (order) =>
        order.order_status ===
        'pending'
    ).length

  const confirmedOrders =
    orders.filter(
      (order) =>
        order.order_status ===
        'confirmed'
    ).length

  const shippedOrders =
    orders.filter(
      (order) =>
        order.order_status ===
        'shipped'
    ).length

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.order_status ===
        'delivered'
    ).length

  const pendingPayments =
    orders.filter(
      (order) =>
        order.payment_status !==
        'paid'
    ).length

  return (
    <main style={styles.page}>

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav style={styles.navbar}>

        <div>
          <h2 style={styles.logo}>
            Uzhavar Market
          </h2>

          <p style={styles.adminText}>
            Admin Dashboard
          </p>
        </div>

        <div style={styles.navActions}>

          <button
            onClick={() =>
              router.push('/')
            }
            style={
              styles.navButton
            }
          >
            Home
          </button>

          <button
            onClick={() =>
              router.push(
                '/admin/products'
              )
            }
            style={
              styles.manageProductsNavButton
            }
          >
            📦 Manage Products
          </button>

          <button
            onClick={
              handleLogout
            }
            style={
              styles.logoutButton
            }
          >
            Logout
          </button>

        </div>
      </nav>

      <section style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div style={styles.header}>

          <h1 style={styles.title}>
            Admin Dashboard
          </h1>

          <p style={styles.subtitle}>
            Welcome,{' '}
            {profile?.full_name ||
              'Admin'}
          </p>

        </div>

        {/* =================================================
            GLOBAL MESSAGE
        ================================================= */}

        {message && (
          <div
            style={
              styles.messageBox
            }
          >
            {message}
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Total Commission Earned
            </p>

            <h2 style={styles.statNumber}>
              ₹
              {totalCommissionEarned.toFixed(
                2
              )}
            </h2>

            <p
              style={
                styles.greenSmallText
              }
            >
              From paid orders
            </p>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Farmer Settlement
            </p>

            <h2 style={styles.statNumber}>
              ₹
              {totalFarmerSettlement.toFixed(
                2
              )}
            </h2>

            <p
              style={
                styles.graySmallText
              }
            >
              Farmer amount from paid orders
            </p>
          </div>

          <button
            onClick={
              goToOrders
            }
            style={{
              ...styles.statCard,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <p style={styles.statLabel}>
              Total Orders
            </p>

            <h2 style={styles.statNumber}>
              {orders.length}
            </h2>

            <p style={styles.statClickText}>
              Click to view orders →
            </p>
          </button>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Pending Orders
            </p>

            <h2 style={styles.statNumber}>
              {pendingOrders}
            </h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Confirmed
            </p>

            <h2 style={styles.statNumber}>
              {confirmedOrders}
            </h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Shipped
            </p>

            <h2 style={styles.statNumber}>
              {shippedOrders}
            </h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Delivered
            </p>

            <h2 style={styles.statNumber}>
              {deliveredOrders}
            </h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Payment Pending
            </p>

            <h2 style={styles.statNumber}>
              {pendingPayments}
            </h2>
          </div>

        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <section
          style={
            styles.productsSection
          }
        >

          <div style={styles.sectionHeader}>

            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                All Products
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Review and approve farmer products.
              </p>
            </div>

            <div
              style={
                styles.productHeaderActions
              }
            >

              <button
                onClick={() =>
                  router.push(
                    '/admin/products'
                  )
                }
                style={
                  styles.manageProductsButton
                }
              >
                📦 Manage Products
              </button>

              <button
                onClick={
                  loadProducts
                }
                style={
                  styles.refreshButton
                }
              >
                ↻ Refresh
              </button>

            </div>

          </div>

          {productMessage && (
            <div
              style={
                styles.productMessage
              }
            >
              {productMessage}
            </div>
          )}

          {products.length === 0 ? (
            <div style={styles.empty}>
              <h3>
                No products found
              </h3>

              <p>
                Farmer products will appear here.
              </p>
            </div>
          ) : (
            <div
              style={
                styles.productsGrid
              }
            >

              {products.map(
                (product) => {

                  const inputCommission =
                    commissionValues[
                      product.id
                    ]

                  const currentCommission =
                    Number(
                      product.commission_amount ||
                        0
                    )

                  const previewCommission =
                    inputCommission !==
                      undefined &&
                    inputCommission !== ''
                      ? Number(
                          inputCommission
                        )
                      : currentCommission

                  const farmerPrice =
                    Number(
                      product.price ||
                        0
                    )

                  const customerPrice =
                    farmerPrice +
                    (
                      Number.isFinite(
                        previewCommission
                      )
                        ? previewCommission
                        : 0
                    )

                  return (
                    <div
                      key={
                        product.id
                      }
                      style={
                        styles.productCard
                      }
                    >

                      {/* IMAGE */}

                      <div
                        style={
                          styles.productImageBox
                        }
                      >

                        {product.image_url ? (
                          <img
                            src={
                              product.image_url
                            }
                            alt={
                              product.name
                            }
                            style={
                              styles.productImage
                            }
                          />
                        ) : (
                          <div
                            style={
                              styles.noImage
                            }
                          >
                            🌱
                          </div>
                        )}

                      </div>

                      {/* CONTENT */}

                      <div
                        style={
                          styles.productContent
                        }
                      >

                        <h3
                          style={
                            styles.productName
                          }
                        >
                          {product.name}
                        </h3>

                        <p
                          style={
                            styles.productCategory
                          }
                        >
                          {product.categories
                            ?.name ||
                            'Other'}
                        </p>

                        <p
                          style={
                            styles.farmerName
                          }
                        >
                          👨‍🌾 Farmer:{' '}
                          {product.profiles
                            ?.full_name ||
                            'Unknown'}
                        </p>

                        {product.profiles
                          ?.farm_name && (
                          <p
                            style={
                              styles.farmName
                            }
                          >
                            🌾 Farm:{' '}
                            {
                              product.profiles
                                .farm_name
                            }
                          </p>
                        )}

                        {/* PRICE */}

                        <div
                          style={
                            styles.priceRow
                          }
                        >
                          <span>
                            Farmer Price
                          </span>

                          <strong>
                            ₹
                            {farmerPrice.toFixed(
                              2
                            )}
                            {' / '}
                            {product.unit}
                          </strong>
                        </div>

                        <div
                          style={
                            styles.priceRow
                          }
                        >
                          <span>
                            Commission
                          </span>

                          <strong>
                            ₹
                            {currentCommission.toFixed(
                              2
                            )}
                            {' / '}
                            {product.unit}
                          </strong>
                        </div>

                        <div
                          style={
                            styles.priceRow
                          }
                        >
                          <span>
                            Customer Price
                          </span>

                          <strong
                            style={
                              styles.customerPrice
                            }
                          >
                            ₹
                            {(
                              farmerPrice +
                              currentCommission
                            ).toFixed(
                              2
                            )}
                            {' / '}
                            {product.unit}
                          </strong>
                        </div>

                        {/* STATUS */}

                        <div
                          style={
                            styles.productStatusRow
                          }
                        >

                          <span
                            style={{
                              ...styles.approvalBadge,

                              ...(product.approval_status ===
                              'active'
                                ? styles.approved
                                : product.approval_status ===
                                  'rejected'
                                ? styles.rejected
                                : styles.pending),
                            }}
                          >
                            {
                              product.approval_status ||
                              'pending'
                            }
                          </span>

                          <span
                            style={
                              styles.stockText
                            }
                          >
                            Stock:{' '}
                            {
                              product.stock_quantity
                            }{' '}
                            {
                              product.unit
                            }
                          </span>

                        </div>

                        {/* PENDING APPROVAL */}

                        {product.approval_status ===
                          'pending' && (

                          <div
                            style={
                              styles.approvalBox
                            }
                          >

                            <label
                              style={
                                styles.commissionLabel
                              }
                            >
                              Set Commission
                              <span
                                style={
                                  styles.unitHint
                                }
                              >
                                {' '}
                                (per {product.unit})
                              </span>
                            </label>

                            <div
                              style={
                                styles.commissionInputRow
                              }
                            >

                              <span
                                style={
                                  styles.rupee
                                }
                              >
                                ₹
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  commissionValues[
                                    product.id
                                  ] ?? ''
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleCommissionChange(
                                    product.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Enter commission"
                                style={
                                  styles.commissionInput
                                }
                              />

                            </div>

                            <p
                              style={
                                styles.customerPricePreview
                              }
                            >
                              Customer Price:{' '}
                              <strong>
                                ₹
                                {customerPrice.toFixed(
                                  2
                                )}
                                {' / '}
                                {
                                  product.unit
                                }
                              </strong>
                            </p>

                            <div
                              style={
                                styles.approvalButtons
                              }
                            >

                              <button
                                onClick={() =>
                                  approveProduct(
                                    product
                                  )
                                }
                                style={
                                  styles.approveButton
                                }
                              >
                                ✓ Approve
                              </button>

                              <button
                                onClick={() =>
                                  rejectProduct(
                                    product
                                  )
                                }
                                style={
                                  styles.rejectButton
                                }
                              >
                                ✕ Reject
                              </button>

                            </div>

                          </div>
                        )}

                        {/* DELETE */}

                        <button
                          onClick={() =>
                            deleteProduct(
                              product
                            )
                          }
                          style={
                            styles.deleteButton
                          }
                        >
                          🗑️ Delete Product
                        </button>

                      </div>
                    </div>
                  )
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            ORDERS
        ================================================= */}

        <section
          id="all-orders-section"
          style={
            styles.ordersSection
          }
        >

          <div style={styles.sectionHeader}>

            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                All Orders
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Manage payment verification and order confirmation.
              </p>
            </div>

            <button
              onClick={
                loadOrders
              }
              style={
                styles.refreshButton
              }
            >
              ↻ Refresh
            </button>

          </div>

          {/* ORDER SEARCH */}

          <div
            style={
              styles.orderSearchBox
            }
          >

            <span
              style={
                styles.searchIcon
              }
            >
              🔎
            </span>

            <input
              type="text"
              value={
                orderSearch
              }
              onChange={(e) =>
                setOrderSearch(
                  e.target.value
                )
              }
              placeholder="Search customer name, phone or order ID..."
              style={
                styles.orderSearchInput
              }
            />

            {orderSearch && (
              <button
                onClick={() =>
                  setOrderSearch('')
                }
                style={
                  styles.clearSearchButton
                }
              >
                ✕
              </button>
            )}

          </div>

          {orders.length === 0 ? (
            <div style={styles.empty}>

              <h3>
                No orders yet
              </h3>

              <p>
                Customer orders will appear here.
              </p>

            </div>
          ) : filteredOrders.length === 0 ? (

            <div style={styles.empty}>

              <h3>
                No matching orders
              </h3>

              <p>
                Try another customer name, phone number or order ID.
              </p>

            </div>

          ) : (

            <div
              style={
                styles.ordersList
              }
            >

              {filteredOrders.map(
                (order) => {

                  const nextAction =
                    getNextOrderAction(
                      order
                    )

                  const items =
                    orderItems[
                      order.id
                    ] || []

                  return (
                    <div
                      key={
                        order.id
                      }
                      style={
                        styles.orderCard
                      }
                    >

                      {/* ORDER TOP */}

                      <div
                        style={
                          styles.orderTop
                        }
                      >

                        <div>

                          <h3
                            style={
                              styles.orderId
                            }
                          >
                            Order #
                            {order.id.slice(
                              0,
                              8
                            )}
                          </h3>

                          <p
                            style={
                              styles.date
                            }
                          >
                            {new Date(
                              order.created_at
                            ).toLocaleString()}
                          </p>

                        </div>

                        <div
                          style={
                            styles.badges
                          }
                        >

                          <span
                            style={{
                              ...styles.badge,
                              ...getOrderStatusStyle(
                                order.order_status
                              ),
                            }}
                          >
                            {
                              order.order_status
                            }
                          </span>

                          <span
                            style={{
                              ...styles.badge,
                              ...getPaymentStatusStyle(
                                order.payment_status
                              ),
                            }}
                          >
                            Payment:{' '}
                            {
                              order.payment_status
                            }
                          </span>

                        </div>

                      </div>

                      {/* CUSTOMER DETAILS */}

                      <div
                        style={
                          styles.detailsGrid
                        }
                      >

                        <div>

                          <h4
                            style={
                              styles.heading
                            }
                          >
                            Customer
                          </h4>

                          <p
                            style={
                              styles.text
                            }
                          >
                            {
                              order.customer_name ||
                              'Not available'
                            }
                          </p>

                          <p
                            style={
                              styles.text
                            }
                          >
                            {
                              order.customer_phone ||
                              'Not available'
                            }
                          </p>

                        </div>

                        <div>

                          <h4
                            style={
                              styles.heading
                            }
                          >
                            Delivery
                          </h4>

                          <p
                            style={
                              styles.text
                            }
                          >
                            {
                              order.delivery_address ||
                              'Not available'
                            }
                          </p>

                          <p
                            style={
                              styles.text
                            }
                          >
                            {
                              order.village ||
                              ''
                            }
                            {order.village &&
                            order.district
                              ? ', '
                              : ''}
                            {
                              order.district ||
                              ''
                            }
                          </p>

                        </div>

                        <div>

                          <h4
                            style={
                              styles.heading
                            }
                          >
                            Order Total
                          </h4>

                          <p
                            style={
                              styles.total
                            }
                          >
                            ₹
                            {Number(
                              order.total_amount ||
                                0
                            ).toFixed(
                              2
                            )}
                          </p>

                        </div>

                      </div>

                      {/* ORDER ITEMS */}

                      <div
                        style={
                          styles.orderProductsSection
                        }
                      >

                        <h4
                          style={
                            styles.orderProductsTitle
                          }
                        >
                          🛒 Products Ordered
                        </h4>

                        {items.length === 0 ? (

                          <div
                            style={
                              styles.noOrderItems
                            }
                          >
                            Product details not found
                            for this order.
                          </div>

                        ) : (

                          <div
                            style={
                              styles.orderItemsList
                            }
                          >

                            {items.map(
                              (item) => {

                                const farmerPrice =
                                  Number(
                                    item.farmer_price ||
                                      0
                                  )

                                const quantity =
                                  Number(
                                    item.quantity ||
                                      0
                                  )

                                const customerPrice =
                                  Number(
                                    item.price ||
                                      0
                                  )

                                const itemTotal =
                                  Number(
                                    item.item_total ||
                                      customerPrice *
                                        quantity
                                  )

                                const commissionPerUnit =
                                  Number(
                                    item.commission_amount ||
                                      0
                                  )

                                const commissionTotal =
                                  getCommissionTotal(
                                    item
                                  )

                                const calculatedFarmerAmount =
                                  farmerPrice *
                                  quantity

                                const settlementAmount =
                                  item.settlement_amount !==
                                    null &&
                                  item.settlement_amount !==
                                    undefined
                                    ? Number(
                                        item.settlement_amount
                                      )
                                    : calculatedFarmerAmount

                                const isPaid =
                                  item.settlement_status ===
                                  'paid'

                                const canSettle =
                                  order.order_status ===
                                    'delivered' &&
                                  order.payment_status ===
                                    'paid' &&
                                  !isPaid

                                return (
                                  <div
                                    key={
                                      item.id
                                    }
                                    style={
                                      styles.orderItemCard
                                    }
                                  >

                                    {/* PRODUCT */}

                                    <div
                                      style={
                                        styles.orderItemMain
                                      }
                                    >

                                      <h4
                                        style={
                                          styles.orderItemName
                                        }
                                      >
                                        {
                                          item.product_name
                                        }
                                      </h4>

                                      <p
                                        style={
                                          styles.orderItemFarmer
                                        }
                                      >
                                        👨‍🌾 Farmer:{' '}
                                        {
                                          item.farmer_name
                                        }
                                      </p>

                                      {item.farm_name && (
                                        <p
                                          style={
                                            styles.orderItemFarm
                                          }
                                        >
                                          🌾 Farm:{' '}
                                          {
                                            item.farm_name
                                          }
                                        </p>
                                      )}

                                    </div>

                                    {/* ITEM INFO */}

                                    <div
                                      style={
                                        styles.orderItemInfo
                                      }
                                    >

                                      <div>
                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Quantity
                                        </span>

                                        <strong>
                                          {
                                            item.quantity
                                          }{' '}
                                          {
                                            item.unit
                                          }
                                        </strong>
                                      </div>

                                      <div>
                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Customer Price
                                        </span>

                                        <strong>
                                          ₹
                                          {customerPrice.toFixed(
                                            2
                                          )}
                                          {' / '}
                                          {
                                            item.unit
                                          }
                                        </strong>
                                      </div>

                                      <div>
                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Farmer Price
                                        </span>

                                        <strong>
                                          ₹
                                          {farmerPrice.toFixed(
                                            2
                                          )}
                                          {' / '}
                                          {
                                            item.unit
                                          }
                                        </strong>
                                      </div>

                                      <div>
                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Commission / Unit
                                        </span>

                                        <strong>
                                          ₹
                                          {commissionPerUnit.toFixed(
                                            2
                                          )}
                                          {' / '}
                                          {
                                            item.unit
                                          }
                                        </strong>
                                      </div>

                                      <div>
                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Total Commission
                                        </span>

                                        <strong
                                          style={
                                            styles.commissionTotal
                                          }
                                        >
                                          ₹
                                          {commissionTotal.toFixed(
                                            2
                                          )}
                                        </strong>
                                      </div>

                                      <div>
                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Item Total
                                        </span>

                                        <strong
                                          style={
                                            styles.itemTotal
                                          }
                                        >
                                          ₹
                                          {itemTotal.toFixed(
                                            2
                                          )}
                                        </strong>
                                      </div>

                                    </div>

                                    {/* SETTLEMENT */}

                                    <div
                                      style={
                                        styles.settlementBox
                                      }
                                    >

                                      <div
                                        style={
                                          styles.settlementHeader
                                        }
                                      >

                                        <span
                                          style={
                                            styles.settlementTitle
                                          }
                                        >
                                          💰 Farmer Settlement
                                        </span>

                                        <span
                                          style={{
                                            ...styles.settlementBadge,

                                            ...(isPaid
                                              ? styles.settlementPaid
                                              : styles.settlementPending),
                                          }}
                                        >
                                          {isPaid
                                            ? 'Paid'
                                            : 'Pending'}
                                        </span>

                                      </div>

                                      <div>

                                        <span
                                          style={
                                            styles.itemLabel
                                          }
                                        >
                                          Farmer Amount
                                        </span>

                                        <strong
                                          style={
                                            styles.settlementAmount
                                          }
                                        >
                                          ₹
                                          {settlementAmount.toFixed(
                                            2
                                          )}
                                        </strong>

                                      </div>

                                      {isPaid ? (

                                        <div
                                          style={
                                            styles.settlementPaidText
                                          }
                                        >
                                          ✓ Settlement Completed

                                          {item.settlement_paid_at && (
                                            <div
                                              style={
                                                styles.settlementDate
                                              }
                                            >
                                              Paid:{' '}
                                              {new Date(
                                                item.settlement_paid_at
                                              ).toLocaleString()}
                                            </div>
                                          )}
                                        </div>

                                      ) : canSettle ? (

                                        <button
                                          onClick={() =>
                                            settleFarmerItem(
                                              order.id,
                                              item
                                            )
                                          }
                                          style={
                                            styles.settlementButton
                                          }
                                        >
                                          ✓ Pay Farmer
                                        </button>

                                      ) : (

                                        <div
                                          style={
                                            styles.settlementWaitingText
                                          }
                                        >
                                          Settlement available after
                                          delivery confirmation and
                                          payment verification.
                                        </div>

                                      )}

                                    </div>

                                  </div>
                                )
                              }
                            )}

                          </div>
                        )}

                      </div>

                      {/* ADMIN ACTIONS */}

                      <div
                        style={
                          styles.orderActions
                        }
                      >

                        {/* ORDER STATUS */}

                        <div
                          style={
                            styles.orderActionBlock
                          }
                        >

                          <span
                            style={
                              styles.actionLabel
                            }
                          >
                            Order Status
                          </span>

                          {nextAction?.type ===
                            'action' ? (

                            <button
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  nextAction.nextStatus
                                )
                              }
                              style={
                                styles.orderActionButton
                              }
                            >
                              {
                                nextAction.text
                              }
                            </button>

                          ) : nextAction?.type ===
                            'waiting' ? (

                            <span
                              style={
                                styles.waitingStatus
                              }
                            >
                              {
                                nextAction.text
                              }
                            </span>

                          ) : nextAction?.type ===
                            'completed' ? (

                            <span
                              style={
                                styles.completedText
                              }
                            >
                              {
                                nextAction.text
                              }
                            </span>

                          ) : null}

                        </div>

                        {/* PAYMENT */}

                        <div
                          style={
                            styles.orderActionBlock
                          }
                        >

                          <span
                            style={
                              styles.actionLabel
                            }
                          >
                            Payment Verification
                          </span>

                          {order.payment_status ===
                          'pending' ? (

                            <button
                              onClick={() =>
                                updatePaymentStatus(
                                  order.id,
                                  'paid'
                                )
                              }
                              style={
                                styles.paymentButton
                              }
                            >
                              ✓ Mark as Paid
                            </button>

                          ) : (

                            <span
                              style={
                                styles.paymentVerifiedText
                              }
                            >
                              ✓ Payment Verified
                            </span>

                          )}

                        </div>

                      </div>

                      {/* FLOW INFORMATION */}

                      <div
                        style={
                          styles.flowInfoBox
                        }
                      >

                        <strong>
                          Order Flow:
                        </strong>

                        <span>
                          Payment →
                          Admin Confirmation →
                          Farmer Ships →
                          Customer Confirms Delivery →
                          Admin Pays Farmer
                        </span>

                      </div>

                    </div>
                  )
                }
              )}

            </div>
          )}

        </section>

      </section>
    </main>
  )
}

// =======================================================
// STYLES
// =======================================================

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7f5',
    fontFamily:
      'Arial, sans-serif',
  },

  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '20px',
    textAlign: 'center',
  },

  navbar: {
    background: '#ffffff',
    padding: '18px 6%',
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    borderBottom:
      '1px solid #e5e5e5',
    gap: '15px',
    flexWrap: 'wrap',
  },

  logo: {
    margin: 0,
    color: '#1f7a3f',
  },

  adminText: {
    margin: '4px 0 0',
    color: '#777',
    fontSize: '14px',
  },

  navActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  navButton: {
    padding: '10px 18px',
    border:
      '1px solid #ddd',
    background: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  manageProductsNavButton: {
    padding: '10px 18px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  logoutButton: {
    padding: '10px 18px',
    border: 'none',
    background: '#d9534f',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 5%',
  },

  header: {
    marginBottom: '25px',
  },

  title: {
    margin: 0,
    fontSize: '32px',
  },

  subtitle: {
    marginTop: '8px',
    color: '#666',
  },

  messageBox: {
    padding: '12px 15px',
    marginBottom: '25px',
    background: '#f0f7f2',
    color: '#1f7a3f',
    border:
      '1px solid #d7eadb',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },

  statCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border:
      '1px solid #e5e5e5',
  },

  statLabel: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },

  statNumber: {
    margin: '10px 0 0',
    fontSize: '30px',
  },

  statClickText: {
    margin: '8px 0 0',
    fontSize: '12px',
    color: '#1f7a3f',
    fontWeight: '600',
  },

  greenSmallText: {
    margin: '8px 0 0',
    fontSize: '12px',
    color: '#1f7a3f',
    fontWeight: '600',
  },

  graySmallText: {
    margin: '8px 0 0',
    fontSize: '12px',
    color: '#666',
  },

  productsSection: {
    background: '#fff',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '40px',
  },

  ordersSection: {
    background: '#fff',
    padding: '25px',
    borderRadius: '12px',
    scrollMarginTop: '20px',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '15px',
    flexWrap: 'wrap',
  },

  sectionTitle: {
    margin: 0,
  },

  sectionSubtitle: {
    margin: '6px 0 0',
    color: '#777',
    fontSize: '13px',
  },

  productHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },

  manageProductsButton: {
    padding: '9px 16px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  refreshButton: {
    padding: '9px 16px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
  },

  productMessage: {
    padding: '12px',
    marginBottom: '20px',
    background: '#f0f7f2',
    color: '#1f7a3f',
    borderRadius: '8px',
  },

  productsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },

  productCard: {
    border:
      '1px solid #e5e5e5',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fff',
  },

  productImageBox: {
    width: '100%',
    height: '200px',
    background: '#f3f4f3',
    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '50px',
  },

  productContent: {
    padding: '18px',
  },

  productName: {
    margin: '0 0 6px',
    fontSize: '20px',
  },

  productCategory: {
    margin: '0 0 12px',
    color: '#1f7a3f',
    fontSize: '13px',
  },

  farmerName: {
    margin: '0 0 5px',
    color: '#666',
    fontSize: '14px',
  },

  farmName: {
    margin: '0 0 15px',
    color: '#777',
    fontSize: '13px',
  },

  priceRow: {
    display: 'flex',
    justifyContent:
      'space-between',
    gap: '10px',
    padding: '7px 0',
    borderBottom:
      '1px solid #f0f0f0',
    fontSize: '14px',
  },

  customerPrice: {
    color: '#1f7a3f',
  },

  productStatusRow: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: '10px',
    marginTop: '14px',
  },

  approvalBadge: {
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform:
      'capitalize',
  },

  approved: {
    background: '#d4edda',
    color: '#155724',
  },

  pending: {
    background: '#fff3cd',
    color: '#856404',
  },

  rejected: {
    background: '#f8d7da',
    color: '#721c24',
  },

  stockText: {
    color: '#666',
    fontSize: '13px',
  },

  approvalBox: {
    marginTop: '15px',
    padding: '14px',
    background: '#f7faf7',
    border:
      '1px solid #dfe8df',
    borderRadius: '8px',
  },

  commissionLabel: {
    display: 'block',
    marginBottom: '7px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },

  unitHint: {
    color: '#777',
    fontWeight: '400',
  },

  commissionInputRow: {
    display: 'flex',
    alignItems: 'center',
    border:
      '1px solid #d1d5db',
    borderRadius: '7px',
    background: '#fff',
    overflow: 'hidden',
  },

  rupee: {
    padding: '9px',
    color: '#555',
    fontWeight: '600',
  },

  commissionInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: '9px',
    fontSize: '14px',
  },

  customerPricePreview: {
    margin: '10px 0',
    fontSize: '13px',
    color: '#1f7a3f',
  },

  approvalButtons: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: '8px',
  },

  approveButton: {
    padding: '10px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  rejectButton: {
    padding: '10px',
    border: 'none',
    background: '#d9534f',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  deleteButton: {
    width: '100%',
    marginTop: '16px',
    padding: '10px',
    border: 'none',
    background: '#d9534f',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  empty: {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#777',
  },

  // =====================================================
  // SEARCH
  // =====================================================

  orderSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    marginBottom: '22px',
    padding: '0 12px',
    border:
      '1px solid #d9ded9',
    borderRadius: '9px',
    background: '#fff',
    boxSizing: 'border-box',
  },

  searchIcon: {
    fontSize: '18px',
  },

  orderSearchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '12px 5px',
    fontSize: '14px',
    background: 'transparent',
    minWidth: '0',
  },

  clearSearchButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#777',
    fontSize: '16px',
    padding: '5px',
  },

  // =====================================================
  // ORDERS
  // =====================================================

  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },

  orderCard: {
    border:
      '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '20px',
  },

  orderTop: {
    display: 'flex',
    justifyContent:
      'space-between',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },

  orderId: {
    margin: 0,
  },

  date: {
    marginTop: '6px',
    color: '#777',
    fontSize: '13px',
  },

  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems:
      'flex-start',
  },

  badge: {
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform:
      'capitalize',
  },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },

  heading: {
    margin: '0 0 8px',
    fontSize: '14px',
  },

  text: {
    margin: '4px 0',
    color: '#555',
    wordBreak: 'break-word',
  },

  total: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
  },

  orderProductsSection: {
    marginTop: '22px',
    paddingTop: '20px',
    borderTop:
      '1px solid #e5e5e5',
  },

  orderProductsTitle: {
    margin: '0 0 14px',
    fontSize: '16px',
  },

  orderItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  orderItemCard: {
    display: 'flex',
    justifyContent:
      'space-between',
    gap: '20px',
    padding: '14px',
    background: '#f8faf8',
    border:
      '1px solid #e1e8e1',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },

  orderItemMain: {
    flex: 1,
    minWidth: '180px',
  },

  orderItemName: {
    margin: '0 0 6px',
    fontSize: '16px',
  },

  orderItemFarmer: {
    margin: '3px 0',
    color: '#555',
    fontSize: '14px',
  },

  orderItemFarm: {
    margin: '3px 0',
    color: '#777',
    fontSize: '13px',
  },

  orderItemInfo: {
    display: 'flex',
    gap: '25px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  itemLabel: {
    display: 'block',
    color: '#777',
    fontSize: '11px',
    marginBottom: '4px',
  },

  itemTotal: {
    color: '#1f7a3f',
  },

  commissionTotal: {
    color: '#6f42c1',
  },

  settlementBox: {
    minWidth: '250px',
    flex: '0 0 250px',
    padding: '12px',
    background: '#ffffff',
    border:
      '1px solid #dfe8df',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  settlementHeader: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: '10px',
  },

  settlementTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#374151',
  },

  settlementBadge: {
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },

  settlementPaid: {
    background: '#d4edda',
    color: '#155724',
  },

  settlementPending: {
    background: '#fff3cd',
    color: '#856404',
  },

  settlementAmount: {
    display: 'block',
    fontSize: '18px',
    color: '#1f7a3f',
    marginTop: '2px',
  },

  settlementButton: {
    width: '100%',
    padding: '10px',
    border: 'none',
    background: '#198754',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },

  settlementPaidText: {
    color: '#155724',
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: 1.4,
  },

  settlementDate: {
    marginTop: '4px',
    color: '#666',
    fontSize: '11px',
    fontWeight: '400',
  },

  settlementWaitingText: {
    color: '#777',
    fontSize: '11px',
    lineHeight: 1.4,
  },

  noOrderItems: {
    padding: '15px',
    background: '#fff3cd',
    color: '#856404',
    borderRadius: '8px',
    fontSize: '13px',
  },

  // =====================================================
  // ORDER ACTIONS
  // =====================================================

  orderActions: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop:
      '1px solid #f0f0f0',
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '15px',
  },

  orderActionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  actionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#777',
  },

  orderActionButton: {
    width: '100%',
    padding: '11px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },

  paymentButton: {
    width: '100%',
    padding: '11px',
    border: 'none',
    background: '#198754',
    color: '#fff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },

  waitingStatus: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '7px',
    fontWeight: '600',
    fontSize: '13px',
  },

  completedText: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: '7px',
    fontWeight: '600',
    fontSize: '13px',
  },

  paymentVerifiedText: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: '7px',
    fontWeight: '600',
  },

  flowInfoBox: {
    marginTop: '16px',
    padding: '11px 13px',
    background: '#f8fafc',
    border:
      '1px solid #e5e7eb',
    borderRadius: '7px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '11px',
    color: '#64748b',
    lineHeight: 1.5,
  },

  backButton: {
    padding: '10px 18px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
  },
}