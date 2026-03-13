import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ECommerceWeb from "./ECommerceWeb";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";
import { ReviewProvider } from "./ReviewContext";
import { CompareProvider } from "./CompareContext";
import { AuthProvider } from "./AuthContext";
import { StockProvider } from "./StockContext";

// Lazy load page components for better performance - reduces initial bundle size
const Profile = lazy(() => import("./Profile"));
const Signup = lazy(() => import("./Signup"));
const Login = lazy(() => import("./Login"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const Cart = lazy(() => import("./Cart"));
const ProductDetail = lazy(() => import("./ProductDetail"));
const Wishlist = lazy(() => import("./Wishlist"));
const Compare = lazy(() => import("./Compare"));
const OrderTracking = lazy(() => import("./OrderTracking"));
const OrderConfirmation = lazy(() => import("./OrderConfirmation"));
const NotFound = lazy(() => import("./NotFound"));
const Support = lazy(() => import("./Support"));
const AdminPanel = lazy(() => import("./AdminPanel"));

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

const AppLayout = () => {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = ["/login", "/signup", "/forgot-password"].includes(
    location.pathname,
  );
  const shouldShowNavbarFooter = !isAdminRoute && !isAuthRoute;

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-200">
      {shouldShowNavbarFooter && <Navbar />}
      <div className="grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<ECommerceWeb />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/track-order/:orderId" element={<OrderTracking />} />
            <Route
              path="/order-confirmation/:orderId"
              element={<OrderConfirmation />}
            />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      {shouldShowNavbarFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <StockProvider>
        <CartProvider>
          <WishlistProvider>
            <ReviewProvider>
              <CompareProvider>
                <Router>
                  <ScrollToTop />
                  <AppLayout />
                </Router>
              </CompareProvider>
            </ReviewProvider>
          </WishlistProvider>
        </CartProvider>
      </StockProvider>
    </AuthProvider>
  );
}

export default App;
