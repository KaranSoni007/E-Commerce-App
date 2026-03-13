import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStock } from "./StockContext";
import { useCart } from "./CartContext";

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { incrementStock } = useStock();
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
      const couriers = [
        "FedEx",
        "BlueDart",
        "DHL",
        "Delhivery",
        "Ecom Express",
      ];
      setCourier(couriers[foundOrder.id % couriers.length]);

      // Calculate estimated delivery (3 days from order)
      const orderDate = new Date(foundOrder.date);
      const deliveryDate = new Date(orderDate);
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      setEstimatedDelivery(
        deliveryDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );
    }
    setLoading(false);
  }, [orderId]);

  // Order status timeline
  const getOrderStatus = (order) => {
    if (!order) return null;
    // Prioritize the explicit status from the database (localStorage)
    if (order.status) return order.status;

    const orderTime = new Date(order.date).getTime();
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
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        time: addTime(0),
      },
      {
        key: "processing",
        label: "Processing",
        description: "Order is being prepared",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        ),
        time: addTime(4),
      },
      {
        key: "shipped",
        label: "Shipped",
        description: "Order has been shipped",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
            />
          </svg>
        ),
        time: addTime(24),
      },
      {
        key: "out_for_delivery",
        label: "Out for Delivery",
        description: "Order is on the way",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        time: addTime(48),
      },
      {
        key: "delivered",
        label: "Delivered",
        description: "Order has been delivered",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
        time: addTime(54),
      },
      {
        key: "cancelled",
        label: "Cancelled",
        description: "This order has been cancelled",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ),
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
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          ),
          time: order.returnRequestedAt
            ? formatTime(new Date(order.returnRequestedAt))
            : formatTime(new Date()),
        },
        {
          key: "returned",
          label: "Returned",
          description: "Return processed",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          ),
          time: "", // Future: Add returnedAt if admin processing is implemented
        },
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
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
          time: order.exchangeRequestedAt
            ? formatTime(new Date(order.exchangeRequestedAt))
            : formatTime(new Date()),
        },
        {
          key: "exchanged",
          label: "Exchanged",
          description: "Exchange processed",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          ),
          time: "", // Future: Add exchangedAt if admin processing is implemented
        },
      );
    }

    // If order is cancelled, returned, or exchanged, filter out subsequent delivery steps for a more realistic timeline
    const terminalStatues = ["cancelled", "returned", "exchanged"];
    if (terminalStatues.includes(currentStatus)) {
      statuses = statuses.filter(
        (s) => s.key !== "out_for_delivery" && s.key !== "delivered",
      );
    }

    const terminalStates = ["delivered", "cancelled", "returned", "exchanged"];
    const isTerminal = terminalStates.includes(currentStatus);

    const currentIndex = statuses.findIndex((s) => s.key === currentStatus);

    return statuses.map((status, index) => {
      let state;
      if (isTerminal) {
        state = index <= currentIndex ? "completed" : "pending";
      } else {
        state =
          index < currentIndex
            ? "completed"
            : index === currentIndex
              ? "current"
              : "pending";
      }

      return {
        ...status,
        state,
        actualTime: index <= currentIndex ? status.time : "",
      };
    });
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
      incrementStock(order.items); // Replenish stock on cancellation

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
      `${actionType === "return" ? "Return" : "Exchange"} request submitted successfully.`,
    );
  };

  const handleBuyAgain = (order) => {
    const addedItems = [];
    const failedItems = [];
    order.items.forEach((item) => {
      try {
        addToCart(item, item.quantity || 1);
        addedItems.push(item.title);
      } catch (error) {
        failedItems.push(item.title);
      }
    });

    if (failedItems.length > 0) {
      alert(
        `Successfully re-added: ${addedItems.join(", ") || "None"}.\n\nOut of stock: ${failedItems.join(", ")}.`,
      );
    } else {
      alert("All items from the order have been added to your cart!");
    }
    navigate("/cart");
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
          <div className="text-6xl mb-4 flex justify-center text-gray-300">
            <svg
              className="w-24 h-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          </div>
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

  const currentStatus = getOrderStatus(order);
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
                Placed on{" "}
                {new Date(order.date).toLocaleDateString("en-US", {
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
                    : currentStatus === "processing"
                      ? "bg-yellow-100 text-yellow-700"
                      : currentStatus === "shipped"
                        ? "bg-indigo-100 text-indigo-700"
                        : currentStatus === "out_for_delivery"
                          ? "bg-purple-100 text-purple-700"
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
                    {item.state === "completed" ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      item.icon
                    )}
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
                  <Link
                    to={`/product/${item.id}`}
                    className="block w-full h-full"
                  >
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
                  <Link
                    to={`/product/${item.id}`}
                    className="no-underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
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
            <div className="mt-1">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              {order.deliveryAddress ? (
                <>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {order.deliveryAddress.split(",")[0]}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {order.deliveryAddress.substring(
                      order.deliveryAddress.indexOf(",") + 2,
                    )}
                  </p>
                </>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  Delivery to registered address
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>{" "}
            Back to Orders
          </Link>
          <button
            onClick={() => handleBuyAgain(order)}
            className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            Buy Again
          </button>
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              const invoiceDate = new Date(order.date).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              );
              const invoiceTime = new Date(order.date).toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              const invoiceHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Invoice #${order.id}</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>
                    @media print {
                      .no-print { display: none; }
                    }
                  </style>
                </head>
                <body class="bg-gray-100 font-sans p-5 text-gray-800">
                  <div class="max-w-4xl mx-auto bg-white p-10 shadow-lg rounded-lg">
                    <div class="flex justify-between items-start mb-8 pb-5 border-b-4 border-indigo-600">
                      <div class="company-info">
                        <h1 class="text-indigo-600 text-3xl font-bold mb-1">INTELLIKART</h1>
                        <p class="text-gray-500 text-xs leading-relaxed">
                          Premium Electronics Store<br>
                          123 Tech Park, Innovation Street<br>
                          Mumbai, Maharashtra - 400001<br>
                          GSTIN: 27AABCU9603R1ZX<br>
                          Email: support@intellikart.com | Phone: +91 63550 72986
                        </p>
                      </div>
                      <div class="text-right">
                        <h2 class="text-indigo-600 text-2xl font-bold mb-2">TAX INVOICE</h2>
                        <p class="text-sm text-gray-600"><strong>Invoice No:</strong> INV-${order.id}</p>
                        <p class="text-sm text-gray-600"><strong>Order ID:</strong> #${order.id}</p>
                        <p class="text-sm text-gray-600"><strong>Date:</strong> ${invoiceDate}</p>
                        <p class="text-sm text-gray-600"><strong>Time:</strong> ${invoiceTime}</p>
                        <p class="text-sm text-gray-600"><strong>Tracking:</strong> ${trackingNumber}</p>
                      </div>
                    </div>
                    
                    <div class="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <h3 class="text-indigo-600 text-sm font-bold uppercase tracking-wider mb-2">Bill To</h3>
                      <p class="text-sm text-gray-600 leading-relaxed">
                        <strong>${userData?.name || "Customer"}</strong><br>
                        ${userData?.email || "customer@email.com"}<br>
                        <b>Delivery Address:</b> <br>
                        ${order.deliveryAddress || "As per order details"}<br>
                        <b>Payment method:</b>
                        ${order.paymentMethod || "Cash on delivery"}<br>
                        <b>Place of Supply:</b> <br />
                        Premium Electronics Store<br>
                        Mumbai, Maharashtra - 400001<br>
                        <b>GSTIN:</b> 27AABCU9603R1ZX<br>
                        <b>Email:</b> support@intellikart.com | <b>Phone:</b> +91 63550 72986
                      </p>
                    </div>
                    >
                    <table class="w-full mb-8 border-collapse">
                      <thead>
                        <tr class="bg-indigo-600 text-white">
                          <th class="p-3 text-left text-xs uppercase tracking-wide rounded-tl-lg">S.No</th>
                          <th class="p-3 text-left text-xs uppercase tracking-wide w-5/12">Product Description</th>
                          <th class="p-3 text-center text-xs uppercase tracking-wide">Qty</th>
                          <th class="p-3 text-right text-xs uppercase tracking-wide">Unit Price</th>
                          <th class="p-3 text-right text-xs uppercase tracking-wide rounded-tr-lg">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items
                          .map((item, idx) => {
                            const unitPrice = item.OriginalPrice || 0;
                            const qty = item.quantity || 1;
                            const amount = unitPrice * qty;
                            return `
                            <tr class="border-b border-gray-200">
                              <td class="p-3 text-sm">${idx + 1}</td>
                              <td class="p-3 text-sm">
                                <strong>${item.title}</strong><br>
                                <span class="text-gray-500 text-xs">Category: ${item.category || "Electronics"} | SKU: SKU-${Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                              </td>
                              <td class="p-3 text-center text-sm">${qty}</td>
                              <td class="p-3 text-right text-sm">₹${unitPrice.toLocaleString("en-IN")}</td>
                              <td class="p-3 text-right text-sm">₹${amount.toLocaleString("en-IN")}</td>
                            </tr>
                          `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                    
                    <div class="border-t-2 border-gray-200 pt-5">
                      <div class="flex justify-between py-2 text-sm">
                        <span>Subtotal</span>
                        <span>₹${(order.total * 0.95).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="flex justify-between py-2 text-sm">
                        <span>CGST (2.5%)</span>
                        <span>₹${(order.total * 0.025).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="flex justify-between py-2 text-sm">
                        <span>SGST (2.5%)</span>
                        <span>₹${(order.total * 0.025).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="flex justify-between py-2 text-sm">
                        <span>Shipping Charges</span>
                        <span class="text-green-600 font-bold">FREE</span>
                      </div>
                      <div class="flex justify-between py-4 mt-2 border-t-2 border-indigo-600 text-indigo-600 font-bold text-lg">
                        <span>Total Amount (Inclusive of all taxes)</span>
                        <span>₹${order.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                    
                    <div class="text-center my-8 p-5 bg-green-50 rounded-lg text-green-800 border border-green-100">
                      <h3 class="text-lg font-bold mb-1">Thank You for Your Purchase!</h3>
                      <p class="text-sm">We appreciate your business. For any queries, please contact our customer support.</p>
                    </div>
                    
                    <div class="mt-10 pt-5 border-t border-gray-200 text-center text-xs text-gray-500">
                      <p class="font-bold text-gray-700 mb-1">Terms & Conditions:</p>
                      <p>1. Goods once sold will not be taken back or exchanged</p>
                      <p>2. All disputes are subject to Mumbai jurisdiction</p>
                      <p>3. This is a computer generated invoice and does not require signature</p>
                      <p class="mt-4 text-gray-400">© 2024 IntelliKart Electronics. All rights reserved.</p>
                    </div>
                    
                    <div class="no-print text-center mt-8">
                      <button onclick="window.print()" class="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
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
                      <div className="flex justify-center mb-2">
                        <svg
                          className="w-8 h-8 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                          />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Return
                      </span>
                    </button>
                    <button
                      onClick={() => setActionType("exchange")}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-center"
                    >
                      <div className="flex justify-center mb-2">
                        <svg
                          className="w-8 h-8 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </div>
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
