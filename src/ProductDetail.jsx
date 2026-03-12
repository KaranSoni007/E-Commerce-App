import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useCompare } from "./CompareContext";
import { useReviews } from "./ReviewContext";
import AllProducts, { services } from "./Products";
import { useAuth } from "./AuthContext";
import ProductReviews from "./ProductReviews";
import { AIService } from "./AIService";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { getAverageRating, getReviewCount } = useReviews();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [stockStatus, setStockStatus] = useState({
    isInStock: true,
    stockCount: 50,
  });

  // Recently viewed products
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState([]);

  useEffect(() => {
    // Find product by ID
    const allItems = [...AllProducts, ...services];
    const foundProduct = allItems.find((p) => p.id === parseInt(id));

    if (foundProduct) {
      setProduct(foundProduct);

      // Add to recently viewed
      const currentUserEmail = user?.email || "guest";
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

      // Check compare status
      setIsCompared(isInCompare(foundProduct.title));

      // Use AI Service to get smart recommendations
      const related = AIService.getRecommendations(foundProduct);
      setSimilarProducts(related);

      // Get Frequently Bought Together
      const freq = AIService.getFrequentlyBoughtTogether(foundProduct);
      setFrequentlyBought(freq);
      setSelectedBundleIds(freq.map((p) => p.id));
    }
    setLoading(false);
  }, [id, getAverageRating, getReviewCount, isInWishlist, user, isInCompare]);

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
    setQuantity((prev) =>
      Math.min(stockStatus.stockCount, Math.max(1, prev + delta)),
    );
  };

  const handleWishlistClick = useCallback(() => {
    if (!product) return;
    const added = toggleWishlist(product);
    setIsWishlisted(added);
    setShowToast(true);
    setToastMessage(added ? "Added to wishlist!" : "Removed from wishlist");
    setTimeout(() => setShowToast(false), 2500);
  }, [product, toggleWishlist]);

  const handleCompareClick = useCallback(() => {
    if (!product) return;
    let message;
    if (isCompared) {
      removeFromCompare(product.title);
      message = "Removed from comparison";
      setIsCompared(false);
    } else {
      const result = addToCompare(product);
      message = result.message;
      if (result.success) {
        setIsCompared(true);
      }
    }
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, [product, isCompared, addToCompare, removeFromCompare]);

  const handleBundleAddToCart = () => {
    // Add main product
    addToCart(product, quantity);

    // Add selected bundle items
    let addedCount = 1;
    selectedBundleIds.forEach((id) => {
      const item = frequentlyBought.find((p) => p.id === id);
      if (item) {
        addToCart(item, 1);
        addedCount++;
      }
    });

    setIsAdded(true);
    setShowToast(true);
    setToastMessage(`${addedCount} items added to cart!`);
    setTimeout(() => {
      setIsAdded(false);
      setShowToast(false);
    }, 2500);
  };

  const toggleBundleItem = (id) => {
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const bundleTotalPrice = useMemo(() => {
    if (!product) return 0;
    let total = product.OriginalPrice || 0;
    selectedBundleIds.forEach((id) => {
      const item = frequentlyBought.find((p) => p.id === id);
      if (item) total += item.OriginalPrice || 0;
    });
    return total;
  }, [product, selectedBundleIds, frequentlyBought]);

  // Stock status is now persisted in state and localStorage
  const { isInStock, stockCount } = stockStatus;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
    <div className="min-h-screen bg-gray-50 pb-16 transition-colors duration-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-32 right-6 z-50 px-6 py-3 rounded-xl shadow-lg bg-emerald-500 text-white animate-slideIn">
          <div className="flex items-center gap-2">
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
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            to={`/#products`}
            className="text-gray-500 hover:text-indigo-600 transition-colors"
            onClick={() => {
              const element = document.getElementById("products");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {product.category || "Products"}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium truncate max-w-50">
            {product.title?.substring(0, 30)}...
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="relative aspect-square flex items-center justify-center bg-white rounded-xl">
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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                <span>Free delivery within 3-5 business days</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>1 Year Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Easy 30-day returns</span>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Product Title & Rating */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
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
                  <span className="text-3xl font-bold text-gray-900">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || !isInStock}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= stockCount || !isInStock}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg ${
                      isAdded
                        ? "bg-green-500 text-white"
                        : isInStock
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isAdded ? (
                      <>
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
                        </svg>{" "}
                        Added
                      </>
                    ) : isInStock ? (
                      <>
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
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>{" "}
                        Add to Cart
                      </>
                    ) : (
                      "Out of Stock"
                    )}
                  </button>
                  <button
                    onClick={handleWishlistClick}
                    className={`px-5 py-3.5 rounded-xl border-2 font-bold transition-all flex items-center justify-center ${
                      isWishlisted
                        ? "bg-pink-500 border-pink-500 text-white hover:bg-pink-600"
                        : "border-red-500 text-pink-500 hover:bg-pink-50"
                    }`}
                  >
                    {isWishlisted ? (
                      <svg
                        className="w-6 h-6 text-white"
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
                    ) : (
                      <svg
                        className="w-6 h-6 text-pink-500"
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
                    )}
                  </button>
                  <button
                    onClick={handleCompareClick}
                    title={
                      isCompared ? "Remove from Compare" : "Add to Compare"
                    }
                    className={`px-5 py-3.5 rounded-xl border-2 font-bold transition-all ${
                      isCompared
                        ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                        : "border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </button>
                </div>
                {isInStock && (
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3.5 rounded-xl font-bold text-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Buy Now
                  </button>
                )}
              </div>
            </div>

            {/* Product Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {product.features && product.features.length > 0
                  ? "Key Highlights"
                  : "Service Benefits"}
              </h3>
              <ul className="space-y-3">
                {product.features && product.features.length > 0 ? (
                  product.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <span className="w-5 h-5 mt-0.5 text-indigo-600 flex items-center justify-center shrink-0">
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 text-green-600 flex items-center justify-center">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      100% Original Products
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 text-green-600 flex items-center justify-center">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      Pay on Delivery Available
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 text-green-600 flex items-center justify-center">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      Free Shipping on orders above ₹500
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 text-green-600 flex items-center justify-center">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      Easy 30-day return policy
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === "description"
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab("specifications")}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === "specifications"
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === "reviews"
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  Reviews
                </button>
              </div>

              <div className="p-6">
                {activeTab === "description" && (
                  <div className="animate-fadeIn">
                    <p className="text-gray-600 leading-relaxed">
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
                            className="flex justify-between py-2 border-b border-gray-100"
                          >
                            <span className="text-gray-500">{key}</span>
                            <span className="font-medium text-gray-900">
                              {value}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Brand</span>
                          <span className="font-medium text-gray-900">
                            {product.title?.split(" ")[0] || "Premium"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Category</span>
                          <span className="font-medium text-gray-900">
                            {product.category}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Warranty</span>
                          <span className="font-medium text-gray-900">
                            1 Year
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Available</span>
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

        {/* Frequently Bought Together */}
        {frequentlyBought.length > 0 && (
          <div className="mt-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Frequently Bought Together
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Images */}
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <Link
                  to={`/product/${product.id}`}
                  className="relative block group"
                >
                  <img
                    src={product.src}
                    alt={product.title}
                    className="w-24 h-24 object-contain rounded-lg border border-gray-200 p-2 group-hover:border-indigo-300 transition-all"
                  />
                  <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    1
                  </span>
                </Link>

                {frequentlyBought.map((item) => (
                  <React.Fragment key={item.id}>
                    <span className="text-gray-400 text-xl font-bold flex items-center">
                      +
                    </span>
                    <div className="relative">
                      {item.category === "Services" ? (
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-24 h-24 object-contain rounded-lg border border-gray-200 p-2"
                        />
                      ) : (
                        <Link
                          to={`/product/${item.id}`}
                          className="block group"
                        >
                          <img
                            src={item.src}
                            alt={item.title}
                            className="w-24 h-24 object-contain rounded-lg border border-gray-200 p-2 group-hover:border-indigo-300 transition-all"
                          />
                        </Link>
                      )}
                      {selectedBundleIds.includes(item.id) && (
                        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                          ✓
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Selection List & Action */}
              <div className="flex-1 w-full">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-gray-900 text-white text-xs">
                      1
                    </span>
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">
                      This item: {product.title}
                    </span>
                    <span className="text-sm font-bold text-indigo-600 ml-auto">
                      {formatPrice(product.OriginalPrice)}
                    </span>
                  </div>

                  {frequentlyBought.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedBundleIds.includes(item.id)}
                        onChange={() => toggleBundleItem(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      {item.category === "Services" ? (
                        <span className="text-sm text-gray-700 line-clamp-1">
                          {item.title}
                        </span>
                      ) : (
                        <Link
                          to={`/product/${item.id}`}
                          className="text-sm text-gray-700 hover:text-indigo-600 line-clamp-1"
                        >
                          {item.title}
                        </Link>
                      )}
                      <span className="text-sm font-bold text-indigo-600 ml-auto">
                        {formatPrice(item.OriginalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="text-lg">
                    Total Price:{" "}
                    <span className="font-bold text-gray-900">
                      {formatPrice(bundleTotalPrice)}
                    </span>
                  </div>
                  <button
                    onClick={handleBundleAddToCart}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
                  >
                    Add All {selectedBundleIds.length + 1} to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Similar Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {similarProducts.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square mb-3 flex items-center justify-center bg-white rounded-lg p-2">
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
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {item.title?.substring(0, 40)}...
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-indigo-600">
                      {formatPrice(item.OriginalPrice)}
                    </span>
                    {item.MRP && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.MRP)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recentlyViewed.slice(0, 5).map((item, index) => {
                return (
                  <Link
                    key={index}
                    to={`/product/${item.id}`}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square mb-3 flex items-center justify-center bg-white rounded-lg p-2">
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
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {item.title?.substring(0, 40)}...
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-indigo-600">
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
    </div>
  );
}

export default ProductDetail;
