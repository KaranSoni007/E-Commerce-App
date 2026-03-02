import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });

  useEffect(() => {
    // Load user data
    const userName = localStorage.getItem("userName");
    const existingUsers = JSON.parse(localStorage.getItem("mockUsers")) || [];
    const matchedUser = existingUsers.find((u) => u.name === userName);
    setUserData({
      name: userName || "Customer",
      email: matchedUser?.email || "customer@email.com",
    });

    // Load order from localStorage
    const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    const foundOrder = allOrders.find((o) => o.id.toString() === orderId);

    if (foundOrder) {
      setOrder(foundOrder);
      // Generate tracking number if not exists
      const savedTracking = localStorage.getItem(`tracking_${orderId}`);
      if (savedTracking) {
        setTrackingNumber(savedTracking);
      } else {
        const newTracking = `EXP${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        localStorage.setItem(`tracking_${orderId}`, newTracking);
        setTrackingNumber(newTracking);
      }
    }
    setLoading(false);
  }, [orderId]);

  // Order status timeline
  const getOrderStatus = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - orderTime) / (1000 * 60 * 60);

    if (hoursDiff < 1) return "confirmed";
    if (hoursDiff < 4) return "processing";
    if (hoursDiff < 24) return "shipped";
    if (hoursDiff < 72) return "out_for_delivery";
    return "delivered";
  };

  const getStatusTimeline = (currentStatus) => {
    const statuses = [
      {
        key: "confirmed",
        label: "Order Confirmed",
        description: "Your order has been confirmed",
        icon: "📋",
        time: "Just now",
      },
      {
        key: "processing",
        label: "Processing",
        description: "Order is being prepared",
        icon: "📦",
        time: "2 hours",
      },
      {
        key: "shipped",
        label: "Shipped",
        description: "Order has been shipped",
        icon: "🚚",
        time: "1 day",
      },
      {
        key: "out_for_delivery",
        label: "Out for Delivery",
        description: "Order is on the way",
        icon: "🛵",
        time: "2 days",
      },
      {
        key: "delivered",
        label: "Delivered",
        description: "Order has been delivered",
        icon: "✅",
        time: "3 days",
      },
    ];

    const currentIndex = statuses.findIndex((s) => s.key === currentStatus);

    return statuses.map((status, index) => ({
      ...status,
      state:
        index < currentIndex
          ? "completed"
          : index === currentIndex
            ? "current"
            : "pending",
      actualTime: index <= currentIndex ? status.time : "",
    }));
  };

  const formatPrice = (priceVal) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(priceVal);
  };

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    alert("Tracking number copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📦</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The order you're looking for doesn't exist.
          </p>
          <Link
            to="/profile"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = getOrderStatus(order.date);
  const timeline = getStatusTimeline(currentStatus);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            to="/profile"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            My Account
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Track Order</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Order #{order.id}
              </h1>
              <p className="text-gray-500 text-sm">Placed on {order.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  currentStatus === "delivered"
                    ? "bg-green-100 text-green-700"
                    : currentStatus === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {currentStatus === "confirmed" && "Confirmed"}
                {currentStatus === "processing" && "Processing"}
                {currentStatus === "shipped" && "Shipped"}
                {currentStatus === "out_for_delivery" && "Out for Delivery"}
                {currentStatus === "delivered" && "Delivered"}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Number */}
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-indigo-600 font-medium mb-1">
                Tracking Number
              </p>
              <p className="text-2xl font-bold text-indigo-900">
                {trackingNumber}
              </p>
            </div>
            <button
              onClick={copyTrackingNumber}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Timeline Items */}
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={item.key} className="relative flex items-start gap-4">
                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      item.state === "completed"
                        ? "bg-green-500 text-white"
                        : item.state === "current"
                          ? "bg-indigo-600 text-white animate-pulse"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {item.state === "completed" ? "✓" : item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-semibold ${
                          item.state === "pending"
                            ? "text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </h3>
                      {item.actualTime && (
                        <span className="text-sm text-gray-500">
                          {item.actualTime}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        item.state === "pending"
                          ? "text-gray-400"
                          : "text-gray-600"
                      }`}
                    >
                      {item.description}
                    </p>
                    {item.state === "current" && (
                      <p className="text-sm text-indigo-600 mt-1 font-medium">
                        In Progress...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/64?text=No+Image";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Qty: {item.quantity || 1}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(item.OriginalPrice * (item.quantity || 1))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatPrice(order.total * 0.95)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Tax (5%)</span>
              <span className="font-medium text-gray-900">
                {formatPrice(order.total * 0.05)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-indigo-600">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Delivery Address
          </h2>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-gray-700">Delivery to registered address</p>
              <p className="text-sm text-gray-500 mt-1">
                Estimated delivery: 3-5 business days
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            ← Back to Orders
          </Link>
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              const invoiceDate = new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const invoiceTime = new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              const invoiceHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Invoice #${order.id}</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                      font-family: 'Segoe UI', Arial, sans-serif; 
                      background: #f5f5f5; 
                      padding: 20px;
                      color: #333;
                    }
                    .invoice-container {
                      max-width: 800px;
                      margin: 0 auto;
                      background: white;
                      padding: 40px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .invoice-header {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      margin-bottom: 30px;
                      padding-bottom: 20px;
                      border-bottom: 3px solid #4f46e5;
                    }
                    .company-info h1 {
                      color: #4f46e5;
                      font-size: 28px;
                      margin-bottom: 5px;
                    }
                    .company-info p {
                      color: #666;
                      font-size: 12px;
                      line-height: 1.5;
                    }
                    .invoice-details {
                      text-align: right;
                    }
                    .invoice-details h2 {
                      color: #4f46e5;
                      font-size: 24px;
                      margin-bottom: 10px;
                    }
                    .invoice-details p {
                      font-size: 13px;
                      color: #555;
                      margin: 3px 0;
                    }
                    .bill-to {
                      margin-bottom: 30px;
                      padding: 15px;
                      background: #f8f9fa;
                      border-radius: 8px;
                    }
                    .bill-to h3 {
                      color: #4f46e5;
                      font-size: 14px;
                      margin-bottom: 8px;
                      text-transform: uppercase;
                      letter-spacing: 1px;
                    }
                    .bill-to p {
                      font-size: 13px;
                      color: #555;
                      line-height: 1.6;
                    }
                    table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 30px;
                    }
                    th {
                      background: #4f46e5;
                      color: white;
                      padding: 12px;
                      text-align: left;
                      font-size: 12px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    }
                    td {
                      padding: 12px;
                      border-bottom: 1px solid #e5e7eb;
                      font-size: 13px;
                    }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .summary-section {
                      margin-top: 20px;
                      border-top: 2px solid #e5e7eb;
                      padding-top: 20px;
                    }
                    .summary-row {
                      display: flex;
                      justify-content: space-between;
                      padding: 8px 0;
                      font-size: 13px;
                    }
                    .summary-row.total {
                      border-top: 2px solid #4f46e5;
                      margin-top: 10px;
                      padding-top: 15px;
                      font-size: 16px;
                      font-weight: bold;
                      color: #4f46e5;
                    }
                    .footer {
                      margin-top: 40px;
                      padding-top: 20px;
                      border-top: 1px solid #e5e7eb;
                      text-align: center;
                      font-size: 12px;
                      color: #666;
                    }
                    .footer p {
                      margin: 5px 0;
                    }
                    .thank-you {
                      text-align: center;
                      margin: 30px 0;
                      padding: 20px;
                      background: #f0fdf4;
                      border-radius: 8px;
                      color: #166534;
                    }
                    .thank-you h3 {
                      font-size: 18px;
                      margin-bottom: 5px;
                    }
                    @media print {
                      body { background: white; padding: 0; }
                      .invoice-container { box-shadow: none; padding: 20px; }
                      .no-print { display: none; }
                    }
                  </style>
                </head>
                <body>
                  <div class="invoice-container">
                    <div class="invoice-header">
                      <div class="company-info">
                        <h1>EXPLORE</h1>
                        <p>
                          Premium Electronics Store<br>
                          123 Tech Park, Innovation Street<br>
                          Mumbai, Maharashtra - 400001<br>
                          GSTIN: 27AABCU9603R1ZX<br>
                          Email: support@explore.com | Phone: +91 63550 72986
                        </p>
                      </div>
                      <div class="invoice-details">
                        <h2>TAX INVOICE</h2>
                        <p><strong>Invoice No:</strong> INV-${order.id}</p>
                        <p><strong>Order ID:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${invoiceDate}</p>
                        <p><strong>Time:</strong> ${invoiceTime}</p>
                        <p><strong>Tracking:</strong> ${trackingNumber}</p>
                      </div>
                    </div>
                    
                    <div class="bill-to">
                      <h3>Bill To</h3>
                      <p>
                        <strong>${userData?.name || "Customer"}</strong><br>
                        ${userData?.email || "customer@email.com"}<br>
                        Delivery Address: As per order details<br>
                        Place of Supply: Maharashtra (27)
                      </p>
                    </div>
                    
                    <table>
                      <thead>
                        <tr>
                          <th style="width: 8%">S.No</th>
                          <th style="width: 45%">Product Description</th>
                          <th style="width: 12%" class="text-center">Qty</th>
                          <th style="width: 17%" class="text-right">Unit Price</th>
                          <th style="width: 18%" class="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items
                          .map((item, idx) => {
                            const unitPrice = item.OriginalPrice || 0;
                            const qty = item.quantity || 1;
                            const amount = unitPrice * qty;
                            return `
                            <tr>
                              <td>${idx + 1}</td>
                              <td>
                                <strong>${item.title}</strong><br>
                                <span style="color: #666; font-size: 11px;">Category: ${item.category || "Electronics"} | SKU: SKU-${Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                              </td>
                              <td class="text-center">${qty}</td>
                              <td class="text-right">₹${unitPrice.toLocaleString("en-IN")}</td>
                              <td class="text-right">₹${amount.toLocaleString("en-IN")}</td>
                            </tr>
                          `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                    
                    <div class="summary-section">
                      <div class="summary-row">
                        <span>Subtotal</span>
                        <span>₹${(order.total * 0.95).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="summary-row">
                        <span>CGST (2.5%)</span>
                        <span>₹${(order.total * 0.025).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="summary-row">
                        <span>SGST (2.5%)</span>
                        <span>₹${(order.total * 0.025).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="summary-row">
                        <span>Shipping Charges</span>
                        <span style="color: #16a34a;">FREE</span>
                      </div>
                      <div class="summary-row total">
                        <span>Total Amount (Inclusive of all taxes)</span>
                        <span>₹${order.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                    
                    <div class="thank-you">
                      <h3>Thank You for Your Purchase!</h3>
                      <p>We appreciate your business. For any queries, please contact our customer support.</p>
                    </div>
                    
                    <div class="footer">
                      <p><strong>Terms & Conditions:</strong></p>
                      <p>1. Goods once sold will not be taken back or exchanged</p>
                      <p>2. All disputes are subject to Mumbai jurisdiction</p>
                      <p>3. This is a computer generated invoice and does not require signature</p>
                      <p style="margin-top: 15px; color: #999;">© 2024 Explore Electronics. All rights reserved.</p>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                      <button onclick="window.print()" style="padding: 12px 30px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        Print Invoice
                      </button>
                    </div>
                  </div>
                </body>
                </html>
              `;

              printWindow.document.write(invoiceHTML);
              printWindow.document.close();
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;
