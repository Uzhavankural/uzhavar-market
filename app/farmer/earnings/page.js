'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { ensureFarmerAccess } from '../../../lib/farmerAuth'
import ThemeToggle from '../../components/ThemeToggle'

export default function FarmerEarningsPage() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const [settlements, setSettlements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    checkFarmer()
  }, [])

  async function checkFarmer() {
    setLoading(true)

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

      const farmerProfile = await ensureFarmerAccess(data, user)

      if (!farmerProfile.isAllowed && farmerProfile.role !== 'farmer') {
        setProfile(farmerProfile)
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setProfile(farmerProfile)

      await loadFarmerEarnings(user.id)
    } catch (error) {
      console.log('FARMER EARNINGS PAGE ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadFarmerEarnings(farmerId) {
    setRefreshing(true)

    try {
      const { data: items, error: itemsError } = await supabase
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
          commission_amount,
          farmer_price,
          settlement_status,
          settlement_amount,
          settlement_paid_at
        `)
        .eq('farmer_id', farmerId)
        .order('id', { ascending: false })

      if (itemsError) {
        console.log('FARMER EARNINGS ITEMS ERROR:', itemsError)
        setSettlements([])
        return
      }

      const orderItems = items || []

      if (orderItems.length === 0) {
        setSettlements([])
        return
      }

      const orderIds = [...new Set(orderItems.map((item) => item.order_id))]

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          delivery_address,
          district,
          village,
          total_amount,
          order_status,
          payment_status,
          created_at
        `)
        .in('id', orderIds)

      if (ordersError) {
        console.log('FARMER EARNINGS ORDERS ERROR:', ordersError)
        setSettlements([])
        return
      }

      const orderMap = {}
      ;(orders || []).forEach((order) => {
        orderMap[order.id] = order
      })

      const completedItems = orderItems
        .map((item) => {
          const order = orderMap[item.order_id]

          if (!order) return null
          if (order.order_status !== 'delivered') return null

          const quantity = Number(item.quantity || 0)
          const farmerPrice = Number(item.farmer_price || 0)
          const customerPrice = Number(item.price || 0)
          const itemTotal = Number(item.item_total || 0)

          const farmerAmount = farmerPrice * quantity

          const commissionPerUnit =
            item.commission_amount !== null && item.commission_amount !== undefined
              ? Number(item.commission_amount)
              : Math.max(0, customerPrice - farmerPrice)

          const commissionTotal = commissionPerUnit * quantity
          const calculatedSettlement = farmerAmount

          const settlementAmount =
            item.settlement_amount !== null && item.settlement_amount !== undefined
              ? Number(item.settlement_amount)
              : calculatedSettlement

          return {
            ...item,
            customer_name: order.customer_name || 'Customer',
            customer_phone: order.customer_phone || '',
            delivery_address: order.delivery_address || '',
            district: order.district || '',
            village: order.village || '',
            order_total_amount: Number(order.total_amount || 0),
            order_status: order.order_status,
            payment_status: order.payment_status,
            order_created_at: order.created_at,
            calculated_farmer_amount: farmerAmount,
            commission_per_unit: commissionPerUnit,
            calculated_commission: commissionTotal,
            calculated_customer_total: customerPrice * quantity,
            final_settlement_amount: settlementAmount,
            item_total_value: itemTotal,
          }
        })
        .filter(Boolean)

      setSettlements(completedItems)
    } catch (error) {
      console.log('LOAD FARMER EARNINGS ERROR:', error)
      setSettlements([])
    } finally {
      setRefreshing(false)
    }
  }

  async function handleRefresh() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    await loadFarmerEarnings(user.id)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  function formatDate(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(date) {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredSettlements = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return settlements.filter((item) => {
      const matchesSearch =
        !search ||
        item.customer_name?.toLowerCase().includes(search) ||
        item.customer_phone?.toLowerCase().includes(search) ||
        item.product_name?.toLowerCase().includes(search) ||
        item.order_id?.toLowerCase().includes(search)

      const isPaid = item.settlement_status === 'paid'
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && isPaid) ||
        (statusFilter === 'pending' && !isPaid)

      return matchesSearch && matchesStatus
    })
  }, [settlements, searchTerm, statusFilter])

  const totalSales = settlements.reduce(
    (total, item) => total + Number(item.calculated_customer_total || 0),
    0
  )

  const totalFarmerEarnings = settlements.reduce(
    (total, item) => total + Number(item.calculated_farmer_amount || 0),
    0
  )

  const totalCommission = settlements.reduce(
    (total, item) => total + Number(item.calculated_commission || 0),
    0
  )

  const paidSettlements = settlements.filter((item) => item.settlement_status === 'paid')
  const pendingSettlements = settlements.filter((item) => item.settlement_status !== 'paid')

  const totalPaid = paidSettlements.reduce(
    (total, item) => total + Number(item.final_settlement_amount || 0),
    0
  )

  const totalPending = pendingSettlements.reduce(
    (total, item) => total + Number(item.final_settlement_amount || 0),
    0
  )

  const completedOrderIds = new Set(settlements.map((item) => item.order_id))
  const paidOrderIds = new Set(paidSettlements.map((item) => item.order_id))
  const pendingOrderIds = new Set(pendingSettlements.map((item) => item.order_id))

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <div className="text-center">
          <div className="text-[45px] mb-2.5">🌾</div>
          <p className="text-base text-gray-500">Loading earnings...</p>
        </div>
      </main>
    )
  }

  if (accessDenied) {
    const dashboardPath = profile?.role === 'admin' ? '/admin' : '/customer'
    const dashboardText = profile?.role === 'admin' ? 'Go to Admin Dashboard' : 'Go to Customer Dashboard'

    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <div className="text-center max-w-[500px] w-full p-[30px]">
          <div className="text-[50px] mb-[15px]">🚫</div>
          <h2 className="m-0 mb-2.5 text-gray-800 text-xl font-bold">
            You don't have access to the Farmer Earnings Panel.
          </h2>
          <p className="m-0 mb-6 text-gray-500 text-[15px]">
            This page is available only for farmer users.
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
    <main className="min-h-screen bg-[#f7f8f5] font-sans">
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center gap-4 flex-wrap">
        <button
          onClick={() => router.push('/farmer')}
          className="border-none bg-transparent text-green-800 text-xl sm:text-[22px] font-bold cursor-pointer p-0"
        >
          🌾 Uzhavar Market
        </button>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <button
            onClick={() => router.push('/farmer')}
            className="px-3 py-2 sm:px-[15px] sm:py-[9px] border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            ← Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 sm:px-[18px] sm:py-[9px] border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-[1200px] mx-auto pt-[35px] pb-[50px]">
        <div className="bg-green-800 text-white p-6 sm:p-[30px] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-4 flex-wrap shadow-md">
          <div>
            <p className="text-xs font-bold tracking-wider m-0 mb-2 opacity-85">
              FARMER FINANCE
            </p>
            <h1 className="text-2xl sm:text-[30px] m-0 mb-2 font-bold">
              My Earnings & Settlements 💰
            </h1>
            <p className="m-0 opacity-90 text-sm sm:text-[15px]">
              View your completed orders, farmer earnings and settlement status.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 sm:px-4 sm:py-2.5 border border-white/50 rounded-lg bg-white text-green-800 cursor-pointer font-bold w-full sm:w-auto text-sm sm:text-base hover:bg-gray-50 transition-colors ${
              refreshing ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-6 sm:mt-[22px]">
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-sm">
            <span className="text-xl sm:text-[27px] block mb-1 sm:mb-0">🛒</span>
            <p className="m-0 mt-1 sm:mt-2 mb-0.5 sm:mb-1 text-[10px] sm:text-xs text-gray-500 font-medium">Completed Orders</p>
            <h2 className="m-0 text-base sm:text-xl lg:text-[23px] text-gray-800 font-bold truncate">{completedOrderIds.size}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-sm">
            <span className="text-xl sm:text-[27px] block mb-1 sm:mb-0">💰</span>
            <p className="m-0 mt-1 sm:mt-2 mb-0.5 sm:mb-1 text-[10px] sm:text-xs text-gray-500 font-medium">Farmer Earnings</p>
            <h2 className="m-0 text-base sm:text-xl lg:text-[23px] text-green-800 font-bold truncate">₹{formatMoney(totalFarmerEarnings)}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-sm">
            <span className="text-xl sm:text-[27px] block mb-1 sm:mb-0">💼</span>
            <p className="m-0 mt-1 sm:mt-2 mb-0.5 sm:mb-1 text-[10px] sm:text-xs text-gray-500 font-medium">Platform Commission</p>
            <h2 className="m-0 text-base sm:text-xl lg:text-[23px] text-gray-800 font-bold truncate">₹{formatMoney(totalCommission)}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-sm">
            <span className="text-xl sm:text-[27px] block mb-1 sm:mb-0">🌾</span>
            <p className="m-0 mt-1 sm:mt-2 mb-0.5 sm:mb-1 text-[10px] sm:text-xs text-gray-500 font-medium">Customer Sales</p>
            <h2 className="m-0 text-base sm:text-xl lg:text-[23px] text-gray-800 font-bold truncate">₹{formatMoney(totalSales)}</h2>
          </div>
        </div>

        <div className="mt-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 flex-wrap">
          <div>
            <p className="m-0 text-gray-500 text-xs font-medium">Settlement Overview</p>
            <h2 className="m-0 mt-1 text-lg sm:text-[20px] text-gray-800 font-bold">Farmer Settlement</h2>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-[30px]">
            <div className="flex flex-col gap-1">
              <span className="text-base sm:text-[19px] font-bold text-green-800">₹{formatMoney(totalPaid)}</span>
              <span className="text-xs text-gray-500 font-medium">Paid</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base sm:text-[19px] font-bold text-yellow-600">₹{formatMoney(totalPending)}</span>
              <span className="text-xs text-gray-500 font-medium">Pending</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base sm:text-[19px] font-bold text-gray-800">{paidOrderIds.size}</span>
              <span className="text-xs text-gray-500 font-medium">Paid Orders</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base sm:text-[19px] font-bold text-gray-800">{pendingOrderIds.size}</span>
              <span className="text-xs text-gray-500 font-medium">Pending Orders</span>
            </div>
          </div>
        </div>

        <div className="mt-[22px] bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 flex-wrap shadow-sm">
          <div className="flex-1 w-full lg:w-auto min-w-[280px] flex items-center border border-gray-300 rounded-lg px-3 bg-white">
            <span className="text-[17px]">🔍</span>
            <input
              type="text"
              placeholder="Search customer, product or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-none outline-none py-2.5 px-2.5 text-sm bg-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 sm:px-[14px] sm:py-[9px] border rounded-lg cursor-pointer font-semibold text-sm sm:text-base transition-colors ${
                statusFilter === 'all'
                  ? 'bg-green-800 text-white border-green-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-2 sm:px-[14px] sm:py-[9px] border rounded-lg cursor-pointer font-semibold text-sm sm:text-base transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-green-800 text-white border-green-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ✓ Paid
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 sm:px-[14px] sm:py-[9px] border rounded-lg cursor-pointer font-semibold text-sm sm:text-base transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-green-800 text-white border-green-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ⏳ Pending
            </button>
          </div>
        </div>

        <div className="mt-[30px]">
          <div>
            <h2 className="m-0 text-xl sm:text-[23px] text-gray-800 font-bold">Completed Orders</h2>
            <p className="m-0 mt-1.5 text-sm sm:text-[13px] text-gray-500">
              Showing {filteredSettlements.length} of {settlements.length} completed order items
            </p>
          </div>
        </div>

        {filteredSettlements.length === 0 ? (
          <div className="mt-[18px] p-[30px] sm:p-[50px] px-5 text-center bg-white border border-dashed border-gray-300 rounded-xl sm:rounded-2xl">
            <div className="text-[45px] mb-2">🌱</div>
            <h3 className="m-0 my-1.5 text-gray-700 font-bold text-lg">
              {settlements.length === 0 ? 'No completed orders yet' : 'No matching orders'}
            </h3>
            <p className="m-0 text-gray-500 text-[13px]">
              {settlements.length === 0
                ? 'Your earnings and settlement details will appear here after an order is delivered.'
                : 'Try changing the search or settlement filter.'}
            </p>
          </div>
        ) : (
          <div className="mt-[18px] flex flex-col gap-4">
            {filteredSettlements.map((item) => {
              const isPaid = item.settlement_status === 'paid'

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Top Bar: Order ID, Date, Status */}
                  <div className="bg-[#fafcf9] border-b border-gray-200 p-3.5 sm:p-[15px_18px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-[15px] flex-wrap">
                    <div>
                      <p className="m-0 text-sm font-bold text-gray-800">Order #{item.order_id.slice(0, 8)}</p>
                      <p className="m-0 mt-0.5 text-[11px] text-gray-400 font-medium">
                        {formatDate(item.order_created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                        ✓ Delivered
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {isPaid ? '✓ Settlement Paid' : '⏳ Settlement Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info (Name and Phone) & View Details Action */}
                  <div className="p-4 sm:p-[18px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-green-50 text-green-800 border border-green-200 flex items-center justify-center text-lg flex-shrink-0">
                        👤
                      </div>
                      <div>
                        <h3 className="m-0 text-base font-bold text-gray-800">{item.customer_name}</h3>
                        {item.customer_phone ? (
                          <a
                            href={`tel:${item.customer_phone}`}
                            className="inline-flex items-center gap-1.5 m-0 mt-1 text-xs sm:text-sm text-green-800 font-semibold hover:underline"
                          >
                            <span>📱</span> {item.customer_phone}
                          </a>
                        ) : (
                          <p className="m-0 mt-1 text-xs text-gray-400">No phone provided</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="w-full sm:w-auto px-4 py-2 bg-green-800 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span>👁️</span> View Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* ORDER DETAILS MODAL */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-5 flex justify-between items-center z-10">
                <div>
                  <h3 className="m-0 text-base sm:text-lg font-bold text-gray-800">Order Details</h3>
                  <p className="m-0 text-xs text-gray-500 mt-0.5">
                    Order #{selectedItem.order_id.slice(0, 8)} • {formatDate(selectedItem.order_created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-4">
                
                {/* Customer Details Box */}
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-lg flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Customer</span>
                    <h4 className="m-0 text-base font-bold text-gray-800">{selectedItem.customer_name}</h4>
                    {selectedItem.customer_phone && (
                      <a href={`tel:${selectedItem.customer_phone}`} className="inline-flex items-center gap-1 text-xs text-green-800 font-semibold mt-1 hover:underline">
                        📱 {selectedItem.customer_phone}
                      </a>
                    )}
                    {(selectedItem.village || selectedItem.district) && (
                      <p className="m-0 mt-1 text-xs text-gray-600 flex items-center gap-1">
                        📍 {[selectedItem.village, selectedItem.district].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Product Box */}
                <div className="p-3.5 border border-gray-200 rounded-xl bg-white shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Product Ordered</span>
                  <h4 className="m-0 text-base font-bold text-gray-800 flex items-center gap-1.5">
                    🌾 {selectedItem.product_name}
                  </h4>
                  <p className="m-0 mt-1 text-xs sm:text-sm font-semibold text-green-800">
                    Quantity: {selectedItem.quantity} {selectedItem.unit || 'unit'}
                  </p>
                </div>

                {/* Price Breakdown */}
                <div>
                  <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Price Breakdown (Per Unit)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center">
                      <span className="block text-[10px] text-gray-500 font-semibold uppercase">Customer</span>
                      <strong className="text-xs text-gray-800 font-bold block mt-0.5">
                        ₹{formatMoney(selectedItem.price)}
                      </strong>
                    </div>
                    <div className="bg-green-50 p-2.5 rounded-lg border border-green-200 text-center">
                      <span className="block text-[10px] text-green-700 font-semibold uppercase">Farmer</span>
                      <strong className="text-xs text-green-800 font-bold block mt-0.5">
                        ₹{formatMoney(selectedItem.farmer_price)}
                      </strong>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center">
                      <span className="block text-[10px] text-gray-500 font-semibold uppercase">Commission</span>
                      <strong className="text-xs text-gray-800 font-bold block mt-0.5">
                        ₹{formatMoney(selectedItem.commission_per_unit)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Customer Total:</span>
                    <strong className="text-gray-800">₹{formatMoney(selectedItem.calculated_customer_total)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Platform Commission:</span>
                    <strong className="text-gray-800">₹{formatMoney(selectedItem.calculated_commission)}</strong>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-800">Farmer Earnings:</span>
                    <strong className="font-bold text-green-800 text-base">₹{formatMoney(selectedItem.calculated_farmer_amount)}</strong>
                  </div>
                </div>

                {/* Settlement Info Card */}
                <div className={`p-3.5 sm:p-4 rounded-xl border ${selectedItem.settlement_status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedItem.settlement_status === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>
                      Settlement Amount
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedItem.settlement_status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {selectedItem.settlement_status === 'paid' ? '✓ Settlement Paid' : '⏳ Settlement Pending'}
                    </span>
                  </div>
                  <h3 className={`m-0 text-xl font-bold ${selectedItem.settlement_status === 'paid' ? 'text-green-800' : 'text-yellow-800'}`}>
                    ₹{formatMoney(selectedItem.final_settlement_amount)}
                  </h3>
                  {selectedItem.settlement_status === 'paid' && selectedItem.settlement_paid_at && (
                    <p className="m-0 mt-1.5 text-xs text-green-700">
                      Paid on: {formatDateTime(selectedItem.settlement_paid_at)}
                    </p>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}


      </section>
    </main>
  )
}