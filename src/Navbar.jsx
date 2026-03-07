import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useCompare } from "./CompareContext";
import { useTheme } from "./ThemeContext";
import { useAuth } from "./AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();
  const { compareList } = useCompare();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const cartCount = cart.length;
  const compareCount = compareList.length;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center sticky top-0 z-[100] font-sans transition-colors duration-200">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-[101]">
        {/* Main Grid Layout: Left | Center | Right */}
        <div className="grid grid-cols-3 items-center">
          {/* Left Section: Logo */}
          <div className="flex justify-start">
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
              <h2 className="m-0 text-[22px] font-extrabold text-gray-900 dark:text-white tracking-[-0.5px]">
                IntelliKart
              </h2>
            </Link>
          </div>

          {/* Center Section: Navigation Menu - Perfectly Centered */}
          <div className="flex justify-center relative z-[103]">
            <ul className="hidden md:flex list-none gap-8 m-0 p-0">
              <li>
                <button
                  onClick={() => {
                    navigate("/");
                    setTimeout(() => {
                      const element = document.getElementById("home");
                      if (element)
                        element.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] transition-colors duration-200 py-2 px-1 hover:text-indigo-600 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer relative group"
                >
                  Home
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    navigate("/");
                    setTimeout(() => {
                      const element = document.getElementById("products");
                      if (element)
                        element.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] transition-colors duration-200 py-2 px-1 hover:text-indigo-600 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer relative group"
                >
                  Products
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    navigate("/");
                    setTimeout(() => {
                      const element = document.getElementById("offers");
                      if (element)
                        element.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] transition-colors duration-200 py-2 px-1 hover:text-indigo-600 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer relative group"
                >
                  Offers
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    navigate("/");
                    setTimeout(() => {
                      const element = document.getElementById("contact");
                      if (element)
                        element.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] transition-colors duration-200 py-2 px-1 hover:text-indigo-600 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer relative group"
                >
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
                </button>
              </li>
            </ul>
          </div>

          {/* Right Section: Auth Buttons */}
          <div className="flex justify-end items-center relative z-[104]">
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer pointer-events-auto"
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
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
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
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
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {user ? (
                <>
                  {/* Compare Icon */}
                  <Link
                    to="/compare"
                    className="cursor-pointer p-2 rounded-lg relative transition-colors duration-200 text-gray-600 dark:text-gray-300 flex items-center justify-center no-underline hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400"
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
                    {compareCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold h-4 min-w-4 rounded-full flex items-center justify-center px-1 absolute -top-0.5 -right-0.5 border-2 border-white animate-pop">
                        {compareCount}
                      </span>
                    )}
                  </Link>

                  {/* Wishlist Icon */}
                  <Link
                    to="/wishlist"
                    className="cursor-pointer p-2 rounded-lg relative transition-colors duration-200 text-gray-600 dark:text-gray-300 flex items-center justify-center no-underline hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-pink-600"
                    title="Wishlist"
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="bg-pink-500 text-white text-[10px] font-bold h-4 min-w-4 rounded-full flex items-center justify-center px-1 absolute -top-0.5 -right-0.5 border-2 border-white animate-pop">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* Cart Icon */}
                  <Link
                    to="/cart"
                    className="cursor-pointer p-2 rounded-lg relative transition-colors duration-200 text-gray-600 dark:text-gray-300 flex items-center justify-center no-underline hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Cart"
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {cartCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 rounded-full flex items-center justify-center px-1 absolute -top-0.5 -right-0.5 border-2 border-white animate-pop">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile Dropdown Trigger */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors no-underline px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="hidden lg:inline">
                      Hi, {user.name?.split(" ")[0] || "User"}
                    </span>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Logout"
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
                  </button>
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

            {/* Mobile: Profile Avatar (visible on main navbar) */}
            {user && (
              <Link
                to="/profile"
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-1"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg animate-slideDown">
          <ul className="flex flex-col p-4 space-y-1">
            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                  setTimeout(() => {
                    const element = document.getElementById("home");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Home
              </button>
            </li>

            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                  setTimeout(() => {
                    const element = document.getElementById("products");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Products
              </button>
            </li>

            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                  setTimeout(() => {
                    const element = document.getElementById("offers");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Offers
              </button>
            </li>

            <li>
              <button
                className="block w-full text-left no-underline text-gray-600 dark:text-gray-300 font-medium text-[15px] py-3 px-4 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent border-none cursor-pointer transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                  setTimeout(() => {
                    const element = document.getElementById("contact");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Contact
              </button>
            </li>
          </ul>

          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full text-left text-gray-700 dark:text-gray-300 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-2 cursor-pointer"
            >
              {isDarkMode ? (
                <span className="flex items-center gap-3">
                  <span className="text-xl">☀️</span> Light Mode
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <span className="text-xl">🌙</span> Dark Mode
                </span>
              )}
            </button>

            {user ? (
              <div className="flex flex-col space-y-2">
                {/* Mobile Compare */}
                <Link
                  to="/compare"
                  className="no-underline text-gray-700 dark:text-gray-300 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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
                  Compare {compareCount > 0 && `(${compareCount})`}
                </Link>

                {/* Mobile Wishlist */}
                <Link
                  to="/wishlist"
                  className="no-underline text-gray-700 dark:text-gray-300 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                  className="no-underline text-gray-700 dark:text-gray-300 font-medium flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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

                {/* Mobile Logout */}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-red-600 dark:text-red-400 font-semibold flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
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
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="no-underline text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        html { scroll-behavior: smooth; }
        .animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes pop { 
          0% { transform: scale(0); } 
          100% { transform: scale(1); } 
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </nav>
  );
}

export default Navbar;
