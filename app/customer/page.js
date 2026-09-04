"use client";

import { useRouter } from "next/navigation";

export default function CustomerPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f7f7f7",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            marginBottom: "10px",
          }}
        >
          Customer Dashboard 🌾
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Welcome to Uzhavar Market
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >

          {/* Home */}
          <button
            onClick={() =>
              router.push("/")
            }
            style={cardButtonStyle}
          >
            <span style={iconStyle}>🏠</span>

            <strong>
              Home
            </strong>

            <span style={descriptionStyle}>
              Go to Uzhavar Market home page
            </span>
          </button>


          {/* Browse Products */}
          <button
            onClick={() =>
              router.push("/customer/products")
            }
            style={cardButtonStyle}
          >
            <span style={iconStyle}>🌾</span>

            <strong>
              Browse Products
            </strong>

            <span style={descriptionStyle}>
              View fresh products from farmers
            </span>
          </button>


          {/* My Cart */}
          <button
            onClick={() =>
              router.push("/customer/cart")
            }
            style={cardButtonStyle}
          >
            <span style={iconStyle}>🛒</span>

            <strong>
              My Cart
            </strong>

            <span style={descriptionStyle}>
              View products added to your cart
            </span>
          </button>


          {/* My Orders */}
          <button
            onClick={() =>
              router.push("/customer/orders")
            }
            style={cardButtonStyle}
          >
            <span style={iconStyle}>📦</span>

            <strong>
              My Orders
            </strong>

            <span style={descriptionStyle}>
              Track your orders and delivery
            </span>
          </button>

        </div>
      </div>
    </main>
  );
}


const cardButtonStyle = {
  background: "white",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "25px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "8px",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "16px",
};


const iconStyle = {
  fontSize: "35px",
};


const descriptionStyle = {
  color: "#666",
  fontSize: "14px",
};