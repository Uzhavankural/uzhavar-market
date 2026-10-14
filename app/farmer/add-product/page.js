'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { showToast } from '../../components/Toast'
import { ensureFarmerAccess } from '../../../lib/farmerAuth'

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
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const effective = await ensureFarmerAccess(profile, user)

      if (!effective.isAllowed && effective.role !== 'farmer') {
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

  
  function handleImagesChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const combined = [...images, ...files].slice(0, 4)
    if (images.length + files.length > 4) {
      alert('You can upload a maximum of 4 images.')
    }
    setImages(combined)
    e.target.value = ''
  }

  function handleRemoveImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleVideoChange(e) {
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
        alert(`Video duration must be within 1 minute (60 seconds). Selected video is ${Math.round(duration)} seconds.`)
        e.target.value = ''
        setVideoFile(null)
        setVideoPreview(null)
      } else {
        setVideoFile(file)
        setVideoPreview(tempUrl)
      }
    }
    videoElem.onerror = () => {
      alert('Unable to load video metadata. Please select another video file.')
      e.target.value = ''
    }
    videoElem.src = tempUrl
  }

  function handleRemoveVideo() {
    if (videoPreview) {
      try { window.URL.revokeObjectURL(videoPreview) } catch (e) {}
    }
    setVideoFile(null)
    setVideoPreview(null)
    const fileInput = document.getElementById('product-video')
    if (fileInput) fileInput.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setMessage('')

    if (!name || !categoryId || !stock) {
      setMessage('Please fill product name, category, and stock.')
      return
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (!v.price || !v.unit || (!v.unit.includes('bag') && !v.unitCount)) {
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

    let videoUrl = null
    if (videoFile) {
      const fileExtension = videoFile.name.split('.').pop() || 'mp4'
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-video.${fileExtension}`

      const { error: videoUploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, videoFile)

      if (videoUploadError) {
        setMessage(`Video upload failed: ${videoUploadError.message}`)
        setSaving(false)
        return
      }

      const { data: videoUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      videoUrl = videoUrlData.publicUrl
    }

    const rowsToInsert = variants.map((v) => {
      const isBag = v.unit.includes('bag');
      const finalUnitCount = isBag ? 1 : Number(v.unitCount);
      const displayName = variants.length > 1 ? `${name} - ${isBag ? '' : finalUnitCount + ' '}${v.unit}` : name;
      return {
        farmer_id: user.id,
        category_id: categoryId,
        name: displayName,
        description: description,
        price: Number(v.price),
        unit: v.unit,
        unit_count: finalUnitCount,
        delivery_price: Number(v.deliveryPrice || 0),
        stock_quantity: Number(stock),
        image_url: imageUrls.length > 0 ? imageUrls[0] : null,
        images: imageUrls,
        video_url: videoUrl,
        status: 'active',
        approval_status: 'pending',
        commission_amount: 0,
      }
    })

    let { error: productError } = await supabase
      .from('products')
      .insert(rowsToInsert)

    if (productError && productError.message && productError.message.includes('video_url')) {
      console.warn('video_url column does not exist yet in products table. Retrying insert without video_url.');
      const fallbackRows = rowsToInsert.map(({ video_url, ...rest }) => rest);
      const { error: fallbackError } = await supabase.from('products').insert(fallbackRows);
      if (fallbackError) {
        productError = fallbackError;
      } else {
        productError = null;
        alert('Product added! Note: To save videos, run in Supabase SQL editor: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;');
      }
    }

    if (productError) {
      const err = `Product save failed: ${productError.message}`
      setMessage(err)
      showToast(err, 'error')
      setSaving(false)
      return
    }

    const successMsg = 'Products submitted successfully! Waiting for admin approval.'
    setMessage(successMsg)
    showToast(successMsg, 'warning')

    setName('')
    setDescription('')
    setCategoryId('')
    setStock('')
    setVariants([{ price: '', unitCount: '1', unit: 'kg', deliveryPrice: '' }])
    setImages([])
    setVideoFile(null)
    setVideoPreview(null)

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
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center flex-wrap gap-3">
        <div className="text-xl sm:text-2xl font-bold text-green-800">
          🌾 Uzhavar Market
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/farmer')}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            ← Dashboard
          </button>
        </div>
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
                    
                    {!v.unit.includes('bag') && <div>
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
                    </div>}

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

            {/* PRODUCT IMAGES (Max 4) */}
            <label className="block mt-4 mb-2 text-sm font-semibold text-gray-700">
              Product Images (Max 4)
            </label>
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50 flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {images.length < 4 && (
              <input
                id="product-image"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="w-full py-2 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-800 hover:file:bg-green-100 transition-all cursor-pointer"
              />
            )}
            <p className="mt-1 text-xs text-gray-500">
              {images.length}/4 image(s) selected.
            </p>

            {/* PRODUCT VIDEO (Max 1, <= 60s) */}
            <label className="block mt-5 mb-2 text-sm font-semibold text-gray-700">
              Product Video (Optional - Max 1 video, within 1:00 min)
            </label>

            {videoPreview ? (
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 mb-2">
                <div className="relative rounded-lg overflow-hidden bg-black mb-2">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-56 object-contain"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-700 font-semibold">✓ Video attached (within 1 min)</span>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            ) : (
              <input
                id="product-video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full py-2 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 transition-all cursor-pointer"
              />
            )}
            <p className="mt-1 text-xs text-gray-500">
              Upload a farm or product video up to 1:00 min (60 seconds).
            </p>

            <button
              type="submit"
              disabled={saving}
              className="w-full p-3.5 mt-7 border-none rounded-lg bg-green-800 text-white text-base font-semibold cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Submitting Products...' : 'Submit Products'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}