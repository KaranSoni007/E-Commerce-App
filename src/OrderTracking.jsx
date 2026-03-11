import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [courier, setCourier] = useState("FedEx");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

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

      // Deterministic courier based on ID
      const couriers = ["FedEx", "BlueDart", "DHL", "Delhivery", "Ecom Express"];
      setCourier(couriers[foundOrder.id % couriers.length]);

      // Calculate estimated delivery (3 days from order)
      const orderDate = new Date(foundOrder.date);
      const deliveryDate = new Date(orderDate);
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      setEstimatedDelivery(deliveryDate.toLocaleDateString("en-US", { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
      }));
    }
    setLoading(false);
  }, [orderId]);

  // Order status timeline
  const getOrderStatus = (orderDate) => {
    // Check if order has an explicit status (e.g. cancelled)
    if (order && order.status) {
      return order.status;
    }
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
    if (!order) return [];
    
    const orderDate = new Date(order.date);
    orderDate.setHours(9, 0, 0, 0); // Normalize start time

    const formatTime = (date) => {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    };

    const addTime = (h) => {
      const d = new Date(orderDate);
      d.setHours(d.getHours() + h);
      return formatTime(d);
    };

    const statuses = [
      {
        key: "confirmed",
        label: "Order Confirmed",
        description: "Your order has been confirmed",
        icon: "📋",
        time: addTime(0),
      },
      {
        key: "processing",
        label: "Processing",
        description: "Order is being prepared",
        icon: "📦",
        time: addTime(4),
      },
      {
        key: "shipped",
        label: "Shipped",
        description: "Order has been shipped",
        icon: "🚚",
        time: addTime(24),
      },
      {
        key: "out_for_delivery",
        label: "Out for Delivery",
        description: "Order is on the way",
        icon: "🛵",
        time: addTime(48),
      },
      {
        key: "delivered",
        label: "Delivered",
        description: "Order has been delivered",
        icon: "✅",
        time: addTime(54),
      },
      {
        key: "cancelled",
        label: "Cancelled",
        description: "This order has been cancelled",
        icon: "❌",
        time: order.cancelledAt
          ? formatTime(new Date(order.cancelledAt))
          : formatTime(new Date()),
      },
    ];

    if (currentStatus === "return_requested" || currentStatus === "returned") {
      statuses.push(
        {
          key: "return_requested",
          label: "Return Requested",
          description: "Return request under review",
          icon: "↩️",
          time: order.returnRequestedAt
            ? formatTime(new Date(order.returnRequestedAt))
            : formatTime(new Date()),
        },
        {
          key: "returned",
          label: "Returned",
          description: "Return processed",
          icon: "📦",
          time: "", // Future: Add returnedAt if admin processing is implemented
        }
      );
    } else if (
      currentStatus === "exchange_requested" ||
      currentStatus === "exchanged"
    ) {
      statuses.push(
        {
          key: "exchange_requested",
          label: "Exchange Requested",
          description: "Exchange request under review",
          icon: "🔄",
          time: order.exchangeRequestedAt
            ? formatTime(new Date(order.exchangeRequestedAt))
            : formatTime(new Date()),
        },
        {
          key: "exchanged",
          label: "Exchanged",
          description: "Exchange processed",
          icon: "📦",
          time: "", // Future: Add exchangedAt if admin processing is implemented
        }
      );
    }

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

  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
      const cancelledAt = new Date().toISOString();
      const updatedOrders = allOrders.map((o) => {
        if (o.id === order.id) {
          return { ...o, status: "cancelled", cancelledAt };
        }
        return o;
      });

      localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
      setOrder({ ...order, status: "cancelled", cancelledAt });
      alert("Order cancelled successfully.");
    }
  };

  const handleActionSubmit = () => {
    if (!actionType) return;
    if (!selectedReason) {
      alert(`Please select a reason for ${actionType}.`);
      return;
    }

    const statusKey =
      actionType === "return" ? "return_requested" : "exchange_requested";
    const reasonKey =
      actionType === "return" ? "returnReason" : "exchangeReason";
    const dateKey =
      actionType === "return" ? "returnRequestedAt" : "exchangeRequestedAt";

    const actionDate = new Date().toISOString();

    const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    const updatedOrders = allOrders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: statusKey,
          [reasonKey]: selectedReason,
          [dateKey]: actionDate,
        };
      }
      return o;
    });

    localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
    setOrder({
      ...order,
      status: statusKey,
      [reasonKey]: selectedReason,
      [dateKey]: actionDate,
    });
    setShowActionModal(false);
    alert(
      `${actionType === "return" ? "Return" : "Exchange"} request submitted successfully.`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📦</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/"
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            to="/profile"
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            My Account
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            Track Order
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Order #{order.id}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Placed on {new Date(order.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  currentStatus === "delivered"
                    ? "bg-green-100 text-green-700"
                    : currentStatus === "return_requested"
                    ? "bg-orange-100 text-orange-700"
                    : currentStatus === "returned"
                    ? "bg-gray-100 text-gray-700"
                    : currentStatus === "exchange_requested"
                    ? "bg-blue-100 text-blue-700"
                    : currentStatus === "exchanged"
                    ? "bg-indigo-100 text-indigo-700"
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
                {currentStatus === "return_requested" && "Return Requested"}
                {currentStatus === "returned" && "Returned"}
                {currentStatus === "exchange_requested" && "Exchange Requested"}
                {currentStatus === "exchanged" && "Exchanged"}
              </span>

              {(currentStatus === "confirmed" ||
                currentStatus === "processing") && (
                <button
                  onClick={handleCancelOrder}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold underline cursor-pointer"
                >
                  Cancel Order
                </button>
              )}

              {currentStatus === "delivered" && (
                <button
                  onClick={() => {
                    setShowActionModal(true);
                    setActionType(null);
                    setSelectedReason("");
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold underline cursor-pointer"
                >
                  Return / Exchange Order
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Number */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                Tracking Number
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-indigo-900 dark:text-indigo-200">
                  {trackingNumber}
                </p>
                <button
                  onClick={copyTrackingNumber}
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  title="Copy Tracking Number"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="md:col-span-1">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                Courier Partner
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {courier}
              </p>
            </div>
            <div className="md:col-span-1">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                Estimated Delivery
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {estimatedDelivery}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Order Status
          </h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

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
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
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
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {item.label}
                      </h3>
                      {item.actualTime && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.actualTime}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        item.state === "pending"
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {item.description}
                    </p>
                    {item.state === "current" && (
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 overflow-hidden shrink-0">
                  <Link to={`/product/${item.id}`} className="block w-full h-full">
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
                  </Link>
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.id}`} className="no-underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                      {item.title}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Qty: {item.quantity || 1}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(item.OriginalPrice * (item.quantity || 1))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPrice(order.total * 0.95)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600 dark:text-gray-400">Tax (5%)</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPrice(order.total * 0.05)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Total
              </span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Delivery Address
          </h2>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Delivery to registered address
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Estimated delivery: 3-5 business days
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ← Back to Orders
          </Link>
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              const invoiceDate = new Date(order.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const invoiceTime = new Date(order.date).toLocaleTimeString("en-IN", {
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
                        <h1>INTELLIKART</h1>
                        <p>
                          Premium Electronics Store<br>
                          123 Tech Park, Innovation Street<br>
                          Mumbai, Maharashtra - 400001<br>
                          GSTIN: 27AABCU9603R1ZX<br>
                          Email: support@intellikart.com | Phone: +91 63550 72986
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
                      <p style="margin-top: 15px; color: #999;">© 2024 IntelliKart Electronics. All rights reserved.</p>
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

        {/* Action Modal (Return/Exchange) */}
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {!actionType
                  ? "Select Action"
                  : actionType === "return"
                  ? "Return Order"
                  : "Exchange Order"}
              </h3>

              {!actionType ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Do you want to return or exchange this product?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActionType("return")}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-center"
                    >
                      <span className="text-2xl block mb-2">↩️</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Return
                      </span>
                    </button>
                    <button
                      onClick={() => setActionType("exchange")}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-center"
                    >
                      <span className="text-2xl block mb-2">🔄</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Exchange
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="w-full mt-4 py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Please select a reason for{" "}
                    {actionType === "return" ? "returning" : "exchanging"} this
                    order.
                  </p>

                  <div className="space-y-3 mb-6">
                    {(actionType === "return"
                      ? [
                          "Defective/Damaged Product",
                          "Received Wrong Item",
                          "Quality Not as Expected",
                          "Changed Mind",
                          "Other",
                        ]
                      : [
                          "Size Issue",
                          "Color Issue",
                          "Defective Product",
                          "Received Wrong Item",
                          "Other",
                        ]
                    ).map((reason) => (
                      <label
                        key={reason}
                        className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {reason}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleActionSubmit}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    >
                      Confirm {actionType === "return" ? "Return" : "Exchange"}
                    </button>
                    <button
                      onClick={() => {
                        setActionType(null);
                        setSelectedReason("");
                      }}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTracking;
