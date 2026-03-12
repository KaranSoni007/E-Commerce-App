import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useCompare } from "./CompareContext";
import { useAuth } from "./AuthContext";
import AllProducts, { categories as productCategories } from "./Products";

// Reusable Nav Icon Component
const NavIcon = ({ to, title, count, countBgColor, children }) => (
  <Link
    to={to}
    className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group relative px-2 no-underline"
    title={title}
  >
    <div className="relative">
      {children}
      {count > 0 && (
        <span
          className={`${countBgColor} text-white text-[10px] font-bold h-4 min-w-4 rounded-full flex items-center justify-center px-1 absolute -top-1 -right-1 border-2 border-white dark:border-gray-900 animate-pop`}
        >
          {count}
        </span>
      )}
    </div>
    <span className="text-[11px] font-medium mt-0.5 hidden lg:block">
      {title}
    </span>
  </Link>
);

function Navbar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();
  const { compareList } = useCompare();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [isListening, setIsListening] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchContainerRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const isSubmittingRef = useRef(false);
  const categories = productCategories;

  const cartCount = cart.length;
  const compareCount = compareList.length;

  const handleLogout = useCallback(() => {
    logout();
    setMobileMenuOpen(false);
    setShowProfileDropdown(false);
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Lock body scroll when mobile search is open
  useEffect(() => {
    if (showMobileSearch) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showMobileSearch]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileDropdownRef]);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  const addToRecentSearches = useCallback((term) => {
    setRecentSearches((prev) => {
      const newSearches = [term, ...prev.filter((s) => s !== term)].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(newSearches));
      return newSearches;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
    setSuggestions([]);

    if (searchParams.get("search")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("search");
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  // Effect for search suggestions
  useEffect(() => {
    if (isSubmittingRef.current) {
      isSubmittingRef.current = false;
      return;
    }
    const isFocused = ["search", "search-mobile"].includes(
      document.activeElement?.id,
    );
    if (searchQuery.trim().length > 1) {
      if (isFocused) {
        const searchWords = searchQuery
          .toLowerCase()
          .split(" ")
          .filter(Boolean);
        const filtered = AllProducts.filter((p) => {
          const productTitleLower = p.title.toLowerCase();
          return searchWords.every((word) => productTitleLower.includes(word));
        }).slice(0, 5);
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    } else {
      // Show recent searches if query is empty and input is focused
      if (isFocused && recentSearches.length > 0) {
        setSuggestions(
          recentSearches.map((term) => ({
            id: term,
            title: term,
            isRecent: true,
          })),
        );
      } else {
        setSuggestions([]);
      }
    }
    setHighlightedIndex(-1);

    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery, recentSearches]);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        isSubmittingRef.current = true;
        addToRecentSearches(searchQuery.trim());
        navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate("/");
      }
      setSuggestions([]); // Hide suggestions on search submit
    },
    [navigate, searchQuery, addToRecentSearches],
  );

  const handleSuggestionKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter") {
      if (highlightedIndex > -1) {
        e.preventDefault();
        const item = suggestions[highlightedIndex];
        if (item.isRecent) {
          isSubmittingRef.current = true;
          setSearchQuery(item.title);
          addToRecentSearches(item.title);
          navigate(`/?search=${encodeURIComponent(item.title)}`);
        } else {
          navigate(`/product/${item.id}`);
        }
        setSuggestions([]);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const startListening = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      navigate(`/?search=${encodeURIComponent(transcript)}`);
    };

    recognition.start();
  }, [navigate]);

  const handleScrollLinkClick = useCallback(
    (item) => {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(
          item === "Home" ? "home" : item.toLowerCase(),
        );
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    [navigate],
  );

  return (
    <nav className="flex flex-col bg-white sticky top-0 z-[100] font-sans transition-colors duration-200 shadow-sm">
      <div className="w-full border-b border-gray-200 bg-white relative z-[102]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[72px] flex items-center justify-between gap-4">
          {/* Left Section: Logo */}
          <div className="flex justify-start shrink-0 pl-2 md:pl-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 no-underline pointer-events-auto relative z-[103]"
            >
              <div className="w-9 h-9 rounded-[10px] bg-indigo-600 text-white flex items-center justify-center overflow-hidden shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block"
                >
                  <path
                    d="M6 4H18V7H14V17H18V20H6V17H10V7H6V4Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h2 className="m-0 text-[22px] font-extrabold text-gray-900 tracking-[-0.5px]">
                IntelliKart
              </h2>
            </Link>
          </div>

          {/* Center Section: Search Bar */}
          <div
            className="flex-1 max-w-3xl mx-6 hidden md:block"
            ref={searchContainerRef}
          >
            <form onSubmit={handleSearch} className="relative">
              <div
                className={`relative flex items-center w-full h-11 rounded-lg focus-within:shadow-md bg-gray-100 overflow-hidden border border-gray-200 focus-within:border-indigo-500 focus-within:bg-white transition-all ${isListening ? "ring-2 ring-indigo-500 border-transparent" : ""}`}
              >
                <div className="grid place-items-center h-full w-12 text-gray-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-transparent placeholder-gray-500"
                  type="text"
                  id="search"
                  placeholder={
                    isListening
                      ? "Listening..."
                      : "Search for products, brands and more..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    isSubmittingRef.current = false;
                    setSearchQuery(e.target.value);
                  }}
                  onKeyDown={handleSuggestionKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim().length <= 1) {
                      if (recentSearches.length > 0) {
                        setSuggestions(
                          recentSearches.map((term) => ({
                            id: term,
                            title: term,
                            isRecent: true,
                          })),
                        );
                      }
                    } else {
                      const searchWords = searchQuery
                        .toLowerCase()
                        .split(" ")
                        .filter(Boolean);
                      setSuggestions(
                        AllProducts.filter((p) => {
                          const productTitleLower = p.title.toLowerCase();
                          return searchWords.every((word) =>
                            productTitleLower.includes(word),
                          );
                        }).slice(0, 5),
                      );
                    }
                  }}
                />
                <div className="flex items-center pr-2 gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        isSubmittingRef.current = false;
                        setSearchQuery("");
                        setSuggestions([]);
                        if (searchParams.get("search")) {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete("search");
                          setSearchParams(newParams, { replace: true });
                        }
                        document.getElementById("search")?.focus();
                      }}
                      className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                      title="Clear Search"
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
                  )}
                  <button
                    type="button"
                    onClick={startListening}
                    className={`p-1.5 rounded-full transition-colors ${
                      isListening
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "hover:bg-gray-200 text-gray-500"
                    }`}
                    title="Voice Search"
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                  {suggestions[0].isRecent && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span>Recent Searches</span>
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <ul className="divide-y divide-gray-100">
                    {suggestions.map((item, index) => (
                      <li
                        key={item.id}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {item.isRecent ? (
                          <button
                            className={`w-full text-left flex items-center gap-3 p-3 transition-colors ${index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
                            onClick={() => {
                              setSearchQuery(item.title);
                              addToRecentSearches(item.title);
                              navigate(
                                `/?search=${encodeURIComponent(item.title)}`,
                              );
                              setSuggestions([]);
                            }}
                          >
                            <span className="text-gray-400">
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                            <span className="text-sm text-gray-700">
                              {item.title}
                            </span>
                          </button>
                        ) : (
                          <Link
                            to={`/product/${item.id}`}
                            className={`flex items-center gap-4 p-3 transition-colors no-underline ${index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
                            onClick={() => {
                              setSuggestions([]);
                              setSearchQuery(""); // Clear search on click
                            }}
                          >
                            <img
                              src={item.src}
                              alt={item.title}
                              className="w-10 h-10 object-contain rounded bg-gray-100 p-1"
                            />
                            <span className="text-sm font-medium text-gray-800 line-clamp-1">
                              {item.title}
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </div>

          {/* Right Section: Icons & Mobile Menu Trigger */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setShowMobileSearch(true)}
              className="p-2 text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Search"
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
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <NavIcon
              to="/cart"
              title="Cart"
              count={cartCount}
              countBgColor="bg-red-500"
            >
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </NavIcon>
            <button
              className="p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Right Section: Navigation & Auth */}
          <div className="flex justify-end items-center relative z-[104] gap-2 lg:gap-4">
            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <NavIcon
                to="/compare"
                title="Compare"
                count={compareCount}
                countBgColor="bg-indigo-600"
              >
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </NavIcon>

              <NavIcon
                to="/wishlist"
                title="Wishlist"
                count={wishlistCount}
                countBgColor="bg-pink-500"
              >
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </NavIcon>

              <NavIcon
                to="/cart"
                title="Cart"
                count={cartCount}
                countBgColor="bg-red-500"
              >
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </NavIcon>

              {user ? (
                <>
                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setShowProfileDropdown((p) => !p)}
                      className="flex items-center gap-2 ml-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                          Hello,
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight max-w-[80px] truncate">
                          {user.name?.split(" ")[0] || "User"}
                        </span>
                      </div>
                      <svg
                        className={`w-3 h-3 text-gray-500 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showProfileDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fadeIn">
                        <Link
                          to="/profile"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          to="/profile?section=orders"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          My Orders
                        </Link>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="no-underline text-gray-600 dark:text-gray-300 font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="no-underline bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-indigo-700 active:scale-[0.98]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Navigation Links */}
      <div className="hidden md:block bg-gray-50 border-b border-gray-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-11 flex items-center justify-center">
          <ul className="flex list-none gap-6 lg:gap-8 m-0 p-0 items-center">
            <li
              className="relative h-full flex items-center"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer h-full"
                onClick={() => setShowCategories(!showCategories)}
              >
                Categories
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${showCategories ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`absolute top-full left-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 transition-all duration-200 origin-top-left ${showCategories ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible -translate-y-2"}`}
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setShowCategories(false);
                      navigate(`/?category=${encodeURIComponent(category)}`);
                    }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </li>
            {["Home", "Products", "Offers"].map((item) => (
              <li key={item}>
                <button
                  onClick={() => handleScrollLinkClick(item)}
                  className="text-[13px] font-medium text-gray-600 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer"
                >
                  {item}
                </button>
              </li>
            ))}
            <li>
              <Link
                to="/profile"
                className="text-[13px] font-medium text-gray-600 hover:text-indigo-600 transition-colors no-underline"
              >
                Track Order
              </Link>
            </li>
            <li>
              <Link
                to="/support"
                className="text-[13px] font-medium text-gray-600 hover:text-indigo-600 transition-colors no-underline"
              >
                Customer Support
              </Link>
            </li>
            <li>
              <button
                onClick={() => handleScrollLinkClick("contact")}
                className="text-[13px] font-medium text-gray-600 hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-slideDown">
          <ul className="flex flex-col p-4 space-y-1">
            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 hover:bg-gray-50 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleScrollLinkClick("Home");
                }}
              >
                Home
              </button>
            </li>

            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 hover:bg-gray-50 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleScrollLinkClick("Products");
                }}
              >
                Products
              </button>
            </li>

            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 hover:bg-gray-50 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleScrollLinkClick("Offers");
                }}
              >
                Offers
              </button>
            </li>

            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 hover:bg-gray-50 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleScrollLinkClick("Contact");
                }}
              >
                Contact
              </button>
            </li>
            <li>
              <Link
                to="/profile"
                className="block w-full text-left no-underline text-gray-600 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Track Order
              </Link>
            </li>
            <li>
              <Link
                to="/support"
                className="block w-full text-left no-underline text-gray-600 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Customer Support
              </Link>
            </li>
          </ul>

          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-col space-y-2">
              {/* Mobile Compare */}
              <Link
                to="/compare"
                className="no-underline text-gray-700 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Compare {compareCount > 0 && `(${compareCount})`}
              </Link>

              {/* Mobile Wishlist */}
              <Link
                to="/wishlist"
                className="no-underline text-gray-700 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5 text-pink-500"
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
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>

              {/* Mobile Cart */}
              <Link
                to="/cart"
                className="no-underline text-gray-700 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5 text-indigo-600"
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
                </svg>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>

              {user ? (
                <>
                  {/* Mobile Profile */}
                  <Link
                    to="/profile"
                    className="no-underline text-gray-700 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <span className="font-bold">{user.name}</span>
                      <span className="text-xs block text-gray-500">
                        View Profile
                      </span>
                    </div>
                  </Link>

                  {/* Mobile Logout */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-red-600 font-semibold flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-red-50 transition-colors w-full"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="no-underline text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="no-underline bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold text-sm text-center hover:bg-indigo-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 bg-white z-[120] animate-fadeIn">
          <div
            className="p-2.5 border-b border-gray-200"
            ref={searchContainerRef}
          >
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setShowMobileSearch(false);
              }}
              className="relative"
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                autoFocus
                id="search-mobile"
                className="w-full h-11 bg-gray-100 rounded-lg pl-10 pr-28 text-sm focus:outline-none"
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => {
                  isSubmittingRef.current = false;
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={handleSuggestionKeyDown}
              />
              <div className="absolute right-20 top-1/2 -translate-y-1/2 flex items-center">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      isSubmittingRef.current = false;
                      setSearchQuery("");
                      setSuggestions([]);
                      if (searchParams.get("search")) {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("search");
                        setSearchParams(newParams, { replace: true });
                      }
                    }}
                    className="p-1 text-gray-400"
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
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchQuery(searchParams.get("search") || "");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-600 px-2"
              >
                Cancel
              </button>
            </form>
          </div>
          <div className="p-4 overflow-y-auto">
            {suggestions.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {suggestions[0].isRecent && (
                  <li className="px-1 py-2 text-xs font-semibold text-gray-500 flex justify-between items-center">
                    <span>Recent Searches</span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  </li>
                )}
                {suggestions.map((item, index) => (
                  <li
                    key={item.id}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {item.isRecent ? (
                      <button
                        onClick={() => {
                          setSearchQuery(item.title);
                          navigate(
                            `/?search=${encodeURIComponent(item.title)}`,
                          );
                          setShowMobileSearch(false);
                        }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg ${index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
                      >
                        <span className="text-gray-400">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </span>
                        <span className="text-sm text-gray-700">
                          {item.title}
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={`/product/${item.id}`}
                        onClick={() => setShowMobileSearch(false)}
                        className={`flex items-center gap-4 p-3 rounded-lg no-underline ${index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
                      >
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-10 h-10 object-contain rounded bg-gray-100 p-1"
                        />
                        <span className="text-sm font-medium text-gray-800 line-clamp-1">
                          {item.title}
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {suggestions.length === 0 && searchQuery.length > 1 && (
              <div className="text-center text-gray-500 pt-10">
                <p>No results for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
