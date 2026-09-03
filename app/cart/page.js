'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Cart() {
  const router = useRouter()

  const [cart, setCart] = useState([])

  useEffect(() => {
    const savedCart =
      JSON.parse(localStorage.getItem('cart')) || []

    setCart(savedCart)
  }, [])

  function updateCart(updatedCart) {
    setCart(updatedCart)

    localStorage.setItem(
      'cart',
      JSON.stringify(updatedCart)
    )
  }

  function increaseQuantity(id) {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    )

    updateCart(updatedCart)
  }

  function decreaseQuantity(id) {
    const updatedCart = cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0)

    updateCart(updatedCart)
  }

  function removeItem(id) {
    const updatedCart = cart.filter(
      (item) => item.id !== id
    )

    updateCart(updatedCart)
  }

  const totalAmount = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  )

  return (
    <main style={styles.page}>

      {/* Navbar */}
      <nav style={styles.navbar}>

        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <button
          onClick={() => router.push('/')}
          style={styles.backButton}
        >
          ← Continue Shopping
        </button>

      </nav>


      {/* Cart */}
      <section style={styles.container}>

        <h1 style={styles.title}>
          🛒 Your Cart
        </h1>

        {cart.length === 0 ? (

          <div style={styles.emptyCart}>

            <div style={styles.emptyIcon}>
              🛒
            </div>

            <h2>
              Your cart is empty
            </h2>

            <p>
              Add some farm products to your cart.
            </p>

            <button
              onClick={() => router.push('/')}
              style={styles.shopButton}
            >
              Start Shopping
            </button>

          </div>

        ) : (

          <div style={styles.cartLayout}>

            {/* Cart Items */}
            <div style={styles.itemsSection}>

              {cart.map((item) => (

                <div
                  key={item.id}
                  style={styles.cartItem}
                >

                  {/* Product Image */}
                  <div style={styles.imageBox}>

                    {item.image_url ? (

                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={styles.image}
                      />

                    ) : (

                      <span style={styles.noImage}>
                        🌾
                      </span>

                    )}

                  </div>


                  {/* Product Details */}
                  <div style={styles.itemDetails}>

                    <h2 style={styles.itemName}>
                      {item.name}
                    </h2>

                    <p style={styles.itemPrice}>
                      ₹{item.price} / {item.unit}
                    </p>


                    {/* Quantity */}
                    <div style={styles.quantityRow}>

                      <button
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        style={styles.quantityButton}
                      >
                        −
                      </button>

                      <span style={styles.quantity}>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        style={styles.quantityButton}
                      >
                        +
                      </button>

                    </div>

                  </div>


                  {/* Item Total */}
                  <div style={styles.itemRight}>

                    <strong style={styles.itemTotal}>
                      ₹
                      {Number(item.price) *
                        item.quantity}
                    </strong>

                    <button
                      onClick={() =>
                        removeItem(item.id)
                      }
                      style={styles.removeButton}
                    >
                      Remove
                    </button>

                  </div>

                </div>

              ))}

            </div>


            {/* Summary */}
            <div style={styles.summary}>

              <h2 style={styles.summaryTitle}>
                Order Summary
              </h2>

              <div style={styles.summaryRow}>

                <span>
                  Items
                </span>

                <span>
                  {cart.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0
                  )}
                </span>

              </div>

              <div style={styles.summaryRow}>

                <span>
                  Subtotal
                </span>

                <span>
                  ₹{totalAmount}
                </span>

              </div>

              <div style={styles.divider}></div>

              <div style={styles.totalRow}>

                <strong>
                  Total
                </strong>

                <strong>
                  ₹{totalAmount}
                </strong>

              </div>

              <button
                onClick={() => router.push('/checkout')}
                style={styles.checkoutButton}
              >
                Proceed to Checkout
              </button>

            </div>

          </div>

        )}

      </section>


      {/* Footer */}
      <footer style={styles.footer}>

        <h3>
          🌾 Uzhavar Market
        </h3>

        <p>
          Connecting farmers directly
          with customers.
        </p>

      </footer>

    </main>
  )
}


const styles = {

  page: {
    minHeight: '100vh',
    background: '#f7f8f5',
    fontFamily: 'Arial, sans-serif',
    color: '#1f2937',
  },


  navbar: {
    minHeight: '70px',
    background: '#ffffff',
    borderBottom:
      '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 7%',
  },


  logo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#166534',
  },


  backButton: {
    padding: '10px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },


  container: {
    width: '90%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '50px 0',
  },


  title: {
    fontSize: '34px',
    marginBottom: '30px',
  },


  cartLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
    alignItems: 'start',
  },


  itemsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },


  cartItem: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },


  imageBox: {
    width: '110px',
    height: '110px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#e8f1df',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },


  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },


  noImage: {
    fontSize: '45px',
  },


  itemDetails: {
    flex: 1,
  },


  itemName: {
    fontSize: '20px',
    margin: '0 0 8px',
  },


  itemPrice: {
    color: '#6b7280',
    margin: '0 0 15px',
  },


  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },


  quantityButton: {
    width: '32px',
    height: '32px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '600',
  },


  quantity: {
    minWidth: '25px',
    textAlign: 'center',
    fontWeight: '600',
  },


  itemRight: {
    textAlign: 'right',
  },


  itemTotal: {
    display: 'block',
    fontSize: '20px',
    color: '#166534',
    marginBottom: '12px',
  },


  removeButton: {
    border: 'none',
    background: 'transparent',
    color: '#dc2626',
    cursor: 'pointer',
    fontWeight: '600',
  },


  summary: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '25px',
    position: 'sticky',
    top: '90px',
  },


  summaryTitle: {
    margin: '0 0 25px',
    fontSize: '22px',
  },


  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    color: '#4b5563',
  },


  divider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '20px 0',
  },


  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '20px',
    color: '#166534',
  },


  checkoutButton: {
    width: '100%',
    marginTop: '25px',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },


  emptyCart: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '70px 20px',
    textAlign: 'center',
  },


  emptyIcon: {
    fontSize: '60px',
    marginBottom: '15px',
  },


  shopButton: {
    marginTop: '20px',
    padding: '12px 22px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: '600',
  },


  footer: {
    padding: '40px 7%',
    background: '#17251a',
    color: '#ffffff',
    textAlign: 'center',
  },

}
