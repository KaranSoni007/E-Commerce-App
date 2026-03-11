import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
      const foundOrder = allOrders.find((o) => o.id.toString() === orderId);
      setOrder(foundOrder || null);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [orderId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
            Processing your order...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-6 block">😕</span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Order Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            We couldn't find the order details you're looking for. It might have
            been removed or the ID is incorrect.
          </p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors no-underline shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* Success Header */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-slow">
                <span className="text-5xl">🎉</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Order Placed Successfully!
              </h1>
              <p className="text-indigo-100 text-lg font-medium">
                Thank you for shopping with IntelliKart.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {/* Order ID & Status */}
            <div className="text-center mb-10">
              <p className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">
                Order Reference
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                #{order.id}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Confirmed
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-b border-gray-100 dark:border-gray-700 py-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Order Date
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {new Date(order.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Payment Method
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <span>
                      {order.paymentMethod === "Cash on Delivery"
                        ? "💵"
                        : order.paymentMethod === "UPI"
                          ? "📱"
                          : order.paymentMethod === "Net Banking"
                            ? "🏦"
                            : "💳"}
                    </span>{" "}
                    {order.paymentMethod || "Credit/Debit Card"}
                  </p>
                </div>
              </div>
              <div className="space-y-4 md:text-right">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Total Amount
                  </p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Estimated Delivery
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    3-5 Business Days
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-6 mb-10">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-4">
                What's Next?
              </h3>

              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-lg">
                  1
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">
                    Confirmation Email
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    We've sent a confirmation email to{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {order.userEmail}
                    </span>{" "}
                    with your order receipt.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-lg">
                  2
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">
                    Shipping Update
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    We will notify you via email and SMS when your order has
                    been shipped.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate(`/track-order/${order.id}`)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 cursor-pointer"
              >
                Track Order
              </button>
              <Link
                to="/"
                className="flex-1 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white py-4 rounded-xl font-bold text-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-center no-underline transform hover:-translate-y-1"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default OrderConfirmation;
