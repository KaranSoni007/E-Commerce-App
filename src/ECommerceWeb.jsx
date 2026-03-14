import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import AllProducts, { categories as productCategories } from "./Products";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useReviews } from "./ReviewContext";
import { useCompare } from "./CompareContext";
import { AIService } from "./AIService";
import { useAuth } from "./AuthContext";
import { useStock } from "./StockContext";

// Professional Toast
const Toast = memo(({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`fixed top-32 right-6 z-50 px-6 py-3 rounded-xl shadow-lg ${
        type === "success"
          ? "bg-emerald-500 text-white"
          : "bg-red-500 text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "success" ? (
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
        ) : (
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
        )}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </motion.div>
  );
});

// Professional Skeleton
const SkeletonCard = memo(() => (
  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
    <div className="h-56 bg-gray-200 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  </div>
));

// Professional Card - Optimized with CSS-only animations for better performance
const CardView = memo(
  ({
    product,
    index,
    addToCart,
    showToast,
    formatPrice,
    getDiscount,
    productIndex,
    productId,
    reviewCount,
    averageRating,
    stockCount,
    isWishlisted: propIsWishlisted,
  }) => {
    const navigate = useNavigate();
    const { toggleWishlist } = useWishlist();
    const { addToCompare, isInCompare, removeFromCompare } = useCompare();
    const { src, title, DiscountedPrice, OriginalPrice, MRP, category } =
      product;
    const [isAdded, setIsAdded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(propIsWishlisted || false);
    const isCompared = isInCompare(title);
    const isInStock = stockCount > 0;

    // Sync with prop when it changes
    useEffect(() => {
      if (propIsWishlisted !== undefined) {
        setIsWishlisted(propIsWishlisted);
      }
    }, [propIsWishlisted]);

    const handleAddToCart = useCallback(
      (e) => {
        e.stopPropagation();
        try {
          addToCart(product);
          setIsAdded(true);
          showToast(`${title.substring(0, 25)}... added!`, "success");
        } catch (error) {
          // Show error toast if addToCart fails (e.g., out of stock)
          showToast(error.message, "error");
        }
      },
      [addToCart, product, showToast, title],
    );

    const handleWishlistClick = useCallback(
      (e) => {
        e.stopPropagation();
        const added = toggleWishlist(product);
        setIsWishlisted(added);
        showToast(
          added ? "Added to wishlist!" : "Removed from wishlist",
          "success",
        );
      },
      [toggleWishlist, product, showToast],
    );

    const handleCompareClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (isCompared) {
          removeFromCompare(title);
          showToast("Removed from comparison", "success");
        } else {
          const result = addToCompare(product);
          showToast(result.message, result.success ? "success" : "error");
        }
      },
      [addToCompare, removeFromCompare, product, showToast, title, isCompared],
    );

    const handleBuyNow = useCallback(
      (e) => {
        e.stopPropagation();
        try {
          addToCart(product);
          navigate("/cart");
        } catch (error) {
          showToast(error.message, "error");
        }
      },
      [addToCart, product, navigate, showToast],
    );

    const handleCardClick = useCallback(() => {
      navigate(`/product/${productId}`);
    }, [navigate, productId]);

    useEffect(() => {
      if (!isAdded) return;
      const timer = setTimeout(() => setIsAdded(false), 1200);
      return () => clearTimeout(timer);
    }, [isAdded]);

    const discount = getDiscount(OriginalPrice, MRP);
    const displayRating = averageRating || 0;
    const displayReviewCount = reviewCount || 0;

    // Memoize star rating rendering
    const stars = useMemo(() => [...Array(5)], []);

    return (
      <div
        onClick={handleCardClick}
        className="rounded-2xl overflow-hidden border border-gray-200 bg-white flex flex-col h-full shadow-sm cursor-pointer relative transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              {discount}% OFF
            </span>
          )}
          <span className="bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-md">
            {category}
          </span>
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
            isWishlisted
              ? "bg-pink-500 text-white"
              : "bg-white text-gray-400 hover:text-pink-500 hover:bg-pink-50"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            className="w-5 h-5"
            fill={isWishlisted ? "currentColor" : "none"}
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
        </button>

        {/* Compare Button */}
        <button
          onClick={handleCompareClick}
          className={`absolute top-14 right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
            isCompared
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          }`}
          title="Compare"
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

        {/* Professional Image Container - Full Image Visible */}
        <div className="h-56 overflow-hidden relative bg-gray-50 flex items-center justify-center p-4 pointer-events-none">
          <img
            src={src || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={title}
            className="product-image w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://via.placeholder.com/300x200?text=No+Image";
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col grow">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-10">
            {title}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-2">
            {stars.map((_, i) => (
              <svg
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(displayRating) ? "text-yellow-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({displayReviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="mb-3">
            {DiscountedPrice && (
              <span className="text-xs text-emerald-600 font-semibold block mb-0.5">
                {formatPrice(DiscountedPrice)}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(OriginalPrice)}
              </span>
              {MRP && (
                <span className="text-xs line-through text-gray-400">
                  {formatPrice(MRP)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative z-30 flex items-center justify-center gap-2 ${
                isAdded
                  ? "bg-emerald-500 text-white"
                  : isInStock
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              aria-label={isAdded ? "Added to cart" : "Add to cart"}
            >
              {isAdded ? (
                <>
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
                  </svg>{" "}
                  Added
                </>
              ) : !isInStock ? (
                "Out of Stock"
              ) : (
                <>
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>{" "}
                  Add
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!isInStock}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative z-30 flex items-center justify-center gap-2 ${
                isInStock
                  ? "bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed hidden"
              }`}
              aria-label="Buy Now"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>{" "}
              Buy
            </button>
          </div>
        </div>
      </div>
    );
  },
);

// Add display name for better debugging

function ECommerceWeb() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { getReviewCount, getAverageRating } = useReviews();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState(null);

  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sortBy, setSortBy] = useState("featured");
  const [discountFilter, setDiscountFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(12);
  const { user } = useAuth();
  const { getStock } = useStock();
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState([]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setTimeout(() => {
        const element = document.getElementById("products");
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [categoryParam]);

  // Fetch personalized suggestions on mount
  useEffect(() => {
    const userEmail = user?.email || "guest";
    setPersonalizedSuggestions(
      AIService.getPersonalizedSuggestions(userEmail, 5),
    );
  }, [user]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [
    searchTerm,
    selectedCategory,
    priceRange,
    selectedBrands,
    sortBy,
    discountFilter,
  ]);

  const categories = productCategories;

  // Extract unique brands from products
  const brands = useMemo(() => {
    if (!AllProducts || !Array.isArray(AllProducts)) return [];
    const brandSet = new Set();
    AllProducts.forEach((p) => {
      const brand = p.title?.split(" ")[0];
      if (brand) brandSet.add(brand);
    });
    return Array.from(brandSet).sort();
  }, []);

  // Get price range from products
  const priceStats = useMemo(() => {
    if (
      !AllProducts ||
      !Array.isArray(AllProducts) ||
      AllProducts.length === 0
    ) {
      return { min: 0, max: 100000 };
    }
    const prices = AllProducts.map((p) => p.OriginalPrice || 0).filter(
      (p) => p > 0,
    );
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
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

  const smartShuffle = useCallback((products) => {
    if (!products || products.length === 0) return [];
    const categories = {};
    products.forEach((product) => {
      const cat = product.category || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(product);
    });
    const categoryNames = Object.keys(categories);
    if (categoryNames.length <= 1) return products;
    const shuffled = [];
    const maxLength = Math.max(
      ...categoryNames.map((cat) => categories[cat].length),
    );
    for (let i = 0; i < maxLength; i++) {
      categoryNames.forEach((cat) => {
        if (categories[cat][i]) shuffled.push(categories[cat][i]);
      });
    }
    return shuffled;
  }, []);

  useEffect(() => {
    const loadLocalData = () => {
      // Try to load from local storage first (to pick up Admin Panel updates)
      const storedProducts = JSON.parse(localStorage.getItem("allProducts"));
      if (
        storedProducts &&
        Array.isArray(storedProducts) &&
        storedProducts.length > 0
      ) {
        setData(storedProducts);
      } else {
        setData(AllProducts || []);
      }
      setLoading(false);
    };
    const timer = setTimeout(loadLocalData, 500);
    return () => clearTimeout(timer);
  }, []);
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let filtered = data.filter((product) => {
      const matchesSearch = product.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      // Price range filter
      const productPrice = product.OriginalPrice || 0;
      const matchesPrice =
        (!priceRange.min || productPrice >= parseInt(priceRange.min)) &&
        (!priceRange.max || productPrice <= parseInt(priceRange.max));

      // Brand filter
      const productBrand = product.title?.split(" ")[0];
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(productBrand);

      // Discount filter
      const discount = getDiscount(product.OriginalPrice, product.MRP);
      let matchesDiscount = true;
      if (discountFilter === "10plus") matchesDiscount = discount >= 10;
      else if (discountFilter === "20plus") matchesDiscount = discount >= 20;
      else if (discountFilter === "30plus") matchesDiscount = discount >= 30;
      else if (discountFilter === "50plus") matchesDiscount = discount >= 50;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesBrand &&
        matchesDiscount
      );
    });

    // Sorting
    switch (sortBy) {
      case "priceLow":
        filtered.sort(
          (a, b) => (a.OriginalPrice || 0) - (b.OriginalPrice || 0),
        );
        break;
      case "priceHigh":
        filtered.sort(
          (a, b) => (b.OriginalPrice || 0) - (a.OriginalPrice || 0),
        );
        break;
      case "discount":
        filtered.sort(
          (a, b) =>
            getDiscount(b.OriginalPrice, b.MRP) -
            getDiscount(a.OriginalPrice, a.MRP),
        );
        break;
      case "rating":
        filtered.sort(
          (a, b) => getAverageRating(b.title) - getAverageRating(a.title),
        );
        break;
      case "newest":
        // Keep original order (assuming products are added newest first)
        break;
      case "featured":
      default:
        if (
          selectedCategory === "All" &&
          searchTerm === "" &&
          selectedBrands.length === 0 &&
          !priceRange.min &&
          !priceRange.max
        ) {
          filtered = smartShuffle(filtered);
        }
        break;
    }

    return filtered;
  }, [
    data,
    searchTerm,
    selectedCategory,
    priceRange,
    selectedBrands,
    sortBy,
    discountFilter,
    smartShuffle,
    getDiscount,
    getAverageRating,
  ]);

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setPriceRange({ min: "", max: "" });
    setSelectedBrands([]);
    setSortBy("featured");
    setDiscountFilter("all");
  };

  const activeFiltersCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0) +
    (selectedBrands.length > 0 ? 1 : 0) +
    (discountFilter !== "all" ? 1 : 0) +
    (sortBy !== "featured" ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gray-50">
        <div className="max-w-7xl mx-auto py-10 px-6">
          <div className="rounded-2xl p-8 mb-8 bg-gray-200 animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-2/3 mx-auto mb-2" />
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
          </div>
          <div className="flex gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-24 rounded-full bg-gray-200 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans pb-16 bg-gray-50 transition-colors duration-200"
      id="home"
    >
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        {/* Professional Hero Banner */}
        <motion.div
          id="offers"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl mb-10 bg-linear-to-r from-indigo-600 to-purple-600 p-8 shadow-xl"
        >
          <div className="relative z-10 text-center">
            <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-2 rounded-full mb-4 shadow-md">
              LIMITED TIME OFFER
            </span>
            <h2 className="text-3xl font-bold text-white mb-3">
              Special Offer: Get 20% Off!
            </h2>
            <p className="text-white/90 text-lg">
              Use code{" "}
              <strong className="bg-white/20 px-3 py-1 rounded-lg mx-1">
                INTERN20
              </strong>{" "}
              at checkout
            </p>
          </div>
        </motion.div>

        {/* AI-Powered "Recommended for You" Section */}
        {personalizedSuggestions.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              Recommended for You
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {personalizedSuggestions.map((product, index) => {
                const productIndex = AllProducts.findIndex(
                  (p) => p.title === product.title,
                );
                const reviewCount = getReviewCount(product.title);
                const averageRating = getAverageRating(product.title);
                const stockCount = getStock(product.title);
                return (
                  <CardView
                    key={`personalized-${product.id}-${index}`}
                    product={product}
                    index={index}
                    productIndex={productIndex >= 0 ? productIndex : index}
                    productId={product.id}
                    addToCart={addToCart}
                    showToast={showToast}
                    formatPrice={formatPrice}
                    getDiscount={getDiscount}
                    reviewCount={reviewCount}
                    averageRating={averageRating}
                    stockCount={stockCount}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Professional Category Filters */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters & Sort Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Filter Toggle & Active Filters */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  showFilters || activeFiltersCount > 0
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-white text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Right: Sort & Search */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range Filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Price Range
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        value={priceRange.min}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || Number(val) >= 0) {
                            setPriceRange((prev) => ({ ...prev, min: val }));
                          }
                        }}
                        className="w-full py-2 pl-7 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Max"
                        min="0"
                        value={priceRange.max}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || Number(val) >= 0) {
                            setPriceRange((prev) => ({ ...prev, max: val }));
                          }
                        }}
                        className="w-full py-2 pl-7 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Range: ₹{priceStats.min.toLocaleString()} - ₹
                    {priceStats.max.toLocaleString()}
                  </p>
                </div>

                {/* Brand Filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Brand
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {brands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands([...selectedBrands, brand]);
                            } else {
                              setSelectedBrands(
                                selectedBrands.filter((b) => b !== brand),
                              );
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Discount Filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Discount
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Discounts" },
                      { value: "10plus", label: "10% or more" },
                      { value: "20plus", label: "20% or more" },
                      { value: "30plus", label: "30% or more" },
                      { value: "50plus", label: "50% or more" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                      >
                        <input
                          type="radio"
                          name="discount"
                          value={option.value}
                          checked={discountFilter === option.value}
                          onChange={(e) => setDiscountFilter(e.target.value)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Found{" "}
            <span className="font-semibold text-gray-900">
              {filteredData.length}
            </span>{" "}
            products
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Professional Product Grid */}
        <div
          id="products"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredData.length > 0 ? (
            filteredData.slice(0, visibleCount).map((product, index) => {
              // Find the original index in the AllProducts array
              const productIndex = AllProducts.findIndex(
                (p) => p.title === product.title,
              );
              const reviewCount = getReviewCount(product.title);
              const averageRating = getAverageRating(product.title);
              const stockCount = getStock(product.title);
              return (
                <CardView
                  key={`${product.title}-${index}`}
                  product={product}
                  index={index}
                  productIndex={productIndex >= 0 ? productIndex : index}
                  productId={product.id}
                  addToCart={addToCart}
                  showToast={showToast}
                  formatPrice={formatPrice}
                  getDiscount={getDiscount}
                  reviewCount={reviewCount}
                  averageRating={averageRating}
                  stockCount={stockCount}
                />
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="flex justify-center mb-4 text-gray-300">
                <svg
                  className="w-16 h-16"
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={clearAllFilters}
                className="py-3 px-6 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                aria-label="Clear all filters"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredData.length > visibleCount && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Load More Products
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Showing {Math.min(visibleCount, filteredData.length)} of{" "}
              {filteredData.length} products
            </p>
          </div>
        )}

        {/* Professional Contact Section */}
        <div
          id="contact"
          className="mt-12 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-indigo-100 flex items-center justify-center">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Need Help?
            </h2>
            <p className="text-gray-500 mb-6">
              Our support team is available 24/7
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:ks.telecom999@gmail.com"
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                ks.telecom999@gmail.com
              </a>
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ECommerceWeb;
