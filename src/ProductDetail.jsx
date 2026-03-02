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
  const [stockStatus, setStockStatus] = useState({ isInStock: true, stockCount: 10 });
  
  // Recently viewed products
  const [recentlyViewed, setRecentlyViewed] = useState([]);


  useEffect(() => {
    // Find product by index (id in URL corresponds to product index)
    const productIndex = parseInt(id) - 1;
    const foundProduct = products[productIndex];

    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedImage(0);

      // Add to recently viewed
      const viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      const newViewed = [
        foundProduct,
        ...viewed.filter((p) => p.title !== foundProduct.title),
      ].slice(0, 10);
      localStorage.setItem("recentlyViewed", JSON.stringify(newViewed));
      setRecentlyViewed(newViewed.slice(1));

      // Get reviews data
      setAverageRating(getAverageRating(foundProduct.title));
      setReviewCount(getReviewCount(foundProduct.title));

      // Check wishlist status
      setIsWishlisted(isInWishlist(foundProduct.title));
      
      // Get or generate stock status (persist per product)
      const stockKey = `stock_${foundProduct.title}`;
      let savedStock = localStorage.getItem(stockKey);
      if (!savedStock) {
        // Generate once and save
        const isInStock = Math.random() > 0.1;
        const stockCount = Math.floor(Math.random() * 50) + 5;
        savedStock = JSON.stringify({ isInStock, stockCount });
        localStorage.setItem(stockKey, savedStock);
      }
      setStockStatus(JSON.parse(savedStock));
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

    const cartItem = {
      ...product,
      quantity: quantity,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    setIsAdded(true);
    setShowToast(true);
    setToastMessage(`${product.title.substring(0, 30)}... added to cart!`);

    setTimeout(() => {
      setIsAdded(false);
      setShowToast(false);
    }, 2500);
  }, [product, quantity, addToCart]);

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
          <span className="text-6xl mb-4 block">🔍</span>
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
    <div className="min-h-screen bg-gray-50 pb-16">
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
          <span className="text-gray-900 font-medium truncate max-w-[200px]">
            {product.title?.substring(0, 30)}...
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="relative aspect-square flex items-center justify-center">
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
                  {isInStock
                    ? `In Stock (${stockCount} available)`
                    : "Out of Stock"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🚚</span>
                <span>Free delivery within 3-5 business days</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span>🛡️</span>
                <span>1 Year Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span>🔄</span>
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
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || isAdded}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                    isAdded
                      ? "bg-green-500 text-white"
                      : isInStock
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >  
                  {isAdded
                    ? "✓ Added to Cart"
                    : isInStock
                      ? "🛒 Add to Cart"
                      : "Out of Stock"}
                </button>
                <button
                  onClick={handleWishlistClick}
                  className={`px-5 py-4 rounded-xl border-2 font-bold transition-all ${
                    isWishlisted
                      ? "bg-pink-500 border-pink-500 text-white hover:bg-pink-600"
                      : "border-red-500 text-pink-500 hover:bg-pink-50"
                  }`}
                >
                  {isWishlisted ? "🤍" : "❤️"}
                </button>
              </div>
            </div>

            {/* Product Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Product Features
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                    ✓
                  </span>
                  100% Original Products
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                    ✓
                  </span>
                  Pay on Delivery Available
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                    ✓
                  </span>
                  Free Shipping on orders above ₹500
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                    ✓
                  </span>
                  Easy 30-day return policy
                </li>
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
                      {product.description || `Experience the ultimate in technology with this premium ${product.category?.toLowerCase()}. Designed with cutting-edge features and superior craftsmanship, this product delivers exceptional performance that exceeds expectations. Whether you're a professional or an enthusiast, this is the perfect choice for those who demand excellence.`}
                    </p>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div className="animate-fadeIn space-y-3">
                    {product.specifications ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">{key}</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))
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
                          <span className="font-medium text-gray-900">1 Year</span>
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

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square mb-3 flex items-center justify-center">
                      <img
                        src={item.src}
                        alt={item.title}
                        className="max-w-full max-h-[120px] object-contain"
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
