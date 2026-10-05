'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AddProduct() {
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [stock, setStock] = useState('')
  const [variants, setVariants] = useState([{ price: '', unitCount: '1', unit: 'kg', deliveryPrice: '' }])
  const [images, setImages] = useState([])

  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  const addVariant = () => {
    setVariants([...variants, { price: '', unitCount: '1', unit: 'kg', deliveryPrice: '' }])
  }

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  useEffect(() => {
    async function checkFarmerAndLoadCategories() {
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

      if (profileError || !profile || profile.role !== 'farmer') {
        router.replace('/')
        return
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoryError) {
        setMessage(categoryError.message)
      } else {
        setCategories(categoryData || [])
      }

      setLoading(false)
    }

    checkFarmerAndLoadCategories()
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()

    setMessage('')

    if (!name || !categoryId || !stock) {
      setMessage('Please fill product name, category, and stock.')
      return
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (!v.price || !v.unit || !v.unitCount) {
        setMessage(`Please fill all fields for Variant ${i + 1}.`)
        return
      }
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    let imageUrls = []

    if (images.length > 0) {
      for (const img of images) {
        const fileExtension = img.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, img)

        if (uploadError) {
          setMessage(`Image upload failed: ${uploadError.message}`)
          setSaving(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        imageUrls.push(publicUrlData.publicUrl)
      }
    }

    const rowsToInsert = variants.map((v) => ({
      farmer_id: user.id,
      category_id: categoryId,
      name: variants.length > 1 ? `${name} - ${v.unitCount} ${v.unit}` : name,
      description: description,
      price: Number(v.price),
      unit: v.unit,
      unit_count: Number(v.unitCount),
      delivery_price: Number(v.deliveryPrice || 0),
      stock_quantity: Number(stock),
      image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      images: imageUrls,
      status: 'active',
      approval_status: 'pending',
      commission_amount: 0,
    }))

    const { error: productError } = await supabase
      .from('products')
      .insert(rowsToInsert)

    if (productError) {
      setMessage(`Product save failed: ${productError.message}`)
      setSaving(false)
      return
    }

    setMessage('Products submitted successfully! Waiting for admin approval.')

    setName('')
    setDescription('')
    setCategoryId('')
    setStock('')
    setVariants([{ price: '', unitCount: '1', unit: 'kg', deliveryPrice: '' }])
    setImages([])

    const fileInput = document.getElementById('product-image')

    if (fileInput) {
      fileInput.value = ''
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5]">
        <p className="text-base text-gray-500">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] font-sans">
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center">
        <div className="text-xl sm:text-2xl font-bold text-green-800">
          🌾 Uzhavar Market
        </div>
        <button
          onClick={() => router.push('/farmer')}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          ← Dashboard
        </button>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-[700px] mx-auto py-8 sm:py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-9 shadow-md">
          <h1 className="m-0 mb-2 text-gray-800 text-2xl sm:text-[30px] font-bold">
            Add New Product
          </h1>
          <p className="m-0 mb-6 sm:mb-[30px] text-gray-500 text-sm sm:text-base">
            Add your farm product for admin approval. You can add multiple price/unit combinations.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-2">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Organic Tomato"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Total Stock Quantity *
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Example: 100"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon || '🌱'} {category.name}
                </option>
              ))}
            </select>

            <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your product..."
              rows="5"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] resize-y bg-white outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all font-sans"
            />

            <div className="mt-8 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 m-0">Pricing & Variants</h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-bold hover:bg-green-200 transition-colors"
                >
                  + Add Variant
                </button>
              </div>
              
              {variants.map((v, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-4 relative">
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      ✕ Remove
                    </button>
                  )}
                  
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Variant {index + 1}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Price *</label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-800"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Unit Count *</label>
                      <input
                        type="number"
                        value={v.unitCount}
                        onChange={(e) => handleVariantChange(index, 'unitCount', e.target.value)}
                        placeholder="e.g. 1"
                        min="0"
                        step="0.01"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Unit *</label>
                      <select
                        value={v.unit}
                        onChange={(e) => handleVariantChange(index, 'unit', e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-800"
                        required
                      >
                        <option value="kg">kg</option>
                        <option value="g">gram</option>
                        <option value="litre">litre</option>
                        <option value="ml">ml</option>
                        <option value="piece">piece</option>
                        <option value="packet">packet</option>
                        <option value="box">box</option>
                          <option value="bag">bag</option>
                          <option value="5kg bag">5kg bag</option>
                          <option value="10kg bag">10kg bag</option>
                          <option value="25kg bag">25kg bag</option>
                          <option value="50kg bag">50kg bag</option>
                        <option value="dozen">dozen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Delivery Price *</label>
                      <input
                        type="number"
                        value={v.deliveryPrice}
                        onChange={(e) => handleVariantChange(index, 'deliveryPrice', e.target.value)}
                        placeholder="e.g. 20"
                        min="0"
                        step="0.01"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-800"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
              Product Images (Max 4)
            </label>
            <input
              id="product-image"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files)
                if (files.length > 4) {
                  alert("You can only upload up to 4 images.")
                  setImages(files.slice(0, 4))
                } else {
                  setImages(files)
                }
              }}
              className="w-full py-2 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-800 hover:file:bg-green-100 transition-all cursor-pointer"
            />
            {images.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">{images.length} image(s) selected.</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full p-3.5 mt-7 border-none rounded-lg bg-green-800 text-white text-base font-semibold cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Submitting Products...' : 'Submit Products'}
            </button>
          </form>

          {message && (
            <p className={`mt-5 text-center text-sm font-medium ${message.includes('failed') || message.includes('Please') ? 'text-red-600' : 'text-green-800'}`}>
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}