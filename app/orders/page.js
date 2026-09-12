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

  function getStatusColorClass(status) {
    if (status === 'pending') return 'text-[#856404] bg-[#fff3cd]'
    if (status === 'confirmed') return 'text-[#004085] bg-[#cce5ff]'
    if (status === 'shipped') return 'text-[#155724] bg-[#d4edda]'
    if (status === 'delivered') return 'text-[#155724] bg-[#d4edda]'
    if (status === 'completed') return 'text-[#155724] bg-[#d4edda]'

    return 'text-gray-700 bg-gray-200'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] py-8 px-4 sm:py-10 sm:px-6 font-sans">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">My Orders</h1>
        <p className="text-gray-600">Loading your orders...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] py-8 px-4 sm:py-10 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto w-full">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-1 text-gray-600 text-sm sm:text-base">
              Track your orders and payment status
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {message && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100">
            {message}
          </div>
        )}

        {orders.length === 0 && !message && (
          <div className="bg-white p-10 sm:p-16 text-center rounded-xl shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-4">
              Your placed orders will appear here.
            </p>

            <a
              href="/"
              className="inline-block mt-4 px-5 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100"
            >

              <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-gray-100 pb-5">

                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                    Order ID
                  </p>

                  <p className="text-sm font-mono text-gray-800 break-all mb-1">
                    {order.id}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(
                      order.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 sm:items-end flex-wrap">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(order.order_status)}`}
                  >
                    {getStatusText(
                      order.order_status
                    )}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.payment_status === 'paid'
                        ? 'bg-[#d4edda] text-[#155724]'
                        : 'bg-[#fff3cd] text-[#856404]'
                    }`}
                  >
                    {order.payment_status === 'paid'
                      ? '✓ Payment Verified'
                      : 'Payment Pending'}
                  </span>

                </div>

              </div>

              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Products
                </h3>

                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 py-3 border-b border-gray-50 last:border-0"
                  >

                    <div className="flex flex-col gap-1">
                      <strong className="text-gray-800">
                        {item.product_name}
                      </strong>

                      <span className="text-sm text-gray-500">
                        ₹{Number(item.price).toFixed(2)}
                        {' × '}
                        {item.quantity} {item.unit}
                      </span>
                    </div>

                    <strong className="text-gray-800">
                      ₹{Number(item.item_total).toFixed(2)}
                    </strong>

                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-5 mt-3 border-t-2 border-gray-100 text-lg font-bold text-gray-900">
                <span>Total Amount</span>

                <strong>
                  ₹{Number(
                    order.total_amount
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Delivery Details
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 flex flex-col gap-2">
                  <p>
                    <strong className="text-gray-900">Name:</strong>{' '}
                    {order.customer_name}
                  </p>

                  <p>
                    <strong className="text-gray-900">Phone:</strong>{' '}
                    {order.customer_phone}
                  </p>

                  <p>
                    <strong className="text-gray-900">Address:</strong>{' '}
                    {order.delivery_address}
                  </p>

                  <p>
                    <strong className="text-gray-900">District:</strong>{' '}
                    {order.district}
                  </p>

                  <p>
                    <strong className="text-gray-900">Village:</strong>{' '}
                    {order.village}
                  </p>
                </div>
              </div>

              <div className="flex items-center mt-6 overflow-x-auto pb-2 min-w-full text-xs sm:text-sm">

                <div
                  className={`min-w-[70px] sm:min-w-[90px] text-center flex flex-col items-center gap-1 ${
                    order.order_status === 'pending'
                      ? 'opacity-100'
                      : 'opacity-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-semibold mb-1">1</span>
                  <p className="font-medium">Order Placed</p>
                </div>

                <div className="h-0.5 min-w-[20px] sm:min-w-[30px] flex-1 bg-gray-200 mb-5" />

                <div
                  className={`min-w-[70px] sm:min-w-[90px] text-center flex flex-col items-center gap-1 ${
                    ['confirmed', 'shipped', 'delivered', 'completed']
                      .includes(order.order_status)
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-semibold mb-1">2</span>
                  <p className="font-medium">Confirmed</p>
                </div>

                <div className="h-0.5 min-w-[20px] sm:min-w-[30px] flex-1 bg-gray-200 mb-5" />

                <div
                  className={`min-w-[70px] sm:min-w-[90px] text-center flex flex-col items-center gap-1 ${
                    ['shipped', 'delivered', 'completed']
                      .includes(order.order_status)
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-semibold mb-1">3</span>
                  <p className="font-medium">Shipped</p>
                </div>

                <div className="h-0.5 min-w-[20px] sm:min-w-[30px] flex-1 bg-gray-200 mb-5" />

                <div
                  className={`min-w-[70px] sm:min-w-[90px] text-center flex flex-col items-center gap-1 ${
                    ['delivered', 'completed']
                      .includes(order.order_status)
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-semibold mb-1">4</span>
                  <p className="font-medium">Delivered</p>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  )
}