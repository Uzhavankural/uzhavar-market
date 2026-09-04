"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order_id");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "15px",
          border: "1px solid #e5e5e5",
          textAlign: "center",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: "60px",
            marginBottom: "15px",
          }}
        >
          ✅
        </div>

        <h1
          style={{
            margin: "0 0 10px",
          }}
        >
          Order Placed Successfully!
        </h1>

        <p
          style={{
            color: "#666",
            lineHeight: "1.6",
          }}
        >
          Your order has been successfully placed.
          The farmer will process your order soon.
        </p>

        {orderId && (
          <div
            style={{
              background: "#f5f5f5",
              padding: "12px",
              borderRadius: "8px",
              margin: "20px 0",
              wordBreak: "break-all",
            }}
          >
            <strong>Order ID</strong>

            <div
              style={{
                marginTop: "5px",
                fontSize: "13px",
                color: "#555",
              }}
            >
              {orderId}
            </div>
          </div>
        )}

        <button
          onClick={() =>
            router.push("/customer/products")
          }
          style={{
            width: "100%",
            padding: "13px",
            border: "none",
            borderRadius: "8px",
            background: "#1f7a3f",
            color: "white",
            fontWeight: "700",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Continue Shopping
        </button>

        <button
          onClick={() =>
            router.push("/customer")
          }
          style={{
            width: "100%",
            padding: "13px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "white",
            fontWeight: "600",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </main>
  );
}