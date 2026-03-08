import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "./WishlistContext";
import { useCart } from "./CartContext";
import products from "./Products";

function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, clearWishlist, moveToCart } =
    useWishlist();
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showToastMessage = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  const formatPrice = useCallback((priceVal) => {
    if (!priceVal) return null;
    if (
      typeof priceVal === "string" &&
      (priceVal.includes("%") || priceVal.toLowerCase().includes("off"))
    ) {
      return priceVal;
    }
    const num = parseFloat(String(priceVal).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return priceVal;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }, []);

  const getDiscount = useCallback((original, mrp) => {
    if (!original || !mrp) return 0;
    return Math.round(((mrp - original) / mrp) * 100);
  }, []);

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product.title);
    showToastMessage("Moved to cart!");
  };

  const handleRemove = (title) => {
    removeFromWishlist(title);
    showToastMessage("Removed from wishlist");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      clearWishlist();
      showToastMessage("Wishlist cleared");
    }
  };

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeQuickView = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-6 font-sans transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-block mb-6 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-colors hover:text-indigo-800 dark:hover:text-indigo-300 no-underline"
          >
            ← Back to Store
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-pink-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Save items you love and they'll appear here
            </p>
            <Link
              to="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-6 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3 rounded-xl shadow-lg bg-emerald-500 text-white animate-slideIn">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-6 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-colors hover:text-indigo-800 dark:hover:text-indigo-300 no-underline"
        >
          ← Back to Store
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Wishlist
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="text-red-600 dark:text-red-400 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product, index) => {
            const discount = getDiscount(product.OriginalPrice, product.MRP);

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-4 overflow-hidden">
                  <Link
                    to={`/product/${product.id}`}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={
                        product.src ||
                        "https://via.placeholder.com/300x200?text=No+Image"
                      }
                      alt={product.title}
                      className="w-full h-full object-contain hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                  </Link>

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                      {discount}% OFF
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product.title)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center shadow-md transition-colors"
                    aria-label="Remove from wishlist"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col grow">
                  <Link to={`/product/${product.id}`} className="block">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 min-h-10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(product.OriginalPrice)}
                      </span>
                      {product.MRP && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(product.MRP)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 mt-auto">
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Move to Cart
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openQuickView(product)}
                        className="py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Quick View
                      </button>
                      <Link
                        to={`/product/${product.id}`}
                        className="block py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick View Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={closeQuickView}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeQuickView}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-64 md:h-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-6">
                <img
                  src={
                    selectedProduct.src ||
                    "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt={selectedProduct.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="p-8 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {selectedProduct.title}
                </h3>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(selectedProduct.OriginalPrice)}
                  </span>
                  {selectedProduct.MRP && (
                    <span className="ml-2 text-sm text-gray-400 line-through">
                      {formatPrice(selectedProduct.MRP)}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 grow line-clamp-4">
                  {selectedProduct.description ||
                    `Experience the ultimate in technology with this premium ${selectedProduct.category?.toLowerCase() || "product"}. Designed with cutting-edge features and superior craftsmanship.`}
                </p>

                <div className="space-y-3 mt-auto">
                  <button
                    onClick={() => {
                      handleMoveToCart(selectedProduct);
                      closeQuickView();
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Move to Cart
                  </button>
                  <Link
                    to={`/product/${selectedProduct.id}`}
                    className="block w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline"
                  >
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Wishlist;
