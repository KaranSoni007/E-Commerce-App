import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useAuth } from "./AuthContext";

function Profile() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout, updateUser } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);

  const [showAddresses, setShowAddresses] = useState(false);
  const [addresses, setAddresses] = useState([]);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    orderUpdates: true,
    promotions: true,
  });

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [activeSupportSection, setActiveSupportSection] = useState(null);
  const [editName, setEditName] = useState("");

  // Password change modal state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Recently viewed state
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Payment methods state
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardType: "Credit Card",
  });

  // Account info
  const [memberSince, setMemberSince] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const userEmail = user.email;

    setEditName(user.name || "");

    const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    const userOrders = allOrders.filter(
      (order) => order.userEmail === userEmail,
    );
    setOrders(userOrders.reverse());

    const allAddresses =
      JSON.parse(localStorage.getItem("mockAddresses")) || [];
    setAddresses(allAddresses.filter((a) => a.userEmail === userEmail));

    // Load member since date (mock - using account creation)
    const savedMemberSince = localStorage.getItem("memberSince_" + userEmail);
    if (savedMemberSince) {
      setMemberSince(savedMemberSince);
    } else {
      const date = new Date();
      const formatted = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      setMemberSince(formatted);
      localStorage.setItem("memberSince_" + userEmail, formatted);
    }

    // Load last login
    const savedLastLogin = localStorage.getItem("lastLogin_" + userEmail);
    if (savedLastLogin) {
      setLastLogin(savedLastLogin);
    } else {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastLogin(formatted);
    }

    // Load notification preferences
    const savedPrefs = localStorage.getItem("notificationPrefs_" + userEmail);
    if (savedPrefs) {
      setNotificationPrefs(JSON.parse(savedPrefs));
    }

    // Load recently viewed products
    const viewedKey = `recentlyViewed_${userEmail}`;
    const viewed = JSON.parse(localStorage.getItem(viewedKey)) || [];
    setRecentlyViewed(viewed.slice(0, 4));

    // Load payment methods
    const savedPayments =
      JSON.parse(localStorage.getItem("mockPayments")) || [];
    const userPayments = savedPayments.filter((p) => p.userEmail === userEmail);
    setPaymentMethods(userPayments);

    // Update last login
    const now = new Date();
    const loginFormatted = now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    localStorage.setItem("lastLogin_" + userEmail, loginFormatted);
  }, [navigate, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatPrice = (priceVal) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(priceVal);
  };

  // Calculate stats
  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const wishlistCount = wishlist.length;

  // Handle notification toggle
  const handleNotificationToggle = (type) => {
    const updated = {
      ...notificationPrefs,
      [type]: !notificationPrefs[type],
    };
    setNotificationPrefs(updated);
    localStorage.setItem(
      "notificationPrefs_" + user.email,
      JSON.stringify(updated),
    );
  };

  // Password change handler
  const handlePasswordChange = () => {
    if (!passwordData.currentPassword) {
      alert("Please enter your current password");
      return;
    }
    if (!passwordData.newPassword) {
      alert("Please enter a new password");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    // Mock password change
    const existingUsers = JSON.parse(localStorage.getItem("mockUsers")) || [];
    const updatedUsers = existingUsers.map((u) =>
      u.email === user.email
        ? { ...u, password: passwordData.newPassword }
        : u,
    );
    localStorage.setItem("mockUsers", JSON.stringify(updatedUsers));

    alert("✅ Password changed successfully!");
    setShowPasswordChange(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Address Management Functions
  const openAddAddressForm = () => {
    setEditingAddress(null);
    setAddressFormData({
      fullName: user.name || "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });
    setShowAddressForm(true);
  };

  const openEditAddressForm = (addressItem) => {
    setEditingAddress(addressItem);

    let parsedData = {
      fullName: userData.name || "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    };

    if (addressItem.fullName || addressItem.phone || addressItem.street) {
      parsedData = {
        fullName: addressItem.fullName || user.name || "",
        phone: addressItem.phone || "",
        street: addressItem.street || "",
        city: addressItem.city || "",
        state: addressItem.state || "",
        pincode: addressItem.pincode || "",
      };
    } else if (addressItem.text) {
      const parts = addressItem.text.split(", ");
      if (parts.length >= 6) {
        parsedData = {
          fullName: parts[0] || user.name || "",
          phone: parts[1] || "",
          street: parts[2] || "",
          city: parts[3] || "",
          state: parts[4] || "",
          pincode: parts[5].replace(/^-\s*/, "") || "",
        };
      }
    }

    setAddressFormData(parsedData);
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressFormData({
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  const handleAddressInputChange = (field, value) => {
    setAddressFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveAddress = () => {
    if (!addressFormData.fullName.trim()) {
      alert("Please enter full name");
      return;
    }
    if (!addressFormData.phone.trim()) {
      alert("Please enter phone number");
      return;
    }
    if (!addressFormData.street.trim()) {
      alert("Please enter street address");
      return;
    }
    if (!addressFormData.city.trim()) {
      alert("Please enter city");
      return;
    }
    if (!addressFormData.state.trim()) {
      alert("Please enter state");
      return;
    }
    if (!addressFormData.pincode.trim()) {
      alert("Please enter PIN code");
      return;
    }

    const allAddresses =
      JSON.parse(localStorage.getItem("mockAddresses")) || [];

    const addressData = {
      userEmail: user.email,
      text: `${addressFormData.fullName}, ${addressFormData.phone}, ${addressFormData.street}, ${addressFormData.city}, ${addressFormData.state} - ${addressFormData.pincode}`,
      ...addressFormData,
    };

    if (editingAddress) {
      const index = allAddresses.findIndex(
        (a) => a.userEmail === user.email && a.text === editingAddress.text,
      );
      if (index !== -1) {
        allAddresses[index] = addressData;
      }
    } else {
      allAddresses.push(addressData);
    }

    localStorage.setItem("mockAddresses", JSON.stringify(allAddresses));

    const updatedUserAddresses = allAddresses.filter(
      (a) => a.userEmail === user.email,
    );
    setAddresses(updatedUserAddresses);

    closeAddressForm();
  };

  const handleDeleteAddress = (index) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    const addrToDelete = addresses[index];
    const allAddresses =
      JSON.parse(localStorage.getItem("mockAddresses")) || [];
    const updatedAll = allAddresses.filter(
      (a) =>
        !(
          a.userEmail === addrToDelete.userEmail && a.text === addrToDelete.text
        ),
    );

    localStorage.setItem("mockAddresses", JSON.stringify(updatedAll));
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const setAsDefault = (index) => {
    const selectedAddr = addresses[index];
    const otherAddrs = addresses.filter((_, i) => i !== index);
    const reorderedAddrs = [selectedAddr, ...otherAddrs];

    const allAddresses =
      JSON.parse(localStorage.getItem("mockAddresses")) || [];
    const otherUserAddrs = allAddresses.filter(
      (a) => a.userEmail !== user.email,
    );
    const updatedAll = [...reorderedAddrs, ...otherUserAddrs];

    localStorage.setItem("mockAddresses", JSON.stringify(updatedAll));
    setAddresses(reorderedAddrs);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) return;

    const existingUsers = JSON.parse(localStorage.getItem("mockUsers")) || [];
    const updatedUsers = existingUsers.map((u) =>
      u.email === user.email ? { ...u, name: editName } : u,
    );
    localStorage.setItem("mockUsers", JSON.stringify(updatedUsers));

    updateUser(editName);

    setShowEditProfile(false);
    alert("✅ Profile updated successfully!");
  };

  const handleDeleteAccount = () => {
    const isConfirmed = window.confirm(
      "⚠️ WARNING: Are you sure you want to delete your account?\n\nThis will permanently erase your data and cannot be undone.",
    );

    if (isConfirmed) {
      const existingUsers = JSON.parse(localStorage.getItem("mockUsers")) || [];
      const remainingUsers = existingUsers.filter(
        (u) => u.email !== user.email,
      );
      localStorage.setItem("mockUsers", JSON.stringify(remainingUsers));

      // Cleanup user data
      const userEmail = user.email;

      // 1. Cleanup Orders
      const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
      const remainingOrders = allOrders.filter(o => o.userEmail !== userEmail);
      localStorage.setItem("mockOrders", JSON.stringify(remainingOrders));

      // 2. Cleanup Addresses
      const allAddresses = JSON.parse(localStorage.getItem("mockAddresses")) || [];
      const remainingAddresses = allAddresses.filter(a => a.userEmail !== userEmail);
      localStorage.setItem("mockAddresses", JSON.stringify(remainingAddresses));

      // 3. Cleanup Payment Methods
      const allPayments = JSON.parse(localStorage.getItem("mockPayments")) || [];
      const remainingPayments = allPayments.filter(p => p.userEmail !== userEmail);
      localStorage.setItem("mockPayments", JSON.stringify(remainingPayments));

      // 4. Cleanup Reviews
      const allReviews = JSON.parse(localStorage.getItem("productReviews")) || {};
      const cleanedReviews = {};
      Object.keys(allReviews).forEach(productTitle => {
        cleanedReviews[productTitle] = allReviews[productTitle].filter(r => r.userEmail !== userEmail);
      });
      localStorage.setItem("productReviews", JSON.stringify(cleanedReviews));

      // 5. Cleanup Preferences & Metadata
      localStorage.removeItem("notificationPrefs_" + userEmail);
      localStorage.removeItem("memberSince_" + userEmail);
      localStorage.removeItem("lastLogin_" + userEmail);
      localStorage.removeItem("recentlyViewed_" + userEmail);

      logout();

      alert("Your account has been successfully deleted.");
      navigate("/signup");
    }
  };

  // Payment Method Handlers
  const handlePaymentInputChange = (field, value) => {
    if (field === "cardNumber") {
      // Allow only numbers and format as groups of 4
      const rawValue = value.replace(/\D/g, "").substring(0, 16);
      const formatted = rawValue.match(/.{1,4}/g)?.join(" ") || rawValue;
      setPaymentFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setPaymentFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const savePaymentMethod = () => {
    if (
      !paymentFormData.cardNumber ||
      !paymentFormData.cardHolder ||
      !paymentFormData.expiryMonth ||
      !paymentFormData.expiryYear ||
      !paymentFormData.cvv
    ) {
      alert("Please fill in all payment details");
      return;
    }

    const newPayment = {
      id: Date.now(),
      userEmail: user.email,
      ...paymentFormData,
      lastFour: paymentFormData.cardNumber.replace(/\s/g, "").slice(-4),
    };

    const updatedPayments = [...paymentMethods, newPayment];
    setPaymentMethods(updatedPayments);

    // Update global mock storage
    const allPayments = JSON.parse(localStorage.getItem("mockPayments")) || [];
    const otherPayments = allPayments.filter(
      (p) => p.userEmail !== user.email,
    );
    localStorage.setItem(
      "mockPayments",
      JSON.stringify([...otherPayments, ...updatedPayments]),
    );

    setShowPaymentForm(false);
    setPaymentFormData({
      cardNumber: "",
      cardHolder: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      cardType: "Credit Card",
    });
    alert("✅ Payment method added successfully!");
  };

  const handleDeletePayment = (id) => {
    if (window.confirm("Are you sure you want to remove this card?")) {
      const updatedPayments = paymentMethods.filter((p) => p.id !== id);
      setPaymentMethods(updatedPayments);
      // In a real app, we would also update localStorage here similar to savePaymentMethod
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-6 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
          My Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-bold mb-4 shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {user.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                {user.email}
              </p>

              {/* Verification Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium mb-4">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Account
              </div>

              {/* Account Info */}
              <div className="w-full space-y-2 text-left border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Member Since
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {memberSince}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Last Login
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {lastLogin}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>

            {/* Stats Dashboard */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
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
                Account Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      Total Orders
                    </span>
                  </div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 text-lg">
                    {totalOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      Total Spent
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">
                    {formatPrice(totalSpent)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">❤️</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      Wishlist Items
                    </span>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-400 text-lg">
                    {wishlistCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
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
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  to="/"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors no-underline"
                >
                  <span>🛍️</span> Continue Shopping
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors no-underline"
                >
                  <span>❤️</span> My Wishlist
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors no-underline"
                >
                  <span>🛒</span> My Cart
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Notification Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Notification Preferences
              </h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notificationPrefs.orderUpdates
                        ? "bg-indigo-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    onClick={() => handleNotificationToggle("orderUpdates")}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow transition-transform ${
                        notificationPrefs.orderUpdates
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Order Updates
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notificationPrefs.promotions
                        ? "bg-indigo-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    onClick={() => handleNotificationToggle("promotions")}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow transition-transform ${
                        notificationPrefs.promotions
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Promotions & Deals
                  </span>
                </label>
              </div>
            </div>

            {/* Recently Viewed Products */}
            {recentlyViewed.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recently Viewed
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recentlyViewed.map((product, index) => (
                    <Link
                      key={index}
                      to={`/product/${encodeURIComponent(product.title)}`}
                      className="group block"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-600 group-hover:border-indigo-300 dark:group-hover:border-indigo-500 transition-colors">
                        <div className="h-24 flex items-center justify-center p-2">
                          <img
                            src={product.src}
                            alt={product.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                            {product.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0 flex items-center gap-2">
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Recent Orders
                </h3>
                <button
                  onClick={() => setShowOrders(!showOrders)}
                  className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer"
                >
                  {showOrders ? "Hide Orders" : "View Orders"}
                </button>
              </div>

              {showOrders && (
                <div className="animate-fadeIn">
                  {orders.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {orders.map((order, index) => (
                        <div
                          key={index}
                          className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-700/50 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                Order #{order.id}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {order.date}
                              </span>
                            </div>
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-md text-xs font-bold">
                              Confirmed ✅
                            </span>
                          </div>

                          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 overflow-hidden shrink-0 flex items-center justify-center">
                                    <img
                                      src={item.src}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300 line-clamp-1">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white shrink-0 ml-4">
                                  Qty: {item.quantity || 1}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                +{order.items.length - 3} more items
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              Total Amount
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          <Link
                            to={`/track-order/${order.id}`}
                            className="mt-4 w-full block text-center py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors no-underline"
                          >
                            📍 Track Order
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="text-5xl mb-4">📦</span>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg m-0">
                        No orders yet
                      </p>
                      <Link
                        to="/"
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors no-underline"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Settings Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                Account Settings
              </h3>

              <div className="space-y-4">
                {/* 1. Edit Profile */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowEditProfile(!showEditProfile)}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                      <span>👤</span> Personal Information
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                      {showEditProfile ? "Close ↑" : "Edit →"}
                    </span>
                  </div>
                  {showEditProfile && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Full Name
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={handleSaveProfile}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full p-2.5 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          For security reasons, your email address cannot be
                          changed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Change Password */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                      <span>🔒</span> Change Password
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                      {showPasswordChange ? "Close ↑" : "Update →"}
                    </span>
                  </div>
                  {showPasswordChange && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="Enter new password"
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={handlePasswordChange}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors cursor-pointer border-none"
                      >
                        Update Password
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Shipping Addresses */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowAddresses(!showAddresses)}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                      <span>📍</span> Shipping Addresses ({addresses.length})
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                      {showAddresses ? "Close ↑" : "Manage →"}
                    </span>
                  </div>

                  {showAddresses && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      {!showAddressForm && (
                        <button
                          onClick={openAddAddressForm}
                          className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-500 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">+</span> Add New Address
                        </button>
                      )}

                      {showAddressForm && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 animate-fadeIn">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                            {editingAddress
                              ? "✏️ Edit Address"
                              : "➕ Add New Address"}
                          </h4>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Full Name *
                                </label>
                                <input
                                  type="text"
                                  value={addressFormData.fullName}
                                  onChange={(e) =>
                                    handleAddressInputChange(
                                      "fullName",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="John Doe"
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Phone Number *
                                </label>
                                <input
                                  type="tel"
                                  value={addressFormData.phone}
                                  onChange={(e) =>
                                    handleAddressInputChange(
                                      "phone",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="9876543210"
                                  maxLength="10"
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Street Address *
                              </label>
                              <input
                                type="text"
                                value={addressFormData.street}
                                onChange={(e) =>
                                  handleAddressInputChange(
                                    "street",
                                    e.target.value,
                                  )
                                }
                                placeholder="123 Main Street, Apartment 4B"
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  City *
                                </label>
                                <input
                                  type="text"
                                  value={addressFormData.city}
                                  onChange={(e) =>
                                    handleAddressInputChange(
                                      "city",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Mumbai"
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  State *
                                </label>
                                <input
                                  type="text"
                                  value={addressFormData.state}
                                  onChange={(e) =>
                                    handleAddressInputChange(
                                      "state",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Maharashtra"
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  PIN Code *
                                </label>
                                <input
                                  type="text"
                                  value={addressFormData.pincode}
                                  onChange={(e) =>
                                    handleAddressInputChange(
                                      "pincode",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="400001"
                                  maxLength="6"
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                              <button
                                onClick={saveAddress}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm cursor-pointer border-none"
                              >
                                {editingAddress
                                  ? "Update Address"
                                  : "Save Address"}
                              </button>
                              <button
                                onClick={closeAddressForm}
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {addresses.length === 0 && !showAddressForm ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <span className="text-3xl mb-2 block">📍</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No saved addresses yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {addresses.map((addr, index) => {
                            const displayName =
                              addr.fullName ||
                              (addr.text
                                ? addr.text.split(", ")[0]
                                : "Unknown");
                            const displayPhone =
                              addr.phone ||
                              (addr.text ? addr.text.split(", ")[1] : "");
                            const displayStreet =
                              addr.street ||
                              (addr.text
                                ? addr.text.split(", ")[2]
                                : addr.text);
                            const displayCity =
                              addr.city ||
                              (addr.text ? addr.text.split(", ")[3] : "");
                            const displayState =
                              addr.state ||
                              (addr.text ? addr.text.split(", ")[4] : "");
                            const displayPincode =
                              addr.pincode ||
                              (addr.text ? addr.text.split(", ")[5] : "");

                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                  index === 0
                                    ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md"
                                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 pr-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                                        {displayName}
                                      </span>
                                      {index === 0 && (
                                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                      {displayStreet}
                                      {displayCity && `, ${displayCity}`}
                                      {displayState && `, ${displayState}`}
                                      {displayPincode && ` - ${displayPincode}`}
                                    </p>
                                    {displayPhone && (
                                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 flex items-center gap-1">
                                        <span>📞</span> {displayPhone}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1 shrink-0">
                                    <button
                                      onClick={() => openEditAddressForm(addr)}
                                      className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer border-none"
                                      title="Edit Address"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAddress(index)}
                                      className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer border-none"
                                      title="Delete Address"
                                    >
                                      🗑️
                                    </button>
                                    {index !== 0 && (
                                      <button
                                        onClick={() => setAsDefault(index)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors cursor-pointer border-none"
                                        title="Set as Default"
                                      >
                                        ⭐
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Payment Methods */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                      <span>💳</span> Payment Methods
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                      {showPaymentMethods ? "Close ↑" : "Manage →"}
                    </span>
                  </div>

                  {showPaymentMethods && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              CARD
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                •••• •••• •••• {method.lastFour}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Expires {method.expiryMonth}/{method.expiryYear}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePayment(method.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors border-none cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}

                      {!showPaymentForm ? (
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-500 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="text-xl">+</span> Add New Card
                        </button>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 animate-fadeIn">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">
                            Add New Card
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Card Number
                              </label>
                              <input
                                type="text"
                                value={paymentFormData.cardNumber}
                                onChange={(e) =>
                                  handlePaymentInputChange(
                                    "cardNumber",
                                    e.target.value,
                                  )
                                }
                                placeholder="0000 0000 0000 0000"
                                maxLength="19"
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Card Holder Name
                              </label>
                              <input
                                type="text"
                                value={paymentFormData.cardHolder}
                                onChange={(e) =>
                                  handlePaymentInputChange(
                                    "cardHolder",
                                    e.target.value,
                                  )
                                }
                                placeholder="Name on card"
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Expiry Month
                                </label>
                                <input
                                  type="text"
                                  placeholder="MM"
                                  maxLength="2"
                                  value={paymentFormData.expiryMonth}
                                  onChange={(e) =>
                                    handlePaymentInputChange(
                                      "expiryMonth",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Expiry Year
                                </label>
                                <input
                                  type="text"
                                  placeholder="YY"
                                  maxLength="2"
                                  value={paymentFormData.expiryYear}
                                  onChange={(e) =>
                                    handlePaymentInputChange(
                                      "expiryYear",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  CVV
                                </label>
                                <input
                                  type="password"
                                  placeholder="123"
                                  maxLength="3"
                                  value={paymentFormData.cvv}
                                  onChange={(e) =>
                                    handlePaymentInputChange(
                                      "cvv",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                            <div className="flex gap-3 pt-3">
                              <button
                                onClick={savePaymentMethod}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer border-none"
                              >
                                Save Card
                              </button>
                              <button
                                onClick={() => setShowPaymentForm(false)}
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Help & Support */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowSupport(!showSupport)}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                      <span>❓</span> Help & Support
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                      {showSupport ? "Close ↑" : "View →"}
                    </span>
                  </div>
                  {showSupport && (
                    <div className="mt-4 animate-fadeIn space-y-2">
                      {/* Contact Support */}
                      <div
                        onClick={() =>
                          setActiveSupportSection(
                            activeSupportSection === "contact"
                              ? null
                              : "contact",
                          )
                        }
                        className={`p-3 rounded-lg text-sm m-0 cursor-pointer transition-colors font-medium flex justify-between items-center ${
                          activeSupportSection === "contact"
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-indigo-700 dark:hover:text-indigo-400"
                        }`}
                      >
                        <span>📞 Contact Customer Service</span>
                        <span>
                          {activeSupportSection === "contact" ? "−" : "+"}
                        </span>
                      </div>
                      {activeSupportSection === "contact" && (
                        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 animate-fadeIn ml-2 mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white mb-2">
                            We're here to help!
                          </p>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
                              <span>📧</span>{" "}
                              <a
                                href="mailto:support@intellikart.com"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                support@intellikart.com
                              </a>
                            </p>
                            <p className="flex items-center gap-2">
                              <span>📞</span>{" "}
                              <a
                                href="tel:+919876543210"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                +91 98765 43210
                              </a>
                            </p>
                            <p className="flex items-center gap-2">
                              <span>🕒</span> Mon-Sat, 9:00 AM - 8:00 PM
                            </p>
                          </div>
                        </div>
                      )}

                      {/* FAQ */}
                      <div
                        onClick={() =>
                          setActiveSupportSection(
                            activeSupportSection === "faq" ? null : "faq",
                          )
                        }
                        className={`p-3 rounded-lg text-sm m-0 cursor-pointer transition-colors font-medium flex justify-between items-center ${
                          activeSupportSection === "faq"
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-indigo-700 dark:hover:text-indigo-400"
                        }`}
                      >
                        <span>❓ Frequently Asked Questions</span>
                        <span>
                          {activeSupportSection === "faq" ? "−" : "+"}
                        </span>
                      </div>
                      {activeSupportSection === "faq" && (
                        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 animate-fadeIn ml-2 mb-2 space-y-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">
                              How do I track my order?
                            </p>
                            <p>
                              Go to "Recent Orders" section above and click
                              "Track Order" on your purchase.
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">
                              Can I cancel my order?
                            </p>
                            <p>
                              Yes, you can cancel orders that haven't been
                              shipped yet from the order details page.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Return Policy */}
                      <div
                        onClick={() =>
                          setActiveSupportSection(
                            activeSupportSection === "return" ? null : "return",
                          )
                        }
                        className={`p-3 rounded-lg text-sm m-0 cursor-pointer transition-colors font-medium flex justify-between items-center ${
                          activeSupportSection === "return"
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-indigo-700 dark:hover:text-indigo-400"
                        }`}
                      >
                        <span>🔄 Return Policy</span>
                        <span>
                          {activeSupportSection === "return" ? "−" : "+"}
                        </span>
                      </div>
                      {activeSupportSection === "return" && (
                        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 animate-fadeIn ml-2 mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white mb-2">
                            Easy 10-Day Returns
                          </p>
                          <p className="mb-2">
                            If you are not satisfied with your purchase, you can
                            return it within 10 days for a full refund.
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-xs">
                            <li>
                              Item must be unused and in original packaging.
                            </li>
                            <li>Include all tags and accessories.</li>
                            <li>
                              Refunds are processed within 5-7 business days.
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Delete Account */}
                <div className="pt-2">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={handleDeleteAccount}
                  >
                    <span className="text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                      <span>🗑️</span> Delete Account
                    </span>
                    <span className="text-red-600 dark:text-red-400 text-sm font-semibold">
                      Delete →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default Profile;
