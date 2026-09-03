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

      // Create order
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
            total_amount: totalAmount,
            order_status: 'pending',
            payment_status: 'pending',
          })
          .select()
          .single()

      if (orderError) {
        console.error('ORDER ERROR:', orderError)
        alert('Unable to create order.')
        return
      }

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        farmer_id: item.farmer_id,
        product_name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        unit: item.unit,
        item_total:
          Number(item.price) * item.quantity,
      }))

      const { error: itemsError } =
        await supabase
          .from('order_items')
          .insert(orderItems)

      if (itemsError) {
        console.error(
          'ORDER ITEMS ERROR:',
          itemsError
        )

        alert(
          'Order was created, but some order details could not be saved.'
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
      console.error('CHECKOUT ERROR:', error)

      alert(
        'Something went wrong while placing the order.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <button
          onClick={() => router.push('/cart')}
          style={styles.backButton}
        >
          ← Back to Cart
        </button>

        <h1 style={styles.title}>
          Checkout
        </h1>

        <div style={styles.layout}>

          {/* Customer Details */}
          <section style={styles.card}>

            <h2 style={styles.heading}>
              Delivery Details
            </h2>

            <form onSubmit={handlePlaceOrder}>

              <label style={styles.label}>
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
                style={styles.input}
              />


              <label style={styles.label}>
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter phone number"
                style={styles.input}
              />


              <label style={styles.label}>
                Delivery Address
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="Enter your full delivery address"
                rows="4"
                style={styles.textarea}
              />


              <label style={styles.label}>
                District
              </label>

              <input
                type="text"
                value={district}
                onChange={(e) =>
                  setDistrict(e.target.value)
                }
                placeholder="Enter district"
                style={styles.input}
              />


              <label style={styles.label}>
                Village / Town
              </label>

              <input
                type="text"
                value={village}
                onChange={(e) =>
                  setVillage(e.target.value)
                }
                placeholder="Enter village or town"
                style={styles.input}
              />


              <button
                type="submit"
                style={{
                  ...styles.placeOrderButton,
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
              >
                {loading
                  ? 'Placing Order...'
                  : 'Place Order'}
              </button>

            </form>

          </section>


          {/* Order Summary */}
          <section style={styles.card}>

            <h2 style={styles.heading}>
              Order Summary
            </h2>

            {cart.map((item) => (

              <div
                key={item.id}
                style={styles.item}
              >

                <div>

                  <strong>
                    {item.name}
                  </strong>

                  <p style={styles.itemText}>
                    ₹{item.price} × {item.quantity}
                  </p>

                </div>

                <strong>
                  ₹
                  {(
                    Number(item.price) *
                    item.quantity
                  ).toFixed(2)}
                </strong>

              </div>

            ))}


            <div style={styles.divider}></div>


            <div style={styles.totalRow}>

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

  title: {
    fontSize: '36px',
    marginBottom: '30px',
  },

  layout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '25px',
  },

  card: {
    background: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },

  heading: {
    fontSize: '22px',
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    marginBottom: '7px',
    fontWeight: '600',
  },

  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '18px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },

  textarea: {
    width: '100%',
    padding: '12px',
    marginBottom: '18px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },

  placeOrderButton: {
    width: '100%',
    padding: '14px',
    background: '#2e7d32',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  item: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    padding: '15px 0',
    borderBottom: '1px solid #eee',
  },

  itemText: {
    margin: '6px 0 0',
    color: '#666',
  },

  divider: {
    margin: '20px 0',
    borderTop: '1px solid #ddd',
  },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '20px',
  },

}