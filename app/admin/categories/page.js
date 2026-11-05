'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Curated list of agricultural & farm emojis for quick selection
const EMOJI_PALETTE = [
  '🌾', '🥕', '🍎', '🥬', '🍅', '🥔', '🧅', '🌽',
  '🍌', '🍇', '🥭', '🍉', '🍓', '🍊', '🥥', '🌶️',
  '🫒', '🌿', '🌸', '🍯', '🥛', '🧀', '🥚', '🥩',
  '🐟', '🐄', '🍚', '🥜', '🪴', '🧪', '🥫', '📦'
]

export default function AdminCategoriesPage() {
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'with_products' | 'empty'
  const [expandedCatId, setExpandedCatId] = useState(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Add Category Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('🌱')
  const [addDescription, setAddDescription] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [savingAdd, setSavingAdd] = useState(false)

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete Category Modal State
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [reassignToCatId, setReassignToCatId] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // =====================================================
  // LOAD DATA & VERIFY ADMIN
  // =====================================================
  async function loadData(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      router.replace('/')
      return
    }

    // Load categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (catError) {
      console.error('CATEGORIES LOAD ERROR:', catError)
      setError('Unable to load categories: ' + catError.message)
      setLoading(false)
      setRefreshing(false)
      return
    }

    // Load all products to compute counts & support product-based category assignment
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category_id,
        price,
        status,
        approval_status,
        profiles (
          full_name,
          farm_name
        )
      `)

    if (prodError) {
      console.error('PRODUCTS LOAD ERROR:', prodError)
    }

    setCategories(catData || [])
    setProducts(prodData || [])
    setLoading(false)
    setRefreshing(false)
  }

  // Map category ID to list of products
  const categoryProductsMap = useMemo(() => {
    const map = {}
    products.forEach((p) => {
      const cid = p.category_id || 'uncategorized'
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    })
    return map
  }, [products])

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const count = (categoryProductsMap[cat.id] || []).length
      const q = search.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        cat.name.toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q)

      let matchesFilter = true
      if (filter === 'with_products') matchesFilter = count > 0
      if (filter === 'empty') matchesFilter = count === 0

      return matchesSearch && matchesFilter
    })
  }, [categories, categoryProductsMap, search, filter])

  // =====================================================
  // ADD CATEGORY (WITH OPTIONAL PRODUCT ASSIGNMENT)
  // =====================================================
  function openAddModal() {
    setAddName('')
    setAddIcon('🌱')
    setAddDescription('')
    setSelectedProductIds([])
    setProductSearch('')
    setShowAddModal(true)
    setMessage('')
    setError('')
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!addName.trim()) {
      setError('Please enter a category name.')
      return
    }

    setSavingAdd(true)
    setError('')
    setMessage('')

    try {
      // 1. Insert into categories
      const { data: newCat, error: insertError } = await supabase
        .from('categories')
        .insert({
          name: addName.trim(),
          icon: addIcon.trim() || '🌱',
          description: addDescription.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 2. If admin selected products to assign to this new category
      if (selectedProductIds.length > 0) {
        const { error: assignError } = await supabase
          .from('products')
          .update({ category_id: newCat.id })
          .in('id', selectedProductIds)

        if (assignError) {
          console.error('ASSIGN PRODUCTS ERROR:', assignError)
        }
      }

      setShowAddModal(false)
      setMessage(`Category "${newCat.name}" added successfully! ${selectedProductIds.length > 0 ? `(${selectedProductIds.length} products assigned)` : ''}`)
      await loadData(true)
    } catch (err) {
      console.error('ADD CATEGORY ERROR:', err)
      setError(err?.message || 'Failed to add category.')
    } finally {
      setSavingAdd(false)
    }
  }

  // =====================================================
  // EDIT CATEGORY
  // =====================================================
  function openEditModal(cat) {
    setEditingCategory(cat)
    setEditName(cat.name || '')
    setEditIcon(cat.icon || '🌱')
    setEditDescription(cat.description || '')
    setMessage('')
    setError('')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editName.trim()) {
      setError('Please enter a category name.')
      return
    }

    setSavingEdit(true)
    setError('')
    setMessage('')

    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: editName.trim(),
          icon: editIcon.trim() || '🌱',
          description: editDescription.trim() || null,
        })
        .eq('id', editingCategory.id)

      if (updateError) throw updateError

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: editName.trim(),
                icon: editIcon.trim() || '🌱',
                description: editDescription.trim() || null,
              }
            : c
        )
      )

      setEditingCategory(null)
      setMessage(`Category "${editName.trim()}" updated successfully!`)
    } catch (err) {
      console.error('UPDATE CATEGORY ERROR:', err)
      setError(err?.message || 'Failed to update category.')
    } finally {
      setSavingEdit(false)
    }
  }

  // =====================================================
  // DELETE CATEGORY (WITH SMART PRODUCT REASSIGNMENT)
  // =====================================================
  function openDeleteModal(cat) {
    const assignedProducts = categoryProductsMap[cat.id] || []
    setDeletingCategory(cat)

    // Preselect 'Other' or first available alternative category
    const otherCat = categories.find(
      (c) => c.id !== cat.id && c.name.toLowerCase() === 'other'
    )
    const fallbackCat = categories.find((c) => c.id !== cat.id)
    setReassignToCatId(otherCat?.id || fallbackCat?.id || '')
    setMessage('')
    setError('')
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return

    const assignedCount = (categoryProductsMap[deletingCategory.id] || []).length

    setIsDeleting(true)
    setError('')
    setMessage('')

    try {
      // 1. If category has products, reassign them first
      if (assignedCount > 0) {
        if (!reassignToCatId) {
          throw new Error('Please select a category to reassign the existing products to.')
        }

        const { error: reassignError } = await supabase
          .from('products')
          .update({ category_id: reassignToCatId })
          .eq('category_id', deletingCategory.id)

        if (reassignError) throw reassignError
      }

      // 2. Delete the category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id)

      if (deleteError) throw deleteError

      const deletedName = deletingCategory.name
      setDeletingCategory(null)
      setMessage(`Category "${deletedName}" removed successfully! ${assignedCount > 0 ? `(${assignedCount} products moved to new category)` : ''}`)
      await loadData(true)
    } catch (err) {
      console.error('DELETE CATEGORY ERROR:', err)
      setError(err?.message || 'Failed to remove category.')
    } finally {
      setIsDeleting(false)
    }
  }

  // =====================================================
  // QUICK REASSIGN INDIVIDUAL PRODUCT
  // =====================================================
  async function handleReassignProduct(productId, newCatId) {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: newCatId })
        .eq('id', productId)

      if (updateError) throw updateError

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, category_id: newCatId } : p))
      )
      setMessage('Product reassigned to new category!')
    } catch (err) {
      console.error('PRODUCT REASSIGN ERROR:', err)
      setError(err?.message || 'Failed to reassign product.')
    }
  }

  // =====================================================
  // UI RENDER
  // =====================================================
  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] dark:bg-[#0b1120] font-sans">
        <div className="bg-white dark:bg-[#1e293b] px-10 py-8 rounded-2xl border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200 max-w-sm w-full shadow-sm">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="font-semibold text-base">Loading categories...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] dark:bg-[#0b1120] font-sans pb-16">
      {/* NAVBAR */}
      <nav className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 py-4 px-4 sm:px-[6%] flex justify-between items-center flex-wrap gap-4 sticky top-0 z-40 shadow-xs">
        <div className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
          <span>🌾</span>
          <span>Uzhavar Market Admin</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="py-2 px-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
          </button>

          <button
            onClick={() => router.push('/admin/products')}
            className="py-2 px-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            📦 Products
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="py-2 px-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            ← Admin Dashboard
          </button>
        </div>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-[1300px] mx-auto pt-6 sm:pt-8">
        {/* HEADER & QUICK STATS */}
        <div className="bg-white dark:bg-[#1e293b] p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🏷️</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white m-0">
                Manage Categories
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 m-0 mt-1">
              Add new categories, edit category names & icons, or remove categories with automatic product reassignment.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={openAddModal}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm sm:text-base cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <span>➕</span>
              <span>Add New Category</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTICES */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>{message}</span>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-rose-700 hover:text-rose-900 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* CONTROLS: SEARCH & FILTERS */}
        <div className="bg-white dark:bg-[#1e293b] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search category name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter:</span>
            {[
              { id: 'all', label: `All (${categories.length})` },
              { id: 'with_products', label: 'With Products' },
              { id: 'empty', label: 'Empty (0)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filter === f.id
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* CATEGORY GRID */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-[#1e293b] p-12 text-center rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">🏷️</div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No categories found</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              {search ? 'Try adjusting your search criteria.' : 'Click "Add New Category" to create your first category.'}
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-semibold text-sm cursor-pointer"
            >
              + Add Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((category) => {
              const assignedProducts = categoryProductsMap[category.id] || []
              const isExpanded = expandedCatId === category.id

              return (
                <div
                  key={category.id}
                  className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon + Name + Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800">
                          {category.icon || '🌱'}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0 leading-snug">
                            {category.name}
                          </h3>
                          <span className="text-[11px] text-gray-400 font-mono">
                            ID: {category.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          assignedProducts.length > 0
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                      >
                        {assignedProducts.length} {assignedProducts.length === 1 ? 'product' : 'products'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[36px]">
                      {category.description || 'No description provided.'}
                    </p>

                    {/* Collapsible Products List */}
                    {assignedProducts.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedCatId(isExpanded ? null : category.id)}
                          className="text-xs font-bold text-green-700 dark:text-green-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{isExpanded ? '▼ Hide Products' : '▶ View Products (' + assignedProducts.length + ')'}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-gray-800 max-h-56 overflow-y-auto space-y-2">
                            {assignedProducts.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
                              >
                                <div className="truncate">
                                  <strong className="text-gray-900 dark:text-white block truncate">{p.name}</strong>
                                  <span className="text-gray-500 text-[10px]">
                                    Farmer: {p.profiles?.farm_name || p.profiles?.full_name || 'Farmer'} • ₹{p.price}
                                  </span>
                                </div>

                                {/* Reassign dropdown */}
                                <select
                                  value={p.category_id}
                                  onChange={(e) => handleReassignProduct(p.id, e.target.value)}
                                  className="text-[11px] py-1 px-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-700 dark:text-gray-200 max-w-[110px]"
                                  title="Reassign to another category"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.icon} {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => openEditModal(category)}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] hover:bg-gray-50 text-gray-700 dark:text-gray-200 font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => openDeleteModal(category)}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span>🗑️</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL: ADD NEW CATEGORY (WITH PRODUCT-BASED CREATION)
          ===================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">➕</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">
                  Add New Category
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cold Pressed Oils, Spices, Dairy..."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 font-medium"
                />
              </div>

              {/* Category Icon */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Icon / Emoji
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 flex items-center justify-center text-2xl shrink-0">
                    {addIcon || '🌱'}
                  </div>
                  <input
                    type="text"
                    value={addIcon}
                    onChange={(e) => setAddIcon(e.target.value)}
                    placeholder="Type or select emoji below"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600"
                  />
                </div>

                {/* Emoji Palette */}
                <div className="p-2.5 bg-gray-50 dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAddIcon(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                        addIcon === emoji
                          ? 'bg-green-200 dark:bg-green-800 border border-green-600'
                          : 'bg-white dark:bg-[#1e293b] hover:bg-green-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of products under this category..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600"
                />
              </div>

              {/* PRODUCT-BASED CREATION: ASSIGN EXISTING PRODUCTS */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Assign Existing Products (Optional)
                  </label>
                  <span className="text-xs text-green-700 dark:text-green-400 font-semibold">
                    {selectedProductIds.length} selected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Select products to automatically group and move under this new category:
                </p>

                <input
                  type="text"
                  placeholder="Search products to assign..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white mb-2"
                />

                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-gray-50 dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-gray-800">
                  {products
                    .filter((p) =>
                      productSearch === '' ||
                      p.name.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((p) => {
                      const isSelected = selectedProductIds.includes(p.id)
                      const currentCat = categories.find((c) => c.id === p.category_id)

                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 cursor-pointer text-xs hover:border-green-500"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds((prev) => [...prev, p.id])
                                } else {
                                  setSelectedProductIds((prev) =>
                                    prev.filter((id) => id !== p.id)
                                  )
                                }
                              }}
                              className="accent-green-700 w-4 h-4 rounded cursor-pointer"
                            />
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                              {p.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                            Current: {currentCat?.name || 'None'}
                          </span>
                        </label>
                      )
                    })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={savingAdd}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 font-semibold text-sm cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingAdd ? 'Adding Category...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: EDIT CATEGORY
          ===================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">✏️</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">
                  Edit Category
                </h2>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Icon / Emoji
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 flex items-center justify-center text-2xl shrink-0">
                    {editIcon || '🌱'}
                  </div>
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600"
                  />
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditIcon(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                        editIcon === emoji
                          ? 'bg-green-200 dark:bg-green-800 border border-green-600'
                          : 'bg-white dark:bg-[#1e293b]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm outline-none focus:border-green-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={savingEdit}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 font-semibold text-sm cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: REMOVE CATEGORY (WITH REASSIGNMENT SAFETY)
          ===================================================== */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <span className="text-3xl">⚠️</span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">
                Remove Category
              </h2>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to remove the category{' '}
              <strong className="text-gray-900 dark:text-white">
                "{deletingCategory.icon} {deletingCategory.name}"
              </strong>
              ?
            </p>

            {/* If products exist in this category */}
            {(categoryProductsMap[deletingCategory.id] || []).length > 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl mb-5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-xs">
                  <span>ℹ️</span>
                  <span>
                    {(categoryProductsMap[deletingCategory.id] || []).length} products are currently linked to this category!
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  To protect active product listings and avoid database errors, select a category to reassign these products to:
                </p>

                <select
                  value={reassignToCatId}
                  onChange={(e) => setReassignToCatId(e.target.value)}
                  className="w-full mt-2 p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-xs font-semibold"
                >
                  {categories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Move to: {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-5 text-xs text-emerald-800 dark:text-emerald-300">
                ✓ No products are linked to this category. It can be safely removed.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 font-semibold text-sm cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting
                  ? 'Removing...'
                  : (categoryProductsMap[deletingCategory.id] || []).length > 0
                  ? 'Reassign & Remove'
                  : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
