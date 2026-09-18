'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function FarmerDashboard() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [productCount, setProductCount] = useState(0)
  const [completedOrderCount, setCompletedOrderCount] = useState(0)

  useEffect(() => {
    async function checkFarmer() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error || !data) {
          console.log('PROFILE ERROR:', error)
          setLoading(false)
          return
        }

        if (data.role !== 'farmer') {
          setProfile(data)
          setAccessDenied(true)
          setLoading(false)
          return
        }

        if (!data.address || !data.village || !data.district || !data.pincode) {
          router.replace('/farmer/profile')
          return
        }

        setProfile(data)

        const { count: productsCount, error: productError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', user.id)

        if (productError) {
          console.log('PRODUCT COUNT ERROR:', productError)
        } else {
          setProductCount(productsCount || 0)
        }

        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('farmer_id', user.id)

        if (orderItemsError) {
          console.log('FARMER ORDER ITEMS ERROR:', orderItemsError)
        } else if (orderItems && orderItems.length > 0) {
          const orderIds = [...new Set(orderItems.map((item) => item.order_id))]

          const { data: completedOrders, error: completedOrdersError } = await supabase
            .from('orders')
            .select('id')
            .in('id', orderIds)
            .eq('order_status', 'delivered')

          if (completedOrdersError) {
            console.log('COMPLETED ORDERS ERROR:', completedOrdersError)
          } else {
            setCompletedOrderCount(completedOrders?.length || 0)
          }
        } else {
          setCompletedOrderCount(0)
        }

        setLoading(false)
      } catch (error) {
        console.log('FARMER DASHBOARD ERROR:', error)
        setLoading(false)
      }
    }

    checkFarmer()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <p className="text-base text-gray-500">Loading dashboard...</p>
      </main>
    )
  }

  if (accessDenied) {
    const dashboardPath = profile?.role === 'admin' ? '/admin' : '/customer'
    const dashboardText = profile?.role === 'admin' ? 'Go to Admin Dashboard' : 'Go to Customer Dashboard'

    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans px-4">
        <div className="text-center max-w-[500px] w-full p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="m-0 mb-2.5 text-gray-800 text-xl font-bold">
            You don't have access to the Farmer Panel.
          </h2>
          <p className="m-0 mb-6 text-gray-500 text-[15px]">
            This panel is available only for farmer users.
          </p>
          <button
            onClick={() => router.push(dashboardPath)}
            className="px-5 py-3 border-none rounded-lg bg-green-800 text-white cursor-pointer font-semibold w-full sm:w-auto hover:bg-green-700 transition-colors"
          >
            {dashboardText}
          </button>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <p className="text-base text-gray-500">Unable to load your farmer profile.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] font-sans pb-10">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center flex-wrap gap-4">
        <div className="text-xl sm:text-2xl font-bold text-green-800">
          🌾 Uzhavar Market
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          Logout
        </button>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-[1200px] mx-auto pt-6 sm:pt-10">
        {/* WELCOME */}
        <div className="bg-green-800 text-white p-6 sm:p-9 rounded-2xl">
          <p className="text-xs sm:text-[13px] font-bold tracking-wider mb-2.5 opacity-90">
            FARMER DASHBOARD
          </p>
          <h1 className="text-2xl sm:text-3xl m-0 mb-2.5 font-bold">
            Welcome, {profile.full_name}! 👨‍🌾
          </h1>
          <p className="m-0 opacity-90 text-sm sm:text-base">
            Manage your farm products, orders and earnings from here.
          </p>
        </div>

        {/* MAIN STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-6 sm:mt-[25px]">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-2xl m-0 mb-1 text-gray-800 font-bold">{productCount}</h3>
            <p className="m-0 text-gray-500 text-sm">Products</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="text-3xl mb-3">🛒</div>
            <h3 className="text-2xl m-0 mb-1 text-gray-800 font-bold">{completedOrderCount}</h3>
            <p className="m-0 text-gray-500 text-sm">Completed Orders</p>
          </div>

          <div
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/farmer/orders')}
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-2xl m-0 mb-1 text-green-800 font-bold">View</h3>
            <p className="m-0 text-gray-500 text-sm">My Orders →</p>
          </div>
        </div>

        {/* EARNINGS & SETTLEMENTS */}
        <h2 className="mt-8 sm:mt-10 mb-4 sm:mb-5 text-xl sm:text-2xl text-gray-800 font-bold">
          Earnings & Settlements
        </h2>

        <button
          onClick={() => router.push('/farmer/earnings')}
          className="w-full bg-white border border-[#dfe8df] rounded-2xl p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-5 text-left box-border shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-row items-center gap-4 flex-1">
            <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-xl bg-[#f0f7ef] flex items-center justify-center text-2xl flex-shrink-0">
              💰
            </div>
            <div>
              <h3 className="m-0 mb-1 text-lg sm:text-[19px] text-green-800 font-bold">
                My Earnings & Settlements
              </h3>
              <p className="m-0 text-gray-500 text-xs sm:text-[13px] leading-relaxed">
                View completed orders, farmer earnings, platform commission and settlement status.
              </p>
            </div>
          </div>
          <div className="text-green-800 font-bold text-sm whitespace-nowrap self-end sm:self-auto">
            View Details →
          </div>
        </button>

        {/* QUICK ACTIONS */}
        <h2 className="mt-8 sm:mt-10 mb-4 sm:mb-5 text-xl sm:text-2xl text-gray-800 font-bold">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          <button
            onClick={() => router.push('/farmer/add-product')}
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 text-left cursor-pointer flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-1">➕</span>
            <strong className="text-base sm:text-lg text-gray-800">Add Product</strong>
            <span className="text-xs sm:text-sm text-gray-500">Add a new farm product</span>
          </button>

          <button
            onClick={() => router.push('/farmer/products')}
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 text-left cursor-pointer flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-1">📦</span>
            <strong className="text-base sm:text-lg text-gray-800">My Products</strong>
            <span className="text-xs sm:text-sm text-gray-500">Manage your products</span>
          </button>

          <button
            onClick={() => router.push('/farmer/orders')}
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 text-left cursor-pointer flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-1">🛒</span>
            <strong className="text-base sm:text-lg text-gray-800">Orders</strong>
            <span className="text-xs sm:text-sm text-gray-500">View customer orders</span>
          </button>

          <button
            onClick={() => router.push('/farmer/earnings')}
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 text-left cursor-pointer flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-1">💰</span>
            <strong className="text-base sm:text-lg text-gray-800">Earnings & Settlements</strong>
            <span className="text-xs sm:text-sm text-gray-500">View completed orders and settlements</span>
          </button>

          <button
            onClick={() => router.push('/farmer/profile')}
            className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 text-left cursor-pointer flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            <span className="text-3xl mb-1">👤</span>
            <strong className="text-base sm:text-lg text-gray-800">My Profile</strong>
            <span className="text-xs sm:text-sm text-gray-500">Manage farm details</span>
          </button>
        </div>
      </section>
    </main>
  )
}