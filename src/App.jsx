import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ECommerceWeb from "./ECommerceWeb";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";
import { ReviewProvider } from "./ReviewContext";

// Lazy load page components for better performance - reduces initial bundle size
const Profile = lazy(() => import("./Profile"));
const Signup = lazy(() => import("./Signup"));
const Login = lazy(() => import("./Login"));
const Cart = lazy(() => import("./Cart"));
const ProductDetail = lazy(() => import("./ProductDetail"));
const Wishlist = lazy(() => import("./Wishlist"));
const OrderTracking = lazy(() => import("./OrderTracking"));
const NotFound = lazy(() => import("./NotFound"));

// Loading fallback component for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// ScrollToTop component to ensure page starts at top on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <ReviewProvider>
          <Router>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <div className="grow">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ECommerceWeb />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/track-order/:orderId" element={<OrderTracking />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Footer />
            </div>
          </Router>
        </ReviewProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
