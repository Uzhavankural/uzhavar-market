'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function FarmerOrders() {
  const router = useRouter()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

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

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

      if (profileError || !profile) {
        setMessage('Farmer profile not found.')
        setLoading(false)
        return
      }

      if (profile.role !== 'farmer') {
        setMessage('Only farmers can access this page.')
        setLoading(false)
        return
      }

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
        console.error('ORDERS ERROR:', ordersError)
        setMessage('Unable to load order details.')
        setLoading(false)
        return
      }

      const combinedOrders = orderItems.map((item) => {
        const order = orderDetails?.find(
          (order) => order.id === item.order_id
        )

        return {
          ...item,
          order,
        }
      })

      setOrders(combinedOrders)
    } catch (error) {
      console.error('FARMER ORDERS ERROR:', error)
      setMessage('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    setUpdating(orderId)
    setMessage('')

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
        })
        .eq('id', orderId)

      if (error) {
        console.error('STATUS UPDATE ERROR:', error)
        setMessage('Unable to update order status.')
        return
      }

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
                order_status: newStatus,
              },
            }
          }

          return item
        })
      )
    } catch (error) {
      console.error('UPDATE ERROR:', error)
      setMessage('Something went wrong.')
    } finally {
      setUpdating(null)
    }
  }

  function getNextAction(status) {
  const currentStatus = String(status || '')
    .trim()
    .toLowerCase()

  if (currentStatus === 'pending') {
    return {
      text: 'Confirm Order',
      nextStatus: 'confirmed',
    }
  }

  if (currentStatus === 'confirmed') {
    return {
      text: 'Mark as Shipped',
      nextStatus: 'shipped',
    }
  }

  if (currentStatus === 'shipped') {
    return {
      text: 'Mark as Delivered',
      nextStatus: 'delivered',
    }
  }

  return null
}

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <button
          onClick={() => router.push('/farmer')}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              My Orders
            </h1>

            <p style={styles.subtitle}>
              Orders received for your products
            </p>
          </div>

          <button
            onClick={loadOrders}
            style={styles.refreshButton}
          >
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div style={styles.message}>
            Loading orders...
          </div>
        )}

        {!loading && message && (
          <div style={styles.error}>
            {message}
          </div>
        )}

        {!loading &&
          !message &&
          orders.length === 0 && (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>
                📦
              </div>

              <h2>
                No Orders Yet
              </h2>

              <p>
                Orders for your products will
                appear here.
              </p>
            </div>
          )}

        {!loading &&
          !message &&
          orders.length > 0 && (
            <div style={styles.ordersList}>

              {orders.map((item) => {
                const order = item.order

                if (!order) {
                  return null
                }

                const nextAction =
                  getNextAction(
                    order.order_status
                  )

                return (
                  <div
                    key={item.id}
                    style={styles.orderCard}
                  >

                    {/* Order Header */}
                    <div style={styles.orderHeader}>

                      <div>
                        <h2 style={styles.productName}>
                          {item.product_name}
                        </h2>

                        <p style={styles.orderId}>
                          Order ID: {item.order_id}
                        </p>
                      </div>

                      <div style={styles.statusBox}>
                        <span style={styles.statusLabel}>
                          {order.order_status}
                        </span>
                      </div>

                    </div>

                    {/* Product Details */}
                    <div style={styles.productDetails}>

                      <div>
                        <span style={styles.detailLabel}>
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
                        <span style={styles.detailLabel}>
                          Quantity
                        </span>

                        <strong>
                          {item.quantity}{' '}
                          {item.unit}
                        </strong>
                      </div>

                      <div>
                        <span style={styles.detailLabel}>
                          Item Total
                        </span>

                        <strong>
                          ₹
                          {Number(
                            item.item_total
                          ).toFixed(2)}
                        </strong>
                      </div>

                    </div>

                    {/* Customer Details */}
                    <div style={styles.customerSection}>

                      <h3 style={styles.customerHeading}>
                        Customer Details
                      </h3>

                      <p style={styles.customerText}>
                        <strong>Name:</strong>{' '}
                        {order.customer_name}
                      </p>

                      <p style={styles.customerText}>
                        <strong>Phone:</strong>{' '}
                        {order.customer_phone}
                      </p>

                      <p style={styles.customerText}>
                        <strong>Address:</strong>{' '}
                        {order.delivery_address}
                      </p>

                      <p style={styles.customerText}>
                        <strong>District:</strong>{' '}
                        {order.district}
                      </p>

                      <p style={styles.customerText}>
                        <strong>Village / Town:</strong>{' '}
                        {order.village}
                      </p>

                    </div>

                    {/* Order Actions */}
                    <div style={styles.actionSection}>

                      {nextAction ? (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              nextAction.nextStatus
                            )
                          }
                          disabled={
                            updating === order.id
                          }
                          style={{
                            ...styles.actionButton,
                            opacity:
                              updating === order.id
                                ? 0.7
                                : 1,
                          }}
                        >
                          {updating === order.id
                            ? 'Updating...'
                            : nextAction.text}
                        </button>
                      ) : (
                        <div style={styles.completed}>
                          ✓ Order Delivered
                        </div>
                      )}

                    </div>

                    {/* Payment & Date */}
                    <div style={styles.footer}>

                      <div>
                        <span style={styles.detailLabel}>
                          Payment
                        </span>

                        <strong
                          style={{
                            textTransform:
                              'capitalize',
                          }}
                        >
                          {order.payment_status}
                        </strong>
                      </div>

                      <div>
                        <span style={styles.detailLabel}>
                          Order Date
                        </span>

                        <strong>
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
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

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7f5',
    padding: '40px 20px',
  },

  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },

  backButton: {
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },

  title: {
    fontSize: '36px',
    margin: '0 0 8px',
  },

  subtitle: {
    margin: 0,
    color: '#666',
  },

  refreshButton: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#2e7d32',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  message: {
    background: '#fff',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
  },

  error: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    color: '#c62828',
  },

  emptyCard: {
    background: '#fff',
    padding: '60px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.08)',
  },

  emptyIcon: {
    fontSize: '50px',
    marginBottom: '15px',
  },

  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  orderCard: {
    background: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.08)',
  },

  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee',
  },

  productName: {
    margin: '0 0 8px',
    fontSize: '22px',
  },

  orderId: {
    margin: 0,
    color: '#777',
    fontSize: '13px',
    wordBreak: 'break-all',
  },

  statusBox: {
    flexShrink: 0,
  },

  statusLabel: {
    display: 'inline-block',
    padding: '7px 12px',
    borderRadius: '20px',
    background: '#fff3cd',
    color: '#856404',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  productDetails: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, 1fr)',
    gap: '20px',
    padding: '20px 0',
  },

  detailLabel: {
    display: 'block',
    color: '#777',
    fontSize: '13px',
    marginBottom: '5px',
  },

  customerSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  },

  customerHeading: {
    marginTop: 0,
    marginBottom: '15px',
  },

  customerText: {
    margin: '8px 0',
  },

  actionSection: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginTop: '20px',
  },

  actionButton: {
    width: '100%',
    padding: '13px',
    border: 'none',
    borderRadius: '8px',
    background: '#2e7d32',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  completed: {
    padding: '13px',
    textAlign: 'center',
    borderRadius: '8px',
    background: '#e8f5e9',
    color: '#2e7d32',
    fontWeight: 'bold',
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginTop: '20px',
  },
}