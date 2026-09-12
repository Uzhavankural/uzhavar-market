'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Checkout() {
  const router = useRouter()

  const [cart, setCart] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [village, setVillage] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedCart =
      JSON.parse(localStorage.getItem('cart')) || []

    setCart(savedCart)

    if (savedCart.length === 0) {
      router.push('/cart')
    }
  }, [router])

  // Customer total is calculated from database product price
  const totalAmount = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  )

  async function handlePlaceOrder(e) {
    e.preventDefault()

    if (
      !name ||
      !phone ||
      !address ||
      !district ||
      !village
    ) {
      alert('Please fill all delivery details.')
      return
    }

    if (cart.length === 0) {
      alert('Your cart is empty.')
      return
    }

    setLoading(true)

    try {
      // Check logged-in customer
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        alert('Please login before placing an order.')
        router.push('/login')
        return
      }

      // Get latest approved product data from Supabase
      const productIds = cart.map((item) => item.id)

      const { data: products, error: productsError } =
        await supabase
          .from('products')
          .select(`
            id,
            name,
            farmer_id,
            price,
            commission_amount,
            unit,
            stock_quantity,
            status,
            approval_status
          `)
          .in('id', productIds)
          .eq('status', 'active')
          .eq('approval_status', 'active')

      if (productsError) {
        console.error(
          'PRODUCT FETCH ERROR:',
          productsError
        )

        alert('Unable to verify products.')
        return
      }

      if (!products || products.length !== cart.length) {
        alert(
          'One or more products are no longer available.'
        )
        return
      }

      // Create a map for quick product lookup
      const productMap = new Map(
        products.map((product) => [
          product.id,
          product,
        ])
      )

      // Build order items using DATABASE values
      const orderItems = []
      let calculatedTotal = 0

      for (const cartItem of cart) {
        const product = productMap.get(cartItem.id)

        if (!product) {
          alert(
            `${cartItem.name} is no longer available.`
          )
          return
        }

        const quantity = Number(cartItem.quantity)

        if (!Number.isFinite(quantity) || quantity <= 0) {
          alert(
            `Invalid quantity for ${product.name}.`
          )
          return
        }

        // Check stock
        if (
          Number(product.stock_quantity) < quantity
        ) {
          alert(
            `${product.name} has only ${product.stock_quantity} available.`
          )
          return
        }

        const farmerPrice = Number(product.price)
        const commissionAmount =
          Number(product.commission_amount || 0)

        const customerPrice =
          farmerPrice + commissionAmount

        const itemTotal =
          customerPrice * quantity

        calculatedTotal += itemTotal

        orderItems.push({
          product_id: product.id,
          farmer_id: product.farmer_id,
          product_name: product.name,

          // Customer-facing price stored in order
          price: customerPrice,

          quantity: quantity,
          unit: product.unit,

          item_total: itemTotal,

          // Financial snapshot
          farmer_price: farmerPrice,
          commission_amount: commissionAmount,

          // Farmer settlement starts as pending
          settlement_status: 'pending',
          settlement_amount:
            farmerPrice * quantity,
          settlement_paid_at: null,
        })
      }

      // Create order using database-calculated total
      const { data: order, error: orderError } =
        await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            customer_name: name,
            customer_phone: phone,
            delivery_address: address,
            district: district,
            village: village,

            total_amount: calculatedTotal,

            order_status: 'pending',
            payment_status: 'pending',
          })
          .select()
          .single()

      if (orderError) {
        console.error(
          'ORDER ERROR:',
          orderError
        )

        alert('Unable to create order.')
        return
      }

      // Add order ID to every item
      const finalOrderItems = orderItems.map(
        (item) => ({
          ...item,
          order_id: order.id,
        })
      )

      // Create order items
      const { error: itemsError } =
        await supabase
          .from('order_items')
          .insert(finalOrderItems)

      if (itemsError) {
        console.error(
          'ORDER ITEMS ERROR:',
          itemsError
        )

        // Remove incomplete order
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id)

        alert(
          'Unable to save order details. Please try again.'
        )

        return
      }

      // Clear cart
      localStorage.removeItem('cart')
      setCart([])

      alert(
        `Order placed successfully!\nOrder ID: ${order.id}`
      )

      router.push('/')

    } catch (error) {
      console.error(
        'CHECKOUT ERROR:',
        error
      )

      alert(
        'Something went wrong while placing the order.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] py-8 px-4 sm:py-10 sm:px-6">
      <div className="max-w-5xl mx-auto w-full">

        <button
          onClick={() => router.push('/cart')}
          className="text-gray-600 hover:text-gray-900 font-medium mb-6 text-sm sm:text-base cursor-pointer"
        >
          ← Back to Cart
        </button>

        <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-gray-800">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">

          {/* Customer Details */}
          <section className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">

            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-gray-800">
              Delivery Details
            </h2>

            <form onSubmit={handlePlaceOrder}>

              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
                className="w-full p-3 mb-4 sm:mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
              />

              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter phone number"
                className="w-full p-3 mb-4 sm:mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
              />

              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
                Delivery Address
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="Enter your full delivery address"
                rows="4"
                className="w-full p-3 mb-4 sm:mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none resize-y"
              />

              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
                District
              </label>

              <input
                type="text"
                value={district}
                onChange={(e) =>
                  setDistrict(e.target.value)
                }
                placeholder="Enter district"
                className="w-full p-3 mb-4 sm:mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
              />

              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">
                Village / Town
              </label>

              <input
                type="text"
                value={village}
                onChange={(e) =>
                  setVillage(e.target.value)
                }
                placeholder="Enter village or town"
                className="w-full p-3 mb-4 sm:mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 sm:p-4 bg-green-800 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-70 transition-colors mt-2"
              >
                {loading
                  ? 'Placing Order...'
                  : 'Place Order'}
              </button>

            </form>

          </section>

          {/* Order Summary */}
          <section className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 lg:sticky lg:top-8">

            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-gray-800">
              Order Summary
            </h2>

            <div className="flex flex-col">
              {cart.map((item) => (

                <div
                  key={item.id}
                  className="flex justify-between gap-4 py-4 border-b border-gray-100 last:border-0"
                >

                  <div>

                    <strong className="text-gray-800">
                      {item.name}
                    </strong>

                    <p className="mt-1 text-sm text-gray-500">
                      ₹{item.price} × {item.quantity}
                    </p>

                  </div>

                  <strong className="text-gray-800">
                    ₹
                    {(
                      Number(item.price) *
                      item.quantity
                    ).toFixed(2)}
                  </strong>

                </div>

              ))}
            </div>

            <div className="my-5 border-t border-gray-200"></div>

            <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-800">

              <span>
                Total
              </span>

              <strong>
                ₹{totalAmount.toFixed(2)}
              </strong>

            </div>

          </section>

        </div>

      </div>
    </main>
  )
}