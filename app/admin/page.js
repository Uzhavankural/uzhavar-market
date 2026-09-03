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

  const [message, setMessage] = useState('')
  const [productMessage, setProductMessage] = useState('')

  const [commissionValues, setCommissionValues] = useState({})

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    const { data: profileData, error: profileError } =
      await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profileData) {
      console.log('PROFILE ERROR:', profileError)
      setMessage('Profile not found.')
      setLoading(false)
      return
    }

    if (profileData.role !== 'admin') {
      setMessage('Access denied. Admin only.')
      setLoading(false)
      return
    }

    setProfile(profileData)

    await loadOrders()
    await loadProducts()

    setLoading(false)
  }

  async function loadOrders() {
    // 1. Load all orders
    const { data: ordersData, error: ordersError } =
      await supabase
        .from('orders')
        .select('*')
        .order('created_at', {
          ascending: false,
        })

    if (ordersError) {
      console.log('ORDERS ERROR:', ordersError)
      setMessage(ordersError.message)
      return
    }

    const allOrders = ordersData || []

    setOrders(allOrders)

    if (allOrders.length === 0) {
      setOrderItems({})
      return
    }

    // 2. Get all order IDs
    const orderIds = allOrders.map(
      (order) => order.id
    )

    // 3. Load order items
    const {
      data: itemsData,
      error: itemsError,
    } = await supabase
      .from('order_items')
      .select(
        `
          id,
          order_id,
          product_id,
          farmer_id,
          product_name,
          price,
          quantity,
          unit,
          item_total
        `
      )
      .in('order_id', orderIds)

    if (itemsError) {
      console.log(
        'ORDER ITEMS ERROR:',
        itemsError
      )
      setMessage(itemsError.message)
      return
    }

    const items = itemsData || []

    // 4. Get farmer IDs
    const farmerIds = [
      ...new Set(
        items
          .map((item) => item.farmer_id)
          .filter(Boolean)
      ),
    ]

    let farmerMap = {}

    // 5. Load farmer profiles
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
        setMessage(farmersError.message)
        return
      }

      ;(farmersData || []).forEach(
        (farmer) => {
          farmerMap[farmer.id] = farmer
        }
      )
    }

    // 6. Group order items by order
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
          farmer?.farm_name ||
          '',
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

  async function loadProducts() {
    const { data, error } = await supabase
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
      console.log('PRODUCTS ERROR:', error)
      setProductMessage(error.message)
      return
    }

    setProducts(data || [])
  }

  function handleCommissionChange(
    productId,
    value
  ) {
    setCommissionValues((current) => ({
      ...current,
      [productId]: value,
    }))
  }

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

    const commission = Number(
      commissionValue
    )

    if (
      !Number.isFinite(commission) ||
      commission < 0
    ) {
      setProductMessage(
        'Please enter a valid commission amount.'
      )
      return
    }

    const farmerPrice = Number(
      product.price
    )

    const customerPrice =
      farmerPrice + commission

    const confirmed = window.confirm(
      `Approve "${product.name}"?\n\n` +
        `Farmer Price: ₹${farmerPrice.toFixed(2)}\n` +
        `Commission: ₹${commission.toFixed(2)}\n` +
        `Customer Price: ₹${customerPrice.toFixed(2)}`
    )

    if (!confirmed) {
      return
    }

    setProductMessage(
      'Approving product...'
    )

    const { error } = await supabase
      .from('products')
      .update({
        commission_amount: commission,
        approval_status: 'active',
        status: 'active',
      })
      .eq('id', product.id)

    if (error) {
      console.log(
        'APPROVE PRODUCT ERROR:',
        error
      )
      setProductMessage(error.message)
      return
    }

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id
          ? {
              ...item,
              commission_amount: commission,
              approval_status: 'active',
              status: 'active',
            }
          : item
      )
    )

    setCommissionValues((current) => {
      const updated = { ...current }
      delete updated[product.id]
      return updated
    })

    setProductMessage(
      'Product approved successfully.'
    )
  }

  async function rejectProduct(product) {
    const confirmed = window.confirm(
      `Reject "${product.name}"?`
    )

    if (!confirmed) {
      return
    }

    setProductMessage(
      'Rejecting product...'
    )

    const { error } = await supabase
      .from('products')
      .update({
        approval_status: 'rejected',
        status: 'inactive',
      })
      .eq('id', product.id)

    if (error) {
      console.log(
        'REJECT PRODUCT ERROR:',
        error
      )
      setProductMessage(error.message)
      return
    }

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id
          ? {
              ...item,
              approval_status: 'rejected',
              status: 'inactive',
            }
          : item
      )
    )

    setProductMessage(
      'Product rejected successfully.'
    )
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    )

    if (!confirmed) {
      return
    }

    setProductMessage(
      'Deleting product...'
    )

    const {
      data: orderItemsCheck,
      error: orderCheckError,
    } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', product.id)
      .limit(1)

    if (orderCheckError) {
      console.log(
        'ORDER CHECK ERROR:',
        orderCheckError
      )
      setProductMessage(
        orderCheckError.message
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

    if (product.image_url) {
      try {
        const imageUrl =
          product.image_url

        const marker =
          '/product-images/'

        if (imageUrl.includes(marker)) {
          const filePath =
            decodeURIComponent(
              imageUrl
                .split(marker)[1]
                .split('?')[0]
            )

          await supabase.storage
            .from('product-images')
            .remove([filePath])
        }
      } catch (imageError) {
        console.log(
          'IMAGE DELETE ERROR:',
          imageError
        )
      }
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      console.log(
        'DELETE PRODUCT ERROR:',
        error
      )
      setProductMessage(error.message)
      return
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (item) =>
          item.id !== product.id
      )
    )

    setProductMessage(
      'Product deleted successfully.'
    )
  }

  async function updateOrderStatus(
    orderId,
    newStatus
  ) {
    setMessage('')

    const confirmed = window.confirm(
      `Change order status to "${newStatus}"?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: newStatus,
      })
      .eq('id', orderId)

    if (error) {
      console.log(
        'ORDER STATUS UPDATE ERROR:',
        error
      )
      setMessage(error.message)
      return
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              order_status: newStatus,
            }
          : order
      )
    )
  }

  // NEW: PAYMENT VERIFICATION
  async function updatePaymentStatus(
    orderId,
    newStatus
  ) {
    setMessage('')

    const confirmed = window.confirm(
      `Mark payment as "${newStatus}"?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: newStatus,
      })
      .eq('id', orderId)

    if (error) {
      console.log(
        'PAYMENT STATUS UPDATE ERROR:',
        error
      )
      setMessage(error.message)
      return
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              payment_status: newStatus,
            }
          : order
      )
    )
  }

  function getNextOrderAction(status) {
    if (status === 'pending') {
      return {
        text: 'Confirm Order',
        nextStatus: 'confirmed',
      }
    }

    if (status === 'confirmed') {
      return {
        text: 'Mark as Shipped',
        nextStatus: 'shipped',
      }
    }

    if (status === 'shipped') {
      return {
        text: 'Mark as Delivered',
        nextStatus: 'delivered',
      }
    }

    return null
  }

  function goToOrders() {
    const ordersSection =
      document.getElementById(
        'all-orders-section'
      )

    if (ordersSection) {
      ordersSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function getOrderStatusStyle(status) {
    if (status === 'pending') {
      return {
        background: '#fff3cd',
        color: '#856404',
      }
    }

    if (status === 'confirmed') {
      return {
        background: '#d1ecf1',
        color: '#0c5460',
      }
    }

    if (status === 'shipped') {
      return {
        background: '#cce5ff',
        color: '#004085',
      }
    }

    if (status === 'delivered') {
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

  function getPaymentStatusStyle(status) {
    if (status === 'paid') {
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

  if (loading) {
    return (
      <div style={styles.center}>
        Loading Admin Dashboard...
      </div>
    )
  }

  if (message) {
    return (
      <div style={styles.center}>
        <h2>{message}</h2>

        <button
          onClick={() => router.push('/')}
          style={styles.backButton}
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <main style={styles.page}>

      {/* NAVBAR */}

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
            onClick={() => router.push('/')}
            style={styles.navButton}
          >
            Home
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

        {/* HEADER */}

        <div style={styles.header}>

          <h1 style={styles.title}>
            Admin Dashboard
          </h1>

          <p style={styles.subtitle}>
            Welcome,{' '}
            {profile?.full_name || 'Admin'}
          </p>

        </div>

        {/* ORDER STATS */}

        <div style={styles.statsGrid}>

          <button
            onClick={goToOrders}
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
              {
                orders.filter(
                  (order) =>
                    order.order_status ===
                    'pending'
                ).length
              }
            </h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Confirmed
            </p>

            <h2 style={styles.statNumber}>
              {
                orders.filter(
                  (order) =>
                    order.order_status ===
                    'confirmed'
                ).length
              }
            </h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Delivered
            </p>

            <h2 style={styles.statNumber}>
              {
                orders.filter(
                  (order) =>
                    order.order_status ===
                    'delivered'
                ).length
              }
            </h2>
          </div>

        </div>

        {/* PRODUCTS */}

        <section style={styles.productsSection}>

          <div style={styles.sectionHeader}>

            <h2 style={styles.sectionTitle}>
              All Products
            </h2>

            <button
              onClick={loadProducts}
              style={styles.refreshButton}
            >
              Refresh
            </button>

          </div>

          {productMessage && (
            <div style={styles.productMessage}>
              {productMessage}
            </div>
          )}

          {products.length === 0 ? (

            <div style={styles.empty}>
              <h3>No products found</h3>

              <p>
                Farmer products will appear here.
              </p>
            </div>

          ) : (

            <div style={styles.productsGrid}>

              {products.map((product) => {

                const commission =
                  Number(
                    commissionValues[
                      product.id
                    ] || 0
                  )

                const customerPrice =
                  Number(product.price) +
                  commission

                return (
                  <div
                    key={product.id}
                    style={styles.productCard}
                  >

                    {/* IMAGE */}

                    <div
                      style={
                        styles.productImageBox
                      }
                    >

                      {product.image_url ? (

                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={
                            styles.productImage
                          }
                        />

                      ) : (

                        <div
                          style={styles.noImage}
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
                        {product.categories?.name ||
                          'Other'}
                      </p>

                      <p
                        style={
                          styles.farmerName
                        }
                      >
                        Farmer:{' '}
                        {product.profiles
                          ?.full_name ||
                          'Unknown'}
                      </p>

                      <div
                        style={styles.priceRow}
                      >
                        <span>
                          Farmer Price
                        </span>

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toFixed(2)}
                          {' / '}
                          {product.unit}
                        </strong>
                      </div>

                      <div
                        style={styles.priceRow}
                      >
                        <span>
                          Commission
                        </span>

                        <strong>
                          ₹
                          {Number(
                            product
                              .commission_amount ||
                              0
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div
                        style={styles.priceRow}
                      >
                        <span>
                          Customer Price
                        </span>

                        <strong>
                          ₹
                          {(
                            Number(
                              product.price
                            ) +
                            Number(
                              product
                                .commission_amount ||
                                0
                            )
                          ).toFixed(2)}
                          {' / '}
                          {product.unit}
                        </strong>
                      </div>

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
                          {product.approval_status}
                        </span>

                        <span
                          style={
                            styles.stockText
                          }
                        >
                          Stock:{' '}
                          {product.stock_quantity}{' '}
                          {product.unit}
                        </span>

                      </div>

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
                          </label>

                          <div
                            style={
                              styles.commissionInputRow
                            }
                          >

                            <span
                              style={styles.rupee}
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
                              onChange={(e) =>
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
                            Customer Price: ₹
                            {customerPrice.toFixed(
                              2
                            )}
                            {' / '}
                            {product.unit}
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

                      <button
                        onClick={() =>
                          deleteProduct(product)
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
              })}

            </div>

          )}

        </section>

        {/* ORDERS */}

        <section
          id="all-orders-section"
          style={styles.ordersSection}
        >

          <div style={styles.sectionHeader}>

            <h2 style={styles.sectionTitle}>
              All Orders
            </h2>

            <button
              onClick={loadOrders}
              style={styles.refreshButton}
            >
              Refresh
            </button>

          </div>

          {orders.length === 0 ? (

            <div style={styles.empty}>

              <h3>No orders yet</h3>

              <p>
                Customer orders will appear here.
              </p>

            </div>

          ) : (

            <div style={styles.ordersList}>

              {orders.map((order) => {

                const nextAction =
                  getNextOrderAction(
                    order.order_status
                  )

                const items =
                  orderItems[order.id] || []

                return (
                  <div
                    key={order.id}
                    style={styles.orderCard}
                  >

                    {/* ORDER TOP */}

                    <div
                      style={styles.orderTop}
                    >

                      <div>

                        <h3
                          style={
                            styles.orderId
                          }
                        >
                          Order #
                          {order.id.slice(0, 8)}
                        </h3>

                        <p
                          style={styles.date}
                        >
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
                        </p>

                      </div>

                      <div
                        style={styles.badges}
                      >

                        <span
                          style={{
                            ...styles.badge,
                            ...getOrderStatusStyle(
                              order.order_status
                            ),
                          }}
                        >
                          {order.order_status}
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
                          {order.payment_status}
                        </span>

                      </div>

                    </div>

                    {/* CUSTOMER + DELIVERY + TOTAL */}

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
                          style={styles.text}
                        >
                          {order.customer_name}
                        </p>

                        <p
                          style={styles.text}
                        >
                          {order.customer_phone}
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
                          style={styles.text}
                        >
                          {order.delivery_address}
                        </p>

                        <p
                          style={styles.text}
                        >
                          {order.village},{' '}
                          {order.district}
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
                          style={styles.total}
                        >
                          ₹
                          {Number(
                            order.total_amount
                          ).toFixed(2)}
                        </p>

                      </div>

                    </div>

                    {/* PRODUCTS IN THIS ORDER */}

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
                            (item) => (
                              <div
                                key={item.id}
                                style={
                                  styles.orderItemCard
                                }
                              >

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
                                    {item.product_name}
                                  </h4>

                                  <p
                                    style={
                                      styles.orderItemFarmer
                                    }
                                  >
                                    👨‍🌾 Farmer:{' '}
                                    {item.farmer_name}
                                  </p>

                                  {item.farm_name && (
                                    <p
                                      style={
                                        styles.orderItemFarm
                                      }
                                    >
                                      Farm:{' '}
                                      {item.farm_name}
                                    </p>
                                  )}

                                </div>

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
                                      {item.quantity}{' '}
                                      {item.unit}
                                    </strong>
                                  </div>

                                  <div>
                                    <span
                                      style={
                                        styles.itemLabel
                                      }
                                    >
                                      Price
                                    </span>

                                    <strong>
                                      ₹
                                      {Number(
                                        item.price
                                      ).toFixed(2)}
                                      {' / '}
                                      {item.unit}
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
                                      {Number(
                                        item.item_total
                                      ).toFixed(2)}
                                    </strong>
                                  </div>

                                </div>

                              </div>
                            )
                          )}

                        </div>

                      )}

                    </div>

                    {/* ADMIN ORDER ACTIONS */}

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

                        {nextAction ? (

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
                            {nextAction.text}
                          </button>

                        ) : order.order_status ===
                          'delivered' ? (

                          <span
                            style={
                              styles.completedText
                            }
                          >
                            ✓ Order Delivered
                          </span>

                        ) : null}

                      </div>

                      {/* PAYMENT STATUS */}

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

                  </div>
                )
              })}

            </div>

          )}

        </section>

      </section>

    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7f5',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e5e5',
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
  },

  navButton: {
    padding: '10px 18px',
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
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
    marginBottom: '30px',
  },

  title: {
    margin: 0,
    fontSize: '32px',
  },

  subtitle: {
    marginTop: '8px',
    color: '#666',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },

  statCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },

  statLabel: {
    margin: 0,
    color: '#666',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },

  sectionTitle: {
    margin: 0,
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
      'repeat(3, minmax(0, 1fr))',
    gap: '20px',
  },

  productCard: {
    border: '1px solid #e5e5e5',
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
    margin: '0 0 15px',
    color: '#666',
    fontSize: '14px',
  },

  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '7px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  },

  productStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginTop: '14px',
  },

  approvalBadge: {
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
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
    border: '1px solid #dfe8df',
    borderRadius: '8px',
  },

  commissionLabel: {
    display: 'block',
    marginBottom: '7px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },

  commissionInputRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
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
    fontWeight: '600',
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

  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },

  orderCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '20px',
  },

  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    marginBottom: '20px',
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
    alignItems: 'flex-start',
  },

  badge: {
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '20px',
  },

  heading: {
    margin: '0 0 8px',
    fontSize: '14px',
  },

  text: {
    margin: '4px 0',
    color: '#555',
  },

  total: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
  },

  /* ORDER PRODUCTS */

  orderProductsSection: {
    marginTop: '22px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e5e5',
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
    justifyContent: 'space-between',
    gap: '20px',
    padding: '14px',
    background: '#f8faf8',
    border: '1px solid #e1e8e1',
    borderRadius: '8px',
  },

  orderItemMain: {
    flex: 1,
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

  noOrderItems: {
    padding: '15px',
    background: '#fff3cd',
    color: '#856404',
    borderRadius: '8px',
    fontSize: '13px',
  },

  /* ADMIN ORDER ACTIONS */

  orderActions: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
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

  completedText: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: '7px',
    fontWeight: '600',
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

  backButton: {
    padding: '10px 18px',
    border: 'none',
    background: '#1f7a3f',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
  },
}