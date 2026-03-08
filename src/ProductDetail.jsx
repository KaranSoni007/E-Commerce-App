import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useReviews } from "./ReviewContext";
import products from "./Products";
import ProductReviews from "./ProductReviews";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getAverageRating, getReviewCount } = useReviews();

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [stockStatus, setStockStatus] = useState({
    isInStock: true,
    stockCount: 50,
  });

  // Recently viewed products
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    // Find product by ID
    const foundProduct = products.find((p) => p.id === parseInt(id));

    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedImage(0);

      // Add to recently viewed
      const currentUserEmail = localStorage.getItem("userEmail") || "guest";
      const viewedKey = `recentlyViewed_${currentUserEmail}`;
      const viewed = JSON.parse(localStorage.getItem(viewedKey)) || [];
      const newViewed = [
        foundProduct,
        ...viewed.filter((p) => p.title !== foundProduct.title),
      ].slice(0, 10);
      localStorage.setItem(viewedKey, JSON.stringify(newViewed));
      setRecentlyViewed(newViewed.slice(1));

      // Get reviews data
      setAverageRating(getAverageRating(foundProduct.title));
      setReviewCount(getReviewCount(foundProduct.title));

      // Check wishlist status
      setIsWishlisted(isInWishlist(foundProduct.title));
    }
    setLoading(false);
  }, [id, getAverageRating, getReviewCount, isInWishlist]);
  const getDiscount = useCallback(() => {
    if (!product || !product.MRP || !product.OriginalPrice) return 0;
    return Math.round(
      ((product.MRP - product.OriginalPrice) / product.MRP) * 100,
    );
  }, [product]);

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

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    addToCart(product, quantity);

    setIsAdded(true);
    setShowToast(true);
    setToastMessage(`${product.title.substring(0, 30)}... added to cart!`);

    setTimeout(() => {
      setIsAdded(false);
      setShowToast(false);
    }, 2500);
  }, [product, quantity, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    addToCart(product, quantity);
    navigate("/cart");
  }, [product, quantity, addToCart, navigate]);

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleWishlistClick = useCallback(() => {
    if (!product) return;
    const added = toggleWishlist(product);
    setIsWishlisted(added);
    setShowToast(true);
    setToastMessage(added ? "Added to wishlist!" : "Removed from wishlist");
    setTimeout(() => setShowToast(false), 2500);
  }, [product, toggleWishlist]);

  // Stock status is now persisted in state and localStorage
  const { isInStock, stockCount } = stockStatus;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const discount = getDiscount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 transition-colors duration-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3 rounded-xl shadow-lg bg-emerald-500 text-white animate-slideIn">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/"
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            to={`/#products`}
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            onClick={() => {
              const element = document.getElementById("products");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {product.category || "Products"}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-50">
            {product.title?.substring(0, 30)}...
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="relative aspect-square flex items-center justify-center bg-white dark:bg-gray-700 rounded-xl">
                <img
                  src={
                    product.src ||
                    "https://via.placeholder.com/500x500?text=No+Image"
                  }
                  alt={product.title}
                  className="max-w-full max-h-100 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/500x500?text=No+Image";
                  }}
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                      {discount}% OFF
                    </span>
                  )}
                  <span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-md">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock & Delivery Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`w-3 h-3 rounded-full ${isInStock ? "bg-green-500" : "bg-red-500"}`}
                ></span>
                <span
                  className={`font-semibold ${isInStock ? "text-green-600" : "text-red-600"}`}
                >
                  {isInStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>🚚</span>
                <span>Free delivery within 3-5 business days</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
                <span>🛡️</span>
                <span>1 Year Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
                <span>🔄</span>
                <span>Easy 30-day returns</span>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Product Title & Rating */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-500 text-sm">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.OriginalPrice)}
                  </span>
                  {product.MRP && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.MRP)}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                      Save {formatPrice(product.MRP - product.OriginalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || isAdded}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-lg transition-all ${
                      isAdded
                        ? "bg-green-500 text-white"
                        : isInStock
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isAdded
                      ? "✓ Added"
                      : isInStock
                        ? "🛒 Add to Cart"
                        : "Out of Stock"}
                  </button>
                  <button
                    onClick={handleWishlistClick}
                    className={`px-5 py-3.5 rounded-xl border-2 font-bold transition-all ${
                      isWishlisted
                        ? "bg-pink-500 border-pink-500 text-white hover:bg-pink-600"
                        : "border-red-500 text-pink-500 hover:bg-pink-50 dark:hover:bg-red-900/20"
                    }`}
                  >
                    {isWishlisted ? "🤍" : "❤️"}
                  </button>
                </div>
                {isInStock && (
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3.5 rounded-xl font-bold text-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>⚡</span> Buy Now
                  </button>
                )}
              </div>
            </div>

            {/* Product Features */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {product.features && product.features.length > 0
                  ? "Key Highlights"
                  : "Service Benefits"}
              </h3>
              <ul className="space-y-3">
                {product.features && product.features.length > 0 ? (
                  product.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                        ★
                      </span>
                      {feature}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                        ✓
                      </span>
                      100% Original Products
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                        ✓
                      </span>
                      Pay on Delivery Available
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                        ✓
                      </span>
                      Free Shipping on orders above ₹500
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                        ✓
                      </span>
                      Easy 30-day return policy
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === "description"
                      ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab("specifications")}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === "specifications"
                      ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === "reviews"
                      ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Reviews
                </button>
              </div>

              <div className="p-6">
                {activeTab === "description" && (
                  <div className="animate-fadeIn">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {product.description ||
                        `Experience the ultimate in technology with this premium ${product.category?.toLowerCase()}. Designed with cutting-edge features and superior craftsmanship, this product delivers exceptional performance that exceeds expectations. Whether you're a professional or an enthusiast, this is the perfect choice for those who demand excellence.`}
                    </p>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div className="animate-fadeIn space-y-3">
                    {product.specifications ? (
                      Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                          >
                            <span className="text-gray-500 dark:text-gray-400">
                              {key}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                              {value}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400">
                            Brand
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">
                            {product.title?.split(" ")[0] || "Premium"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400">
                            Category
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">
                            {product.category}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400">
                            Warranty
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">
                            1 Year
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400">
                            Available
                          </span>
                          <span className="font-medium text-green-600">
                            In Stock
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="animate-fadeIn">
                    <ProductReviews
                      productTitle={product.title}
                      product={product}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recentlyViewed.slice(0, 5).map((item, index) => {
                const itemIndex = products.findIndex(
                  (p) => p.title === item.title,
                );
                return (
                  <Link
                    key={index}
                    to={`/product/${itemIndex + 1}`}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square mb-3 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg p-2">
                      <img
                        src={item.src}
                        alt={item.title}
                        className="max-w-full max-h-30 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {item.title?.substring(0, 40)}...
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(item.OriginalPrice)}
                      </span>
                      {item.MRP && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(item.MRP)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ProductDetail;
