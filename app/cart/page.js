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
      .map((item) => {
        if (item.id === id) {
          const minQty = item.name?.toLowerCase().includes("organic complex") ? 50 : 1;
          return {
            ...item,
            quantity: item.quantity > minQty ? item.quantity - 1 : item.quantity,
          };
        }
        return item;
      })
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
    <main className="min-h-screen bg-[#f7f8f5] font-sans text-gray-800 flex flex-col">

      {/* Navbar */}
      <nav className="min-h-[70px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-[7%]">

        <div className="text-xl sm:text-2xl font-bold text-green-800">
          🌾 Uzhavar Market
        </div>

        <button
          onClick={() => router.push('/')}
          className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg bg-white cursor-pointer font-semibold text-sm sm:text-base hover:bg-gray-50"
        >
          ← Continue Shopping
        </button>

      </nav>


      {/* Cart */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8">
          🛒 Your Cart
        </h1>

        {cart.length === 0 ? (

          <div className="bg-white border border-gray-200 rounded-2xl py-12 sm:py-20 px-4 text-center">

            <div className="text-5xl sm:text-6xl mb-4">
              🛒
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mb-6">
              Add some farm products to your cart.
            </p>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              Start Shopping
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">

            {/* Cart Items */}
            <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                >

                  {/* Product Image */}
                  <div className="w-full sm:w-28 h-48 sm:h-28 rounded-lg overflow-hidden bg-[#e8f1df] flex items-center justify-center shrink-0">

                    {item.image_url ? (

                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />

                    ) : (

                      <span className="text-4xl">
                        🌾
                      </span>

                    )}

                  </div>


                  {/* Product Details */}
                  <div className="flex-1 text-center sm:text-left w-full">

                    <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                      {item.name}
                    </h2>

                    <p className="text-gray-500 mb-3 sm:mb-4">
                      ₹{item.price} / {item.unit}
                    </p>


                    {/* Quantity */}
                    <div className="flex items-center justify-center sm:justify-start gap-3">

                      <button
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        disabled={item.quantity <= (item.name?.toLowerCase().includes("organic complex") ? 50 : 1)}
                        className="w-8 h-8 border border-gray-300 rounded-md bg-white font-semibold text-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>

                      <span className="min-w-[25px] text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        className="w-8 h-8 border border-gray-300 rounded-md bg-white font-semibold text-lg flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>

                    </div>

                  </div>


                  {/* Item Total */}
                  <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end">

                    <strong className="block text-lg sm:text-xl font-bold text-green-800 sm:mb-3">
                      ₹{Number(item.price) * item.quantity}
                    </strong>

                    <button
                      onClick={() =>
                        removeItem(item.id)
                      }
                      className="text-red-600 font-semibold hover:text-red-700"
                    >
                      Remove
                    </button>

                  </div>

                </div>

              ))}

            </div>


            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 lg:sticky lg:top-24">

              <h2 className="text-lg sm:text-xl font-semibold mb-6">
                Order Summary
              </h2>

              <div className="flex justify-between mb-4 text-gray-600">

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

              <div className="flex justify-between mb-4 text-gray-600">

                <span>
                  Subtotal
                </span>

                <span>
                  ₹{totalAmount}
                </span>

              </div>

              <div className="h-px bg-gray-200 my-5"></div>

              <div className="flex justify-between text-lg sm:text-xl font-bold text-green-800">

                <strong>
                  Total
                </strong>

                <strong>
                  ₹{totalAmount}
                </strong>

              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full mt-6 py-3 sm:py-4 bg-green-800 text-white font-bold rounded-lg hover:bg-green-700"
              >
                Proceed to Checkout
              </button>

            </div>

          </div>

        )}

      </section>


      {/* Footer */}
      <footer className="py-10 px-4 sm:px-[7%] bg-[#17251a] text-white text-center mt-auto">

        <h3 className="text-lg font-semibold mb-2">
          🌾 Uzhavar Market
        </h3>

        <p className="text-gray-400">
          Connecting farmers directly with customers.
        </p>

      </footer>

    </main>
  )
}
