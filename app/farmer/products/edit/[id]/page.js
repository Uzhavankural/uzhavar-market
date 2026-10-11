'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showToast, setFlashToast } from '@/app/components/Toast'

export default function EditProduct() {
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [unitCount, setUnitCount] = useState('1')
  const [unit, setUnit] = useState('')
  const [stock, setStock] = useState('')
  const [deliveryPrice, setDeliveryPrice] = useState('')
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [existingVideo, setExistingVideo] = useState(null)
  const [newVideoFile, setNewVideoFile] = useState(null)
  const [newVideoPreview, setNewVideoPreview] = useState(null)

  
  const [newVariants, setNewVariants] = useState([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleNewVariantChange = (index, field, value) => {
    const updated = [...newVariants]
    updated[index][field] = value
    setNewVariants(updated)
  }

  const addNewVariant = () => {
    setNewVariants([...newVariants, { price: '', unitCount: '1', unit: 'kg', deliveryPrice: '' }])
  }

  const removeNewVariant = (index) => {
    setNewVariants(newVariants.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (params?.id) {
      loadProduct()
    }
  }, [params?.id])

  async function loadProduct() {
    setLoading(true)
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

    if (profileError || !profile || profile.role !== 'farmer') {
      router.replace('/')
      return
    }

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('farmer_id', user.id)
      .single()

    if (productError || !productData) {
      setError('Product not found or you do not have permission to edit it.')
      setLoading(false)
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (categoryError) {
      console.log('CATEGORY ERROR:', categoryError)
    }

    setProduct(productData)
    setCategories(categoryData || [])

    setName(productData.name || '')
    setCategoryId(productData.category_id || '')
    setDescription(productData.description || '')
    setPrice(productData.price ?? '')
    setUnitCount(productData.unit_count ?? '1')
    setUnit(productData.unit || '')
    setStock(productData.stock_quantity ?? '')
    setDeliveryPrice(productData.delivery_price ?? '0')

    const initialImages = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : (productData.image_url ? [productData.image_url] : [])
    setExistingImages(initialImages)
    setExistingVideo(productData.video_url || null)
    setNewImages([])
    setNewVideoFile(null)
    setNewVideoPreview(null)


    setLoading(false)
  }

  const commission = useMemo(() => {
    return Number(product?.commission_amount || 0)
  }, [product])

  const customerPrice = useMemo(() => {
    return Number(price || 0) + commission
  }, [price, commission])

  
  function handleNewImagesChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const totalCurrent = existingImages.length + newImages.length
    const availableSlots = 4 - totalCurrent

    if (availableSlots <= 0) {
      alert('You can only have up to 4 images in total.')
      e.target.value = ''
      return
    }

    if (files.length > availableSlots) {
      alert(`You can only add ${availableSlots} more image(s). Only the first ${availableSlots} were added.`)
    }

    const toAdd = files.slice(0, availableSlots)
    setNewImages(prev => [...prev, ...toAdd])
    e.target.value = ''
  }

  function handleRemoveExistingImage(index) {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleRemoveNewImage(index) {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleNewVideoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.')
      e.target.value = ''
      return
    }

    const tempUrl = URL.createObjectURL(file)
    const videoElem = document.createElement('video')
    videoElem.preload = 'metadata'
    videoElem.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElem.src)
      const duration = videoElem.duration
      if (duration > 60) {
        alert(`Video duration is ${Math.round(duration)} seconds. Maximum allowed duration is 1 minute (60 seconds).`)
        e.target.value = ''
        setNewVideoFile(null)
        setNewVideoPreview(null)
      } else {
        setNewVideoFile(file)
        setNewVideoPreview(tempUrl)
      }
    }
    videoElem.onerror = () => {
      alert('Unable to load video metadata. Please select another video file.')
      e.target.value = ''
    }
    videoElem.src = tempUrl
  }

  function handleRemoveExistingVideo() {
    setExistingVideo(null)
  }

  function handleRemoveNewVideo() {
    if (newVideoPreview) {
      try { window.URL.revokeObjectURL(newVideoPreview) } catch (e) {}
    }
    setNewVideoFile(null)
    setNewVideoPreview(null)
    const input = document.getElementById('edit-product-video')
    if (input) input.value = ''
  }

  async function handleUpdate(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    const trimmedName = name.trim()
    const trimmedUnit = unit.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName || !categoryId || !price || !trimmedUnit || (!trimmedUnit.includes('bag') && !unitCount) || stock === '') {
      setError('Please fill all required fields for the main product.')
      return
    }

    for (let i = 0; i < newVariants.length; i++) {
      const v = newVariants[i]
      if (!v.price || !v.unit || (!v.unit.includes('bag') && !v.unitCount)) {
        setError(`Please fill all fields for New Variant ${i + 1}.`)
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

    // Upload new images if any
    let uploadedNewImages = []
    if (newImages.length > 0) {
      for (const img of newImages) {
        const fileExtension = img.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, img)

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`)
          setSaving(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        uploadedNewImages.push(publicUrlData.publicUrl)
      }
    }

    const finalImages = [...existingImages, ...uploadedNewImages].slice(0, 4)

    // Upload new video if any
    let finalVideoUrl = existingVideo
    if (newVideoFile) {
      const fileExtension = newVideoFile.name.split('.').pop() || 'mp4'
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-video.${fileExtension}`

      const { error: videoUploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, newVideoFile)

      if (videoUploadError) {
        setError(`Video upload failed: ${videoUploadError.message}`)
        setSaving(false)
        return
      }

      const { data: videoUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      finalVideoUrl = videoUrlData.publicUrl
    }

    const isMainBag = trimmedUnit.includes('bag');
    const finalMainUnitCount = isMainBag ? 1 : Number(unitCount);

    const updatePayload = {
      name: trimmedName,
      category_id: categoryId,
      description: trimmedDescription,
      price: Number(price),
      unit_count: finalMainUnitCount,
      unit: trimmedUnit,
      delivery_price: Number(deliveryPrice || 0),
      stock_quantity: Number(stock),
      image_url: finalImages.length > 0 ? finalImages[0] : null,
      images: finalImages,
      video_url: finalVideoUrl,
    }

    // Update existing product
    let { error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('farmer_id', user.id)

    if (updateError && updateError.message && updateError.message.includes('video_url')) {
      console.warn('video_url column does not exist yet. Retrying update without video_url.');
      const { video_url, ...fallbackPayload } = updatePayload;
      const { error: fallbackError } = await supabase
        .from('products')
        .update(fallbackPayload)
        .eq('id', params.id)
        .eq('farmer_id', user.id);
      if (!fallbackError) {
        updateError = null;
        alert('Product updated! Note: To save videos, run in Supabase SQL editor: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;');
      }
    }

    if (updateError) {
      console.log('UPDATE ERROR:', updateError)
      setError(`Unable to update product: ${updateError.message || 'Unknown error'}`)
      setSaving(false)
      return
    }

    // Insert new variants if any
    if (newVariants.length > 0) {
      const newProducts = newVariants.map((v) => {
        const isBag = v.unit.includes('bag');
        const finalUnitCount = isBag ? 1 : Number(v.unitCount);
        return {
          farmer_id: user.id,
          category_id: categoryId,
          name: `${trimmedName} - ${isBag ? '' : finalUnitCount + ' '}${v.unit}`,
          description: trimmedDescription,
          price: Number(v.price),
          unit_count: finalUnitCount,
          unit: v.unit,
          delivery_price: Number(v.deliveryPrice || 0),
          stock_quantity: Number(stock),
          image_url: finalImages.length > 0 ? finalImages[0] : null,
          images: finalImages,
          video_url: finalVideoUrl,
          status: 'active',
          approval_status: 'pending',
          commission_amount: 0,
        }
      })

      let { error: insertError } = await supabase
        .from('products')
        .insert(newProducts)

      if (insertError && insertError.message && insertError.message.includes('video_url')) {
        const fallbackVariants = newProducts.map(({ video_url, ...rest }) => rest);
        const { error: fallbackInsertErr } = await supabase.from('products').insert(fallbackVariants);
        if (!fallbackInsertErr) {
          insertError = null;
        }
      }

      if (insertError) {
        console.log('INSERT ERROR:', insertError)
        setError(`Main product updated, but failed to create new variants: ${insertError.message || 'Unknown error'}`)
        setSaving(false)
        return
      }
    }

    const successText = 'Your changes are saved! Product updated successfully.'
    setSuccess(successText)
    showToast(successText, 'success', 4000)
    setFlashToast(successText, 'success', 4000)

    setTimeout(() => {
      router.push('/farmer/products')
    }, 800)
  }

  function getApprovalLabel(status) {
    if (status === 'active') return '✓ Approved'
    if (status === 'pending') return '⏳ Pending'
    if (status === 'rejected') return '✕ Rejected'

    return '— Not Set'
  }

  function getApprovalStyle(status) {
    if (status === 'active') {
      return 'bg-green-100 text-green-800'
    }
    if (status === 'pending') {
      return 'bg-yellow-100 text-yellow-800'
    }
    if (status === 'rejected') {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <div className="bg-white p-9 sm:p-12 rounded-2xl border border-gray-200 text-center text-gray-700">
          <div className="text-[40px] mb-2.5">🌾</div>
          <p className="m-0 text-base">Loading product...</p>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <div className="bg-white p-9 sm:p-12 rounded-2xl border border-gray-200 text-center text-gray-700">
          <div className="text-[40px] mb-2.5">⚠️</div>
          <p className="mb-5 text-gray-500">{error || 'Product not found.'}</p>
          <button
            onClick={() => router.push('/farmer/products')}
            className="px-[18px] py-[10px] border-none rounded-lg bg-green-800 text-white cursor-pointer font-semibold"
          >
            ← My Products
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center gap-4 flex-wrap">
        <div className="text-xl sm:text-[22px] font-bold text-green-800">🌾 Uzhavar Market</div>
        <button
          onClick={() => router.push('/farmer/products')}
          className="px-4 py-2 sm:px-[18px] sm:py-[9px] border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          ← My Products
        </button>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-[800px] mx-auto pt-[30px] sm:pt-[40px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[15px] mb-[25px] flex-wrap">
          <div>
            <h1 className="m-0 mb-2 text-2xl sm:text-[32px] text-gray-800 font-bold">Edit Product</h1>
            <p className="m-0 text-gray-500 text-sm sm:text-base">Update your product details or add new variants.</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full font-bold text-xs shadow-sm ${getApprovalStyle(product.approval_status)}`}>
            {getApprovalLabel(product.approval_status)}
          </div>
        </div>

        <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-[30px] shadow-sm">
          
          {/* MEDIA SECTION (Photos & Video) */}
          <div className="mb-6 p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="m-0 text-base font-bold text-gray-800">Product Photos & Video</h3>
              <span className="text-xs text-gray-500 font-semibold">Max 4 images + 1 video</span>
            </div>

            {/* PHOTOS (Max 4) */}
            <div className="mb-4">
              <label className="block mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                Photos ({existingImages.length + newImages.length}/4)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                  <div key={`exist-${idx}`} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-white flex items-center justify-center group shadow-sm">
                    <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Saved #{idx + 1}
                    </span>
                  </div>
                ))}

                {/* Newly Selected Images */}
                {newImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative rounded-lg overflow-hidden border border-green-400 aspect-square bg-white flex items-center justify-center group shadow-sm">
                    <img src={URL.createObjectURL(file)} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-green-700 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      New
                    </span>
                  </div>
                ))}
              </div>

              {existingImages.length + newImages.length < 4 && (
                <div>
                  <input
                    id="edit-product-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImagesChange}
                    className="w-full py-2 text-sm text-gray-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-800 hover:file:bg-green-100 transition-all cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add up to {4 - (existingImages.length + newImages.length)} more image(s).
                  </p>
                </div>
              )}
            </div>

            {/* VIDEO (Max 1, <= 60s) */}
            <div className="pt-3 border-t border-gray-200">
              <label className="block mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                Product Video (Max 1 video, up to 1:00 min)
              </label>

              {newVideoPreview ? (
                <div className="border border-green-300 rounded-xl p-3 bg-white mb-2 shadow-sm">
                  <div className="relative rounded-lg overflow-hidden bg-black mb-2">
                    <video src={newVideoPreview} controls className="w-full max-h-52 object-contain" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700 font-bold">✓ New Video Selected (within 1 min)</span>
                    <button
                      type="button"
                      onClick={handleRemoveNewVideo}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      Remove Video
                    </button>
                  </div>
                </div>
              ) : existingVideo ? (
                <div className="border border-gray-200 rounded-xl p-3 bg-white mb-2 shadow-sm">
                  <div className="relative rounded-lg overflow-hidden bg-black mb-2">
                    <video src={existingVideo} controls className="w-full max-h-52 object-contain" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 font-semibold">Current Saved Video</span>
                    <button
                      type="button"
                      onClick={handleRemoveExistingVideo}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      Remove Video
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    id="edit-product-video"
                    type="file"
                    accept="video/*"
                    onChange={handleNewVideoChange}
                    className="w-full py-2 text-sm text-gray-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a 1-minute video showcasing your farm produce or harvest.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-[18px]">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">Total Stock Quantity *</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="50"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <label className="block mb-2 mt-4 sm:mt-[18px] font-semibold text-gray-700 text-sm sm:text-base">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ''}
                {category.name}
              </option>
            ))}
          </select>

          <label className="block mb-2 mt-4 sm:mt-[18px] font-semibold text-gray-700 text-sm sm:text-base">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[100px] sm:min-h-[120px] p-2.5 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none resize-y focus:border-green-600 focus:ring-1 focus:ring-green-600 font-sans"
            placeholder="Describe your product"
          />

          <div className="mt-8 mb-2 font-bold text-lg border-b pb-2">Main Variant</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-[15px] mt-4 sm:mt-[18px]">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">Farmer Price *</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">
                <span className="pl-3 text-gray-500 font-semibold text-sm sm:text-base">₹</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2.5 sm:p-[12px_10px] border-none outline-none text-sm sm:text-[15px]"
                  placeholder="60"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            {!unit.includes('bag') && <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">Unit Count *</label>
              <input
                type="number"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                className="w-full p-2.5 sm:p-[13px_10px] border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="1"
                min="0"
                step="0.01"
                />
              </div>}
              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 sm:p-[13px_10px] border border-gray-300 rounded-lg text-sm sm:text-[15px] bg-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
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
              <label className="block mb-2 font-semibold text-gray-700 text-sm sm:text-base">Delivery Price</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">
                <span className="pl-3 text-gray-500 font-semibold text-sm sm:text-base">₹</span>
                <input
                  type="number"
                  value={deliveryPrice}
                  onChange={(e) => setDeliveryPrice(e.target.value)}
                  className="w-full p-2.5 sm:p-[12px_10px] border-none outline-none text-sm sm:text-[15px]"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 m-0">Add New Variants</h3>
              <button
                type="button"
                onClick={addNewVariant}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-bold hover:bg-green-200 transition-colors"
              >
                + Add Variant
              </button>
            </div>
            
            {newVariants.map((v, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-4 relative">
                <button
                  type="button"
                  onClick={() => removeNewVariant(index)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  ✕ Remove
                </button>
                
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  New Variant {index + 1}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Price *</label>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => handleNewVariantChange(index, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-800"
                      required
                    />
                  </div>
                  {!v.unit.includes('bag') && <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Unit Count *</label>
                    <input
                      type="number"
                      value={v.unitCount}
                      onChange={(e) => handleNewVariantChange(index, 'unitCount', e.target.value)}
                      placeholder="1"
                      min="0"
                      step="0.01"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-800"
                      required
                      />
                    </div>}
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Unit *</label>
                    <select
                      value={v.unit}
                      onChange={(e) => handleNewVariantChange(index, 'unit', e.target.value)}
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
                      <option value="dozen">dozen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Delivery Price *</label>
                    <input
                      type="number"
                      value={v.deliveryPrice}
                      onChange={(e) => handleNewVariantChange(index, 'deliveryPrice', e.target.value)}
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

          <div className="mt-6 sm:mt-[25px] bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-[16px]">
            <h3 className="m-0 mb-3 sm:mb-[15px] text-base font-bold text-gray-800">Main Variant Summary</h3>
            <div className="flex justify-between gap-4 text-gray-500 text-sm mb-2 sm:mb-[9px]">
              <span>Farmer Price</span>
              <strong className="text-gray-800">₹{Number(price || 0).toLocaleString('en-IN')}{unit ? ` / ${unitCount && unitCount != 1 ? unitCount + ' ' : ''}${unit}` : ''}</strong>
            </div>
            <div className="flex justify-between gap-4 text-gray-500 text-sm mb-2 sm:mb-[9px]">
              <span>Platform Commission</span>
              <strong className="text-gray-800">₹{commission.toLocaleString('en-IN')}</strong>
            </div>
            <div className="border-t border-gray-200 my-3 sm:my-[12px]" />
            <div className="flex justify-between gap-4 text-green-800 text-base font-bold">
              <span>Customer Price</span>
              <strong>₹{customerPrice.toLocaleString('en-IN')}{unit ? ` / ${unitCount && unitCount != 1 ? unitCount + ' ' : ''}${unit}` : ''}</strong>
            </div>
          </div>

          <div className="mt-5 sm:mt-[20px] p-4 sm:p-[15px] border border-gray-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[15px] bg-white">
            <div>
              <span className="block mb-1 sm:mb-[6px] text-xs sm:text-[13px] text-gray-500 font-bold uppercase tracking-wider">Product Status</span>
              <strong className="text-gray-800 text-sm sm:text-base">{product.status === 'active' ? '🟢 Active' : '🔴 Inactive'}</strong>
            </div>
            <div>
              <span className="block mb-1 sm:mb-[6px] text-xs sm:text-[13px] text-gray-500 font-bold uppercase tracking-wider">Approval Status</span>
              <strong className="text-gray-800 text-sm sm:text-base">{getApprovalLabel(product.approval_status)}</strong>
            </div>
          </div>

          <div className="mt-4 sm:mt-[15px] p-3 sm:p-[12px_15px] bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs sm:text-[14px] flex gap-2">
            <span>ℹ️</span> <span>Commission and approval status are managed by the platform admin.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-[15px] mt-[30px] pt-[20px] border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/farmer/products')}
              disabled={saving}
              className="flex-1 px-[20px] py-[12px] border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-bold text-sm sm:text-base hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-[20px] py-[12px] border-none rounded-lg bg-green-800 text-white cursor-pointer font-bold text-sm sm:text-base transition-colors ${
                saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              {saving ? 'Saving...' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}