'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Please login to view your orders.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          price,
          quantity,
          unit,
          item_total
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('ORDERS LOAD ERROR:', error)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setOrders(data || [])
    setLoading(false)
  }

  function getStatusText(status) {
    if (status === 'pending') return 'Order Pending'
    if (status === 'confirmed') return 'Order Confirmed'
    if (status === 'shipped') return 'Shipped'
    if (status === 'delivered') return 'Delivered'
    if (status === 'completed') return 'Completed'

    return status
  }

  function getStatusColor(status) {
    if (status === 'pending') return '#856404'
    if (status === 'confirmed') return '#004085'
    if (status === 'shipped') return '#155724'
    if (status === 'delivered') return '#155724'
    if (status === 'completed') return '#155724'

    return '#555'
  }

  function getStatusBackground(status) {
    if (status === 'pending') return '#fff3cd'
    if (status === 'confirmed') return '#cce5ff'
    if (status === 'shipped') return '#d4edda'
    if (status === 'delivered') return '#d4edda'
    if (status === 'completed') return '#d4edda'

    return '#eee'
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <h1>My Orders</h1>
        <p>Loading your orders...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Orders</h1>
            <p style={styles.subtitle}>
              Track your orders and payment status
            </p>
          </div>

          <button
            onClick={loadOrders}
            style={styles.refreshButton}
          >
            ↻ Refresh
          </button>
        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {orders.length === 0 && !message && (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📦</div>
            <h2>No orders yet</h2>
            <p>
              Your placed orders will appear here.
            </p>

            <a
              href="/"
              style={styles.shopButton}
            >
              Continue Shopping
            </a>
          </div>
        )}

        <div style={styles.ordersList}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={styles.orderCard}
            >

              <div style={styles.orderHeader}>

                <div>
                  <p style={styles.orderLabel}>
                    Order ID
                  </p>

                  <p style={styles.orderId}>
                    {order.id}
                  </p>

                  <p style={styles.date}>
                    {new Date(
                      order.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <div style={styles.statusArea}>

                  <span
                    style={{
                      ...styles.statusBadge,
                      color: getStatusColor(
                        order.order_status
                      ),
                      background:
                        getStatusBackground(
                          order.order_status
                        ),
                    }}
                  >
                    {getStatusText(
                      order.order_status
                    )}
                  </span>

                  <span
                    style={{
                      ...styles.paymentBadge,
                      background:
                        order.payment_status === 'paid'
                          ? '#d4edda'
                          : '#fff3cd',
                      color:
                        order.payment_status === 'paid'
                          ? '#155724'
                          : '#856404',
                    }}
                  >
                    {order.payment_status === 'paid'
                      ? '✓ Payment Verified'
                      : 'Payment Pending'}
                  </span>

                </div>

              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  Products
                </h3>

                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    style={styles.productRow}
                  >

                    <div style={styles.productInfo}>
                      <strong>
                        {item.product_name}
                      </strong>

                      <span style={styles.productMeta}>
                        ₹{Number(item.price).toFixed(2)}
                        {' × '}
                        {item.quantity} {item.unit}
                      </span>
                    </div>

                    <strong>
                      ₹{Number(item.item_total).toFixed(2)}
                    </strong>

                  </div>
                ))}
              </div>

              <div style={styles.totalRow}>
                <span>Total Amount</span>

                <strong>
                  ₹{Number(
                    order.total_amount
                  ).toFixed(2)}
                </strong>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  Delivery Details
                </h3>

                <div style={styles.deliveryBox}>
                  <p>
                    <strong>Name:</strong>{' '}
                    {order.customer_name}
                  </p>

                  <p>
                    <strong>Phone:</strong>{' '}
                    {order.customer_phone}
                  </p>

                  <p>
                    <strong>Address:</strong>{' '}
                    {order.delivery_address}
                  </p>

                  <p>
                    <strong>District:</strong>{' '}
                    {order.district}
                  </p>

                  <p>
                    <strong>Village:</strong>{' '}
                    {order.village}
                  </p>
                </div>
              </div>

              <div style={styles.timeline}>

                <div
                  style={{
                    ...styles.timelineItem,
                    opacity:
                      order.order_status === 'pending'
                        ? 1
                        : 0.55,
                  }}
                >
                  <span>1</span>
                  <p>Order Placed</p>
                </div>

                <div
                  style={{
                    ...styles.timelineLine,
                  }}
                />

                <div
                  style={{
                    ...styles.timelineItem,
                    opacity:
                      ['confirmed', 'shipped', 'delivered', 'completed']
                        .includes(order.order_status)
                        ? 1
                        : 0.4,
                  }}
                >
                  <span>2</span>
                  <p>Confirmed</p>
                </div>

                <div style={styles.timelineLine} />

                <div
                  style={{
                    ...styles.timelineItem,
                    opacity:
                      ['shipped', 'delivered', 'completed']
                        .includes(order.order_status)
                        ? 1
                        : 0.4,
                  }}
                >
                  <span>3</span>
                  <p>Shipped</p>
                </div>

                <div style={styles.timelineLine} />

                <div
                  style={{
                    ...styles.timelineItem,
                    opacity:
                      ['delivered', 'completed']
                        .includes(order.order_status)
                        ? 1
                        : 0.4,
                  }}
                >
                  <span>4</span>
                  <p>Delivered</p>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f6f7f9',
    padding: '40px 20px',
  },

  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
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

  refreshButton: {
    padding: '10px 18px',
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  message: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },

  emptyBox: {
    background: '#fff',
    padding: '60px 20px',
    textAlign: 'center',
    borderRadius: '12px',
  },

  emptyIcon: {
    fontSize: '50px',
  },

  shopButton: {
    display: 'inline-block',
    marginTop: '15px',
    padding: '12px 20px',
    background: '#198754',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
  },

  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },

  orderCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '20px',
  },

  orderLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#777',
  },

  orderId: {
    margin: '5px 0',
    fontSize: '13px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },

  date: {
    margin: 0,
    color: '#777',
    fontSize: '13px',
  },

  statusArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end',
  },

  statusBadge: {
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },

  paymentBadge: {
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },

  section: {
    marginTop: '20px',
  },

  sectionTitle: {
    fontSize: '16px',
    marginBottom: '12px',
  },

  productRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    padding: '12px 0',
    borderBottom: '1px solid #f1f1f1',
  },

  productInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  productMeta: {
    fontSize: '13px',
    color: '#666',
  },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '20px',
    marginTop: '10px',
    borderTop: '2px solid #eee',
    fontSize: '18px',
  },

  deliveryBox: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
  },

  timeline: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '25px',
    overflowX: 'auto',
    paddingBottom: '5px',
  },

  timelineItem: {
    minWidth: '90px',
    textAlign: 'center',
  },

  timelineLine: {
    height: '2px',
    minWidth: '30px',
    background: '#ddd',
  },
}