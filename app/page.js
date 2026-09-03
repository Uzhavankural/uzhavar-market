'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    async function getData() {
      const { data: categoryData, error: categoryError } =
        await supabase
          .from('categories')
          .select('*')
          .order('name')

      if (categoryError) {
        console.log(
          'Category error:',
          categoryError.message
        )
      } else {
        setCategories(categoryData || [])
      }

      const { data: productData, error: productError } =
        await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', {
            ascending: false,
          })

      if (productError) {
        console.log(
          'Product error:',
          productError.message
        )
      } else {
        setProducts(productData || [])
      }
    }

    getData()
  }, [])

  const selectedCategoryId = categories.find(
    (category) =>
      category.name === selectedCategory
  )?.id

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(
          (product) =>
            product.category_id ===
            selectedCategoryId
        )

  return (
    <main style={styles.page}>

      {/* Navbar */}
      <nav className="navbar" style={styles.navbar}>
        <div style={styles.logo}>
          🌾 Uzhavar Market
        </div>

        <div className="nav-links" style={styles.navLinks}>
          <a href="#">Home</a>

          <a href="#categories">
            Categories
          </a>

          <a href="#products">
            Products
          </a>

          <button style={styles.loginButton}>
            Login
          </button>
        </div>
      </nav>


      {/* Hero */}
      <section className="hero" style={styles.hero}>
        <div>

          <p style={styles.smallTitle}>
            FARMERS DIRECTLY TO YOU
          </p>

          <h1 style={styles.heroTitle}>
            Fresh products.
            <br />
            Direct from farmers.
          </h1>

          <p style={styles.heroText}>
            Buy farm products directly from farmers
            and support local agriculture.
          </p>

          <button
            style={styles.shopButton}
            onClick={() => {
              document
                .getElementById('products')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }}
          >
            Explore Products
          </button>

        </div>
      </section>


      {/* Categories */}
      <section
        id="categories"
        className="section"
        style={styles.section}
      >

        <h2 style={styles.sectionTitle}>
          Shop by Category
        </h2>

        <div
          className="category-grid"
          style={styles.categoryGrid}
        >

          {/* All Products */}
          <button
            style={{
              ...styles.categoryCard,

              ...(selectedCategory === 'All'
                ? styles.selectedCategory
                : {}),
            }}

            onClick={() => {
              setSelectedCategory('All')
            }}
          >

            <div style={styles.categoryIcon}>
              🛒
            </div>

            <span>
              All Products
            </span>

          </button>


          {/* Categories from Database */}
          {categories.map((category) => (

            <button
              key={category.id}

              style={{
                ...styles.categoryCard,

                ...(selectedCategory ===
                category.name
                  ? styles.selectedCategory
                  : {}),
              }}

              onClick={() => {
                setSelectedCategory(
                  category.name
                )

                setTimeout(() => {
                  document
                    .getElementById('products')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }, 50)
              }}
            >

              <div style={styles.categoryIcon}>
                {category.icon || '🌱'}
              </div>

              <span>
                {category.name}
              </span>

            </button>

          ))}

        </div>
      </section>


      {/* Products */}
      <section
        id="products"
        className="section"
        style={styles.section}
      >

        <div style={styles.productHeader}>

          <h2 style={styles.sectionTitle}>
            {selectedCategory === 'All'
              ? 'Featured Products'
              : selectedCategory}
          </h2>

          <span style={styles.productCount}>
            {filteredProducts.length} products
          </span>

        </div>


        {filteredProducts.length === 0 ? (

          <p style={styles.noProducts}>
            No products available in this category.
          </p>

        ) : (

          <div
            className="product-grid"
            style={styles.productGrid}
          >

            {filteredProducts.map((product) => (

              <div
                key={product.id}
                style={{
                  ...styles.productCard,
                  cursor: 'pointer',
                }}
                onClick={() =>
                  router.push(
                    `/products/${product.id}`
                  )
                }
              >

                {/* Image */}
                <div style={styles.productImage}>

                  {product.image_url ? (

                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={styles.productImageStyle}
                    />

                  ) : (

                    <span>
                      🌾
                    </span>

                  )}

                </div>


                {/* Details */}
                <div style={styles.productContent}>

                  <p style={styles.productCategory}>
                    Farm Product
                  </p>

                  <h3 style={styles.productName}>
                    {product.name}
                  </h3>

                  <p style={styles.productDescription}>
                    {product.description}
                  </p>

                  <div style={styles.priceRow}>

                    <strong>
  ₹{(
    Number(product.price) +
    Number(product.commission_amount || 0)
  ).toFixed(2)}
</strong>

                    <span>
                      / {product.unit}
                    </span>

                  </div>

                  <p style={styles.stock}>
                    Stock: {product.stock_quantity}
                  </p>

                  <button
  style={styles.cartButton}
  onClick={(e) => {
    e.stopPropagation()

    const existingCart =
      JSON.parse(localStorage.getItem('cart')) || []

    const existingItem = existingCart.find(
      (item) => item.id === product.id
    )

    let updatedCart

    if (existingItem) {
      updatedCart = existingCart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          name: product.name,
          price:
  Number(product.price) +
  Number(product.commission_amount || 0),
          unit: product.unit,
          image_url: product.image_url,
          quantity: 1,
          farmer_id: product.farmer_id,
        },
      ]
    }

    localStorage.setItem(
      'cart',
      JSON.stringify(updatedCart)
    )

    alert('Product added to cart!')
  }}
>
  Add to Cart
</button>

                </div>

              </div>

            ))}

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
    color: '#1f2937',
    fontFamily: 'Arial, sans-serif',
  },


  navbar: {
    minHeight: '70px',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 7%',
    borderBottom:
      '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },


  logo: {
    fontSize: '22px',
    fontWeight: '700',
  },


  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },


  loginButton: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
  },


  hero: {
    padding: '90px 7%',
    background: '#e9f5e1',
  },


  smallTitle: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '2px',
    marginBottom: '15px',
  },


  heroTitle: {
    fontSize: '52px',
    lineHeight: '1.1',
    margin: '0 0 20px',
    maxWidth: '650px',
  },


  heroText: {
    fontSize: '18px',
    lineHeight: '1.6',
    maxWidth: '550px',
  },


  shopButton: {
    marginTop: '20px',
    padding: '14px 25px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    fontSize: '16px',
    cursor: 'pointer',
  },


  section: {
    padding: '60px 7%',
  },


  sectionTitle: {
    fontSize: '30px',
    marginBottom: '30px',
  },


  categoryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },


  categoryCard: {
    padding: '25px 15px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    transition: '0.2s',
  },


  selectedCategory: {
    background: '#dcfce7',
    border:
      '2px solid #166534',
    fontWeight: '700',
  },


  categoryIcon: {
    fontSize: '30px',
    marginBottom: '10px',
  },


  productHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  productCount: {
    fontSize: '14px',
    color: '#6b7280',
  },


  productGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, minmax(0, 1fr))',
    gap: '25px',
  },


  productCard: {
    background: '#ffffff',
    borderRadius: '14px',
    overflow: 'hidden',
    border:
      '1px solid #e5e7eb',
  },


  productImage: {
    height: '180px',
    background: '#e8f1df',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '60px',
  },


  productImageStyle: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },


  productContent: {
    padding: '20px',
  },


  productCategory: {
    fontSize: '12px',
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },


  productName: {
    fontSize: '20px',
    margin: '0 0 8px',
  },


  productDescription: {
    fontSize: '14px',
    lineHeight: '1.5',
    minHeight: '42px',
  },


  priceRow: {
    marginTop: '15px',
    fontSize: '18px',
    display: 'flex',
    gap: '5px',
    alignItems: 'baseline',
  },


  stock: {
    fontSize: '13px',
  },


  cartButton: {
    width: '100%',
    padding: '12px',
    marginTop: '10px',
    border: 'none',
    borderRadius: '8px',
    background: '#166534',
    color: '#ffffff',
    cursor: 'pointer',
  },


  noProducts: {
    fontSize: '16px',
    color: '#6b7280',
  },


  footer: {
    padding: '40px 7%',
    background: '#17251a',
    color: '#ffffff',
    textAlign: 'center',
  },

}