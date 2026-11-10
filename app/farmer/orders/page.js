'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { ensureFarmerAccess } from '../../../lib/farmerAuth'
import { useLanguage } from '@/app/context/LanguageContext'
import LanguageToggle from '@/app/components/LanguageToggle'

export default function FarmerOrders() {
  const router = useRouter()
  const { t, tu, ts, locale } = useLanguage()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  const [searchTerm, setSearchTerm] = useState('')

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const farmerProfile = await ensureFarmerAccess(profile, user)

      if (!farmerProfile.isAllowed && farmerProfile.role !== 'farmer') {
        setMessage('Only farmers can access this page.')
        setLoading(false)
        return
      }

      const { data: orderItems, error: itemsError } = await supabase
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
          commission_amount,
          farmer_price,
          settlement_status,
          settlement_amount,
          settlement_paid_at,
          created_at
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false })

      if (itemsError) {
        console.error('ORDER ITEMS ERROR:', itemsError)
        setMessage('Unable to load your orders.')
        setLoading(false)
        return
      }

      if (!orderItems || orderItems.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      const orderIds = [...new Set(orderItems.map((item) => item.order_id))]

      const { data: orderDetails, error: ordersError } = await supabase
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
        const order = orderDetails?.find((order) => order.id === item.order_id)
        const itemTotal = Number(item.item_total || 0)
        const farmerPrice = Number(item.farmer_price || 0)
        const quantity = Number(item.quantity || 0)

        const calculatedFarmerAmount = farmerPrice * quantity

        const commissionPerUnit = Number(
          item.commission_amount ??
            (quantity > 0 ? (itemTotal - calculatedFarmerAmount) / quantity : 0)
        )

        const calculatedCommission = commissionPerUnit * quantity

        const settlementAmount =
          item.settlement_amount !== null && item.settlement_amount !== undefined
            ? Number(item.settlement_amount)
            : calculatedFarmerAmount

        return {
          ...item,
          order,
          calculatedFarmerAmount,
          calculatedCommission,
          calculatedSettlement: settlementAmount,
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('Please login again.')
        return
      }

      const currentItem = orders.find((item) => item.order?.id === orderId)

      if (!currentItem?.order) {
        setMessage('Order not found.')
        return
      }

      const currentStatus = String(currentItem.order.order_status || '').trim().toLowerCase()

      if (currentStatus !== 'confirmed' || newStatus !== 'shipped') {
        setMessage('You can ship an order only after admin confirms it.')
        return
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ order_status: 'shipped' })
        .eq('id', orderId)
        .eq('order_status', 'confirmed')
        .select('id, order_status')
        .single()

      if (error) {
        console.error('SHIP ORDER ERROR:', error)
        setMessage(error.message || 'Unable to mark order as shipped.')
        return
      }

      if (!updatedOrder) {
        setMessage('Order could not be updated. It may already have changed.')
        return
      }

      setOrders((currentOrders) =>
        currentOrders.map((item) => {
          if (item.order && item.order.id === orderId) {
            return {
              ...item,
              order: { ...item.order, order_status: 'shipped' },
            }
          }
          return item
        })
      )

      setMessage('Order marked as shipped successfully.')
    } catch (error) {
      console.error('SHIP ORDER ERROR:', error)
      setMessage('Something went wrong.')
    } finally {
      setUpdating(null)
    }
  }

  function getNextAction(status) {
    const currentStatus = String(status || '').trim().toLowerCase()

    if (currentStatus === 'pending') {
      return {
        text: t('farmer.waitingAdminConfirm'),
        nextStatus: null,
        disabled: true,
      }
    }

    if (currentStatus === 'confirmed') {
      return {
        text: t('farmer.markDispatchedCourier'),
        nextStatus: 'shipped',
        disabled: false,
      }
    }

    if (currentStatus === 'shipped') {
      return {
        text: t('farmer.inTransitCourier'),
        nextStatus: null,
        disabled: true,
      }
    }

    if (currentStatus === 'delivered') {
      return {
        text: t('farmer.deliveryConfirmedCustomer'),
        nextStatus: null,
        disabled: true,
      }
    }

    return null
  }

  const filteredOrders = useMemo(() => {
    let result = orders

    if (filter === 'pending') {
      result = result.filter(
        (item) => String(item.order?.order_status || '').toLowerCase() === 'pending'
      )
    }
    if (filter === 'confirmed') {
      result = result.filter(
        (item) => String(item.order?.order_status || '').toLowerCase() === 'confirmed'
      )
    }
    if (filter === 'shipped') {
      result = result.filter(
        (item) => String(item.order?.order_status || '').toLowerCase() === 'shipped'
      )
    }
    if (filter === 'delivered') {
      result = result.filter(
        (item) => String(item.order?.order_status || '').toLowerCase() === 'delivered'
      )
    }
    if (filter === 'paid') {
      result = result.filter(
        (item) => String(item.settlement_status || '').toLowerCase() === 'paid'
      )
    }
    if (filter === 'settlement_pending') {
      result = result.filter(
        (item) => String(item.settlement_status || '').toLowerCase() !== 'paid'
      )
    }

    const search = searchTerm.trim().toLowerCase()
    if (search) {
      result = result.filter((item) => {
        const customerName = String(item.order?.customer_name || '').toLowerCase()
        const customerPhone = String(item.order?.customer_phone || '').toLowerCase()
        return customerName.includes(search) || customerPhone.includes(search)
      })
    }

    return result
  }, [orders, filter, searchTerm])

  const summary = useMemo(() => {
    let sales = 0
    let commission = 0
    let earned = 0
    let pendingSettlement = 0
    let deliveredCount = 0
    let paidSettlementCount = 0
    let pendingSettlementCount = 0

    const deliveredOrderIds = new Set()

    orders.forEach((item) => {
      const itemTotal = Number(item.item_total || 0)
      const calculatedCommission = Number(item.calculatedCommission || 0)
      const settlementAmount = Number(item.calculatedSettlement || 0)

      sales += itemTotal
      commission += calculatedCommission

      const status = String(item.order?.order_status || '').toLowerCase()
      const settlementStatus = String(item.settlement_status || '').toLowerCase()

      if (status === 'delivered') {
        deliveredOrderIds.add(item.order_id)
      }

      if (settlementStatus === 'paid') {
        earned += settlementAmount
        paidSettlementCount += 1
      } else {
        pendingSettlement += settlementAmount
        pendingSettlementCount += 1
      }
    })

    deliveredCount = deliveredOrderIds.size

    return {
      sales,
      commission,
      earned,
      pendingSettlement,
      deliveredCount,
      paidSettlementCount,
      pendingSettlementCount,
    }
  }, [orders])

  function getStatusStyle(status) {
    const currentStatus = String(status || '').toLowerCase()

    if (currentStatus === 'pending') return 'bg-orange-50 text-orange-700'
    if (currentStatus === 'confirmed') return 'bg-blue-50 text-blue-700'
    if (currentStatus === 'shipped') return 'bg-purple-50 text-purple-700'
    if (currentStatus === 'delivered') return 'bg-emerald-50 text-emerald-700'
    if (currentStatus === 'cancelled') return 'bg-red-50 text-red-700'

    return 'bg-gray-100 text-gray-700'
  }

  function getSettlementStyle(status) {
    if (String(status || '').toLowerCase() === 'paid') {
      return 'bg-emerald-50 text-emerald-700'
    }
    return 'bg-orange-50 text-orange-700'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f5f7f5] font-sans">
        <div className="bg-white p-10 rounded-2xl text-center shadow-md">
          <div className="text-[45px] mb-[15px]">🌾</div>
          <p className="m-0 text-gray-600 text-base">{t('farmer.loadingOrders')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] p-5 sm:p-10 font-sans">
      <div className="max-w-[1150px] mx-auto">
        <div className="flex justify-between items-center mb-[25px] flex-wrap gap-3">
          <button
            onClick={() => router.push('/farmer')}
            className="px-4 py-2 border-none bg-white text-gray-700 rounded-lg cursor-pointer font-bold shadow-sm hover:shadow-md transition-shadow text-sm sm:text-base"
          >
            ← {t('nav.backToDashboard')}
          </button>
          <LanguageToggle variant="compact" />
        </div>

        <div className="bg-green-800 text-white p-[25px] sm:p-[35px] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-[20px] shadow-md flex-wrap">
          <div>
            <p className="m-0 mb-2 font-bold text-xs tracking-wider opacity-85">{t('farmer.panelBadge')}</p>
            <h1 className="m-0 mb-2 text-2xl sm:text-[32px] font-bold">{t('farmer.myOrdersTitle')}</h1>
            <p className="m-0 opacity-90 text-sm sm:text-base">{t('farmer.myOrdersSubtitle')}</p>
          </div>
          <button
            onClick={loadOrders}
            className="px-[20px] py-[12px] border-none bg-white text-green-800 rounded-lg font-bold cursor-pointer hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto"
          >
            ↻ {t('common.refresh')}
          </button>
        </div>

        {message && (
          <div
            className={`mt-[25px] p-[15px] rounded-lg text-center font-bold text-sm sm:text-base ${
              message.includes('successfully')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[20px] mt-[25px]">
          <div className="bg-white border border-gray-200 rounded-2xl p-[20px] flex items-center gap-[15px] shadow-sm">
            <div className="w-[50px] h-[50px] rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[22px] flex-shrink-0">
              🛒
            </div>
            <div>
              <p className="m-0 mb-[5px] text-xs text-gray-500 font-bold uppercase tracking-wider">{t('farmer.totalSales')}</p>
              <h2 className="m-0 text-xl font-bold text-gray-800">₹{summary.sales.toFixed(2)}</h2>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-[20px] flex items-center gap-[15px] shadow-sm">
            <div className="w-[50px] h-[50px] rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[22px] flex-shrink-0">
              🌾
            </div>
            <div>
              <p className="m-0 mb-[5px] text-xs text-gray-500 font-bold uppercase tracking-wider">{t('farmer.farmerEarningsLabel')}</p>
              <h2 className="m-0 text-xl font-bold text-gray-800">₹{summary.earned.toFixed(2)}</h2>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-[20px] flex items-center gap-[15px] shadow-sm">
            <div className="w-[50px] h-[50px] rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-[22px] flex-shrink-0">
              💼
            </div>
            <div>
              <p className="m-0 mb-[5px] text-xs text-gray-500 font-bold uppercase tracking-wider">{t('farmer.totalCommission')}</p>
              <h2 className="m-0 text-xl font-bold text-gray-800">₹{summary.commission.toFixed(2)}</h2>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-[20px] flex items-center gap-[15px] shadow-sm">
            <div className="w-[50px] h-[50px] rounded-full bg-orange-50 text-orange-700 flex items-center justify-center text-[22px] flex-shrink-0">
              ⏳
            </div>
            <div>
              <p className="m-0 mb-[5px] text-xs text-gray-500 font-bold uppercase tracking-wider">{t('farmer.pendingSettlement')}</p>
              <h2 className="m-0 text-xl font-bold text-gray-800">₹{summary.pendingSettlement.toFixed(2)}</h2>
            </div>
          </div>
        </div>

        {orders.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-[20px] sm:p-[25px] mt-[25px] shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-[20px] mb-6">
              <h2 className="m-0 text-xl sm:text-[22px] text-gray-800 font-bold">{t('farmer.orders')}</h2>
              <div className="w-full lg:flex-1 lg:max-w-[400px] flex items-center border border-gray-300 rounded-lg px-[15px] bg-gray-50 transition-colors focus-within:bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">
                <span className="text-[18px] text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder={t('farmer.searchOrdersPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-none bg-transparent py-[12px] px-[10px] text-[15px] outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="border-none bg-transparent text-gray-400 cursor-pointer font-bold px-[5px] hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            {searchTerm.trim() && (
              <p className="m-0 mt-3 sm:mt-0 text-sm text-gray-600">
                {filteredOrders.length}{' '}
                {filteredOrders.length === 1 ? t('orders.orderSingular') : t('orders.orderPlural')}
              </p>
            )}
          </section>
        )}

        {orders.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-[20px] sm:p-[25px] mt-[25px] shadow-sm">
            <h2 className="m-0 mb-4 sm:mb-5 text-xl sm:text-[22px] text-gray-800 font-bold">
              {t('farmer.orders')}
            </h2>
            <div className="flex flex-wrap gap-[10px]">
              {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'paid', 'settlement_pending'].map(
                (filterName) => {
                  const filterLabels = {
                    all: t('farmer.allOrdersFilter', { count: orders.length }),
                    pending: t('farmer.pendingOrdersFilter'),
                    confirmed: t('farmer.confirmedOrdersFilter'),
                    shipped: t('farmer.shippedOrdersFilter'),
                    delivered: t('farmer.deliveredOrdersFilter'),
                    paid: t('farmer.settlementPaidFilter'),
                    settlement_pending: t('farmer.settlementPendingFilter'),
                  }

                  return (
                    <button
                      key={filterName}
                      onClick={() => setFilter(filterName)}
                      className={`px-[16px] py-[10px] rounded-full border cursor-pointer font-bold text-sm transition-colors ${
                        filter === filterName
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {filterLabels[filterName]}
                    </button>
                  )
                }
              )}
            </div>
          </section>
        )}

        {!message && orders.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-[40px] sm:p-[60px_20px] mt-[30px] text-center shadow-sm">
            <div className="text-[50px] mb-[15px]">📦</div>
            <h2 className="m-0 mb-2.5 text-xl sm:text-[24px] text-gray-800 font-bold">
              {t('farmer.noOrdersYet')}
            </h2>
            <p className="m-0 text-gray-500 text-[15px]">{t('farmer.noOrdersDesc')}</p>
          </div>
        )}

        {orders.length > 0 && filteredOrders.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-[40px] sm:p-[60px_20px] mt-[30px] text-center shadow-sm">
            <div className="text-[50px] mb-[15px]">🔍</div>
            <h3 className="m-0 mb-2.5 text-xl sm:text-[22px] text-gray-800 font-bold">
              {t('farmer.noMatchingOrders')}
            </h3>
            <p className="m-0 mb-4 sm:mb-5 text-gray-500 text-[15px]">
              {t('farmer.noMatchingOrdersDesc')}
            </p>
            {searchTerm.trim() && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-[20px] py-[10px] border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-bold hover:bg-gray-50"
              >
                {t('farmer.resetFilters')}
              </button>
            )}
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="flex flex-col gap-[25px] mt-[30px]">
            {filteredOrders.map((item) => {
              const order = item.order
              if (!order) return null
              const nextAction = getNextAction(order.order_status)
              const orderStatus = String(order.order_status || '').toLowerCase()
              const settlementStatus = String(item.settlement_status || 'pending').toLowerCase()

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 p-[20px] sm:p-[20px_25px] border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[15px]">
                    <div>
                      <p className="m-0 mb-1 text-[11px] font-bold tracking-wider text-gray-500">
                        {t('farmer.productOrderTag')}
                      </p>
                      <h2 className="m-0 mb-1 text-lg sm:text-[20px] text-gray-800 font-bold">{item.product_name}</h2>
                      <p className="m-0 text-sm text-gray-500 font-bold">
                        {t('orders.orderId')}: {item.order_id}
                      </p>
                    </div>
                    <div className={`px-[12px] py-[6px] rounded-full text-xs font-bold uppercase tracking-wider border border-current ${getStatusStyle(order.order_status)}`}>
                      {ts(order.order_status) || t('orders.statusUnknown')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200 bg-white">
                    <div className="p-[15px] sm:p-[20px]">
                      <span className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">
                        {t('farmer.customerPrice')}
                      </span>
                      <strong className="text-[17px] text-gray-800 font-bold">
                        ₹{Number(item.price || 0).toFixed(2)} / {tu(item.unit)}
                      </strong>
                    </div>
                    <div className="p-[15px] sm:p-[20px]">
                      <span className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">
                        {t('common.quantity')}
                      </span>
                      <strong className="text-[17px] text-gray-800 font-bold">
                        {item.quantity} {tu(item.unit)}
                      </strong>
                    </div>
                    <div className="p-[15px] sm:p-[20px]">
                      <span className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">
                        {t('farmer.customerTotal')}
                      </span>
                      <strong className="text-[17px] text-gray-800 font-bold">
                        ₹{Number(item.item_total || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="m-[15px] sm:m-[25px] border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-[#fafafa] p-[15px] sm:p-[20px] border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[15px]">
                      <div>
                        <h3 className="m-0 mb-1 text-lg sm:text-[18px] text-gray-800 font-bold">
                          🌾 {t('farmer.farmerEarningsLabel')}
                        </h3>
                        <p className="m-0 text-[13px] text-gray-500 font-medium">{t('farmer.earningsSubtitle')}</p>
                      </div>
                      <div className={`px-[12px] py-[6px] rounded-full text-[11px] font-bold uppercase tracking-wider ${getSettlementStyle(settlementStatus)}`}>
                        {settlementStatus === 'paid'
                          ? `✓ ${t('farmer.settlementPaid')}`
                          : `⏳ ${t('farmer.settlementPending')}`}
                      </div>
                    </div>
                    <div className="p-[15px] sm:p-[20px] bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('farmer.farmerPrice')}
                        </span>
                        <strong className="text-[15px] text-gray-800">
                          ₹{Number(item.farmer_price || 0).toFixed(2)} / {tu(item.unit)}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('farmer.farmerAmount')}
                        </span>
                        <strong className="text-[15px] text-gray-800">
                          ₹{item.calculatedFarmerAmount.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('farmer.platformCommission')}
                        </span>
                        <strong className="text-[15px] text-red-600">
                          ₹{item.calculatedCommission.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('farmer.settlementAmount')}
                        </span>
                        <strong className="text-[15px] sm:text-[17px] text-green-700 font-bold">
                          ₹{item.calculatedSettlement.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                    {settlementStatus === 'paid' && item.settlement_paid_at && (
                      <div className="bg-emerald-50 px-[20px] py-[10px] text-xs font-bold text-emerald-800 border-t border-emerald-100">
                        {t('farmer.paidOn', { date: new Date(item.settlement_paid_at).toLocaleString(locale) })}
                      </div>
                    )}
                  </div>

                  <div className="px-[15px] sm:px-[25px] pb-[25px] border-b border-gray-200">
                    <h3 className="m-0 mb-4 text-base text-gray-800 font-bold">{t('farmer.customerDetails')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px] sm:gap-[20px] mb-4">
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('common.name')}
                        </span>
                        <strong className="text-[14px] text-gray-800 font-medium">{order.customer_name || '-'}</strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('common.phone')}
                        </span>
                        <strong className="text-[14px] text-gray-800 font-medium">{order.customer_phone || '-'}</strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('common.district')}
                        </span>
                        <strong className="text-[14px] text-gray-800 font-medium">{order.district || '-'}</strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                          {t('common.villageTown')}
                        </span>
                        <strong className="text-[14px] text-gray-800 font-medium">{order.village || '-'}</strong>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-[15px] rounded-lg">
                      <span className="block text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                        {t('farmer.deliveryAddress')}
                      </span>
                      <strong className="text-[14px] text-gray-800 font-medium">
                        {order.delivery_address || '-'}
                      </strong>
                    </div>

                    <div className="mt-3 bg-blue-50/80 border border-blue-200/80 p-3 rounded-lg text-xs text-blue-900">
                      <strong>{t('farmer.parcelInstructionTitle')}</strong> {t('farmer.parcelInstructionBody')}
                    </div>
                  </div>

                  <div className="p-[15px] sm:p-[20px_25px] bg-[#fafcf9] border-b border-gray-200 flex justify-end">
                    {nextAction ? (
                      <button
                        onClick={() => {
                          if (!nextAction.disabled) {
                            updateOrderStatus(order.id, nextAction.nextStatus)
                          }
                        }}
                        disabled={nextAction.disabled || updating === order.id}
                        className={`w-full sm:w-auto px-[20px] sm:px-[24px] py-[12px] sm:py-[14px] border-none rounded-lg text-white font-bold cursor-pointer text-sm sm:text-base ${
                          nextAction.disabled || updating === order.id
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-green-700 hover:bg-green-800'
                        }`}
                      >
                        {updating === order.id ? t('common.pleaseWait') : nextAction.text}
                      </button>
                    ) : orderStatus === 'delivered' ? (
                      <div className="bg-emerald-50 text-emerald-800 px-[16px] py-[12px] rounded-lg font-bold w-full text-center sm:w-auto border border-emerald-200">
                        ✓ {t('farmer.deliveryConfirmedCustomer')}
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-500 px-[16px] py-[12px] rounded-lg font-bold w-full text-center sm:w-auto">
                        —
                      </div>
                    )}
                  </div>

                  <div className="p-[15px] sm:p-[20px_25px] bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                        {t('orders.paymentStatusLabel')}
                      </span>
                      <strong className="text-[13px] text-gray-800 font-bold capitalize">
                        {ts(order.payment_status) || '-'}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                        {t('orders.orderDate')}
                      </span>
                      <strong className="text-[13px] text-gray-800 font-bold">
                        {order.created_at ? new Date(order.created_at).toLocaleString(locale) : '-'}
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