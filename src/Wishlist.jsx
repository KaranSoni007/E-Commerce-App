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

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-block mb-6 text-indigo-600 text-sm font-semibold transition-colors hover:text-indigo-800 no-underline"
          >
            ← Back to Store
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-pink-100 flex items-center justify-center">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-500 mb-6">
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
    <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans">
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
          className="inline-block mb-6 text-indigo-600 text-sm font-semibold transition-colors hover:text-indigo-800 no-underline"
        >
          ← Back to Store
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500 mt-1">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="text-red-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product, index) => {
            const discount = getDiscount(product.OriginalPrice, product.MRP);
            const productIndex = products.findIndex(
              (p) => p.title === product.title,
            );

            return (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
                  <Link to={`/product/${productIndex + 1}`}>
                    <img
                      src={
                        product.src ||
                        "https://via.placeholder.com/300x200?text=No+Image"
                      }
                      alt={product.title}
                      className="max-w-full max-h-full object-contain hover:scale-105 transition-transform"
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
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shadow-md transition-colors"
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
                <div className="p-4">
                  <Link to={`/product/${productIndex + 1}`}>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-indigo-600">
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
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Move to Cart
                    </button>
                    <Link
                      to={`/product/${productIndex + 1}`}
                      className="block w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm text-center hover:bg-gray-50 transition-colors no-underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
      `}</style>
    </div>
  );
}

export default Wishlist;
