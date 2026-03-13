import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useAuth } from "./AuthContext";
import { useStock } from "./StockContext";
import { useReviews } from "./ReviewContext";
import { parseAddressText } from "./addressUtils";

function Profile() {
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout, updateUser } = useAuth();
  const { incrementStock } = useStock();
  const { deleteAllUserReviews } = useReviews();

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
    type: "CARD", // CARD, UPI, NET_BANKING
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    upiId: "",
    bankName: "",
    accountNumber: "",
  });

  // Account info
  const [memberSince, setMemberSince] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [isVerified, setIsVerified] = useState(true);

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

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

  const handleCancelOrder = (orderId) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this order? This action cannot be undone.",
      )
    ) {
      const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
      const cancelledAt = new Date().toISOString();
      let orderToCancel;

      const updatedOrders = allOrders.map((o) => {
        if (o.id === orderId) {
          orderToCancel = { ...o, status: "cancelled", cancelledAt };
          return orderToCancel;
        }
        return o;
      });

      if (orderToCancel) {
        incrementStock(orderToCancel.items); // Replenish stock
        localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o.id === orderId ? orderToCancel : o)),
        );
        alert("Order cancelled successfully.");
      }
    }
  };

  const handleBuyAgain = (order) => {
    const addedItems = [];
    const failedItems = [];
    order.items.forEach((item) => {
      try {
        addToCart(item, item.quantity || 1);
        addedItems.push(item.title);
      } catch (error) {
        failedItems.push(item.title);
      }
    });

    if (failedItems.length > 0) {
      alert(
        `Successfully re-added: ${addedItems.join(", ") || "None"}.\n\nOut of stock: ${failedItems.join(", ")}.`,
      );
    } else {
      alert("All items from the order have been added to your cart!");
    }
    navigate("/cart");
  };

  const getOrderStatus = (order) => {
    if (order.status) {
      return order.status;
    }
    const orderTime = new Date(order.date).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - orderTime) / (1000 * 60 * 60);
    if (hoursDiff < 1) return "confirmed";
    if (hoursDiff < 4) return "processing";
    if (hoursDiff < 24) return "shipped";
    if (hoursDiff < 72) return "out_for_delivery";
    return "delivered";
  };

  const isOrderCancellable = (order) => {
    const status = getOrderStatus(order);
    return status === "confirmed" || status === "processing";
  };

  const renderStatusBadge = (order) => {
    const status = getOrderStatus(order);

    switch (status) {
      case "confirmed":
        return (
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Confirmed
          </span>
        );
      case "processing":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Processing
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Cancelled
          </span>
        );
      case "return_requested":
        return (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Return Requested
          </span>
        );
      case "returned":
        return (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            Returned
          </span>
        );
      case "exchange_requested":
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Exchange Requested
          </span>
        );
      case "exchanged":
        return (
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Exchanged
          </span>
        );
      case "shipped":
        return (
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
            Shipped
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Out for Delivery
          </span>
        );
      case "delivered":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
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
            Delivered
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
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
    const userIndex = existingUsers.findIndex((u) => u.email === user.email);

    if (
      userIndex === -1 ||
      existingUsers[userIndex].password !== passwordData.currentPassword
    ) {
      alert("Your current password is not correct.");
      return;
    }

    const updatedUsers = existingUsers.map((u) =>
      u.email === user.email ? { ...u, password: passwordData.newPassword } : u,
    );
    localStorage.setItem("mockUsers", JSON.stringify(updatedUsers));

    // If the user has "Remember Me" enabled, clear the old password
    if (localStorage.getItem("rememberedEmail") === user.email) {
      localStorage.removeItem("rememberedPassword");
    }

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
    const parsedData = parseAddressText(addressItem, user.name);
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
      const remainingOrders = allOrders.filter(
        (o) => o.userEmail !== userEmail,
      );
      localStorage.setItem("mockOrders", JSON.stringify(remainingOrders));

      // 2. Cleanup Addresses
      const allAddresses =
        JSON.parse(localStorage.getItem("mockAddresses")) || [];
      const remainingAddresses = allAddresses.filter(
        (a) => a.userEmail !== userEmail,
      );
      localStorage.setItem("mockAddresses", JSON.stringify(remainingAddresses));

      // 3. Cleanup Payment Methods
      const allPayments =
        JSON.parse(localStorage.getItem("mockPayments")) || [];
      const remainingPayments = allPayments.filter(
        (p) => p.userEmail !== userEmail,
      );
      localStorage.setItem("mockPayments", JSON.stringify(remainingPayments));

      // 4. Cleanup Reviews
      // Use Context to ensure state sync
      deleteAllUserReviews(userEmail);

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
    if (paymentFormData.type === "CARD") {
      if (
        !paymentFormData.cardNumber ||
        !paymentFormData.cardHolder ||
        !paymentFormData.expiryMonth ||
        !paymentFormData.expiryYear ||
        !paymentFormData.cvv
      ) {
        alert("Please fill in all card details");
        return;
      }
    } else if (paymentFormData.type === "UPI") {
      if (!paymentFormData.upiId || !paymentFormData.upiId.includes("@")) {
        alert("Please enter a valid UPI ID");
        return;
      }
    } else if (paymentFormData.type === "NET_BANKING") {
      if (!paymentFormData.bankName || !paymentFormData.accountNumber) {
        alert("Please fill in bank details");
        return;
      }
    }

    if (!user) {
      alert("Please log in to save payment methods");
      return;
    }

    const newPayment = {
      id: Date.now(),
      userEmail: user.email,
      ...paymentFormData,
      lastFour:
        paymentFormData.type === "CARD"
          ? paymentFormData.cardNumber.replace(/\s/g, "").slice(-4)
          : null,
    };

    const updatedPayments = [...paymentMethods, newPayment];
    setPaymentMethods(updatedPayments);

    // Update global mock storage
    const allPayments = JSON.parse(localStorage.getItem("mockPayments")) || [];
    const otherPayments = allPayments.filter((p) => p.userEmail !== user.email);
    localStorage.setItem(
      "mockPayments",
      JSON.stringify([...otherPayments, ...updatedPayments]),
    );

    setShowPaymentForm(false);
    setPaymentFormData({
      type: "CARD",
      cardNumber: "",
      cardHolder: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      upiId: "",
      bankName: "",
      accountNumber: "",
    });
    alert("✅ Payment method added successfully!");
  };

  const handleDeletePayment = (id) => {
    if (
      window.confirm("Are you sure you want to remove this payment method?")
    ) {
      const updatedPayments = paymentMethods.filter((p) => p.id !== id);
      setPaymentMethods(updatedPayments);

      const allPayments =
        JSON.parse(localStorage.getItem("mockPayments")) || [];
      const updatedAllPayments = allPayments.filter((p) => p.id !== id);
      localStorage.setItem("mockPayments", JSON.stringify(updatedAllPayments));

      setToastMessage("Payment method removed successfully!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans transition-colors duration-200">
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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          My Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-bold mb-4 shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {user.name}
              </h2>
              <p className="text-gray-500 text-sm mb-2">{user.email}</p>

              {/* Verification Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
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
              <div className="w-full space-y-2 text-left border-t border-gray-100 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Member Since</span>
                  <span className="text-gray-700 font-medium">
                    {memberSince}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Last Login</span>
                  <span className="text-gray-700 font-medium">{lastLogin}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>

            {/* Stats Dashboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <span className="text-xs text-gray-600">Total Orders</span>
                  </div>
                  <span className="font-bold text-indigo-700 text-lg">
                    {totalOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs text-gray-600">Total Spent</span>
                  </div>
                  <span className="font-bold text-emerald-700 text-lg">
                    {formatPrice(totalSpent)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-xs text-gray-600">
                      Wishlist Items
                    </span>
                  </div>
                  <span className="font-bold text-amber-700 text-lg">
                    {wishlistCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors no-underline"
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
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Continue Shopping
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors no-underline"
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
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  My Wishlist
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors no-underline"
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
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  My Cart
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                        : "bg-gray-300"
                    }`}
                    onClick={() => handleNotificationToggle("orderUpdates")}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        notificationPrefs.orderUpdates
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    Order Updates
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notificationPrefs.promotions
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                    }`}
                    onClick={() => handleNotificationToggle("promotions")}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        notificationPrefs.promotions
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    Promotions & Deals
                  </span>
                </label>
              </div>
            </div>

            {/* Recently Viewed Products */}
            {recentlyViewed.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                      to={`/product/${product.id}`}
                      className="group block"
                    >
                      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group-hover:border-indigo-300 transition-colors">
                        <div className="h-24 flex items-center justify-center p-2">
                          <img
                            src={product.src}
                            alt={product.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 line-clamp-1">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 m-0 flex items-center gap-2">
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
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer"
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
                          className="border border-gray-100 rounded-xl p-5 bg-gray-50 transition-colors hover:border-indigo-200"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <span className="font-bold text-gray-900 block">
                                Order #{order.id}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            {renderStatusBadge(order)}
                          </div>

                          <div className="space-y-3 border-t border-gray-200 pt-4">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    <img
                                      src={item.src}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-gray-700 line-clamp-1">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900 shrink-0 ml-4">
                                  Qty: {item.quantity || 1}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{order.items.length - 3} more items
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-center border-t border-gray-200 mt-4 pt-4">
                            <span className="font-bold text-gray-900 text-sm">
                              Total Amount
                            </span>
                            <span className="font-bold text-indigo-600 text-lg">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-4">
                            <Link
                              to={`/track-order/${order.id}`}
                              className="flex-1 text-center py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors no-underline"
                            >
                              📍 Track Order
                            </Link>
                            {isOrderCancellable(order) && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                            <button
                              onClick={() => handleBuyAgain(order)}
                              className="flex-1 py-2.5 bg-white border border-indigo-600 text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              Buy Again
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="text-5xl mb-4 text-gray-300">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-semibold text-lg m-0">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
                Account Settings
              </h3>

              <div className="space-y-4">
                {/* 1. Edit Profile */}
                <div className="border-b border-gray-100 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowEditProfile(!showEditProfile)}
                  >
                    <span className="text-sm text-gray-700 font-semibold flex items-center gap-2 text-indigo-600">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>{" "}
                      Personal Information
                    </span>
                    <span className="text-indigo-600 text-sm font-semibold">
                      {showEditProfile ? "Close ↑" : "Edit →"}
                    </span>
                  </div>
                  {showEditProfile && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Full Name
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white text-gray-900"
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
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full p-2.5 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                          For security reasons, your email address cannot be
                          changed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Change Password */}
                <div className="border-b border-gray-100 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                  >
                    <span className="text-sm text-gray-700 font-semibold flex items-center gap-2 text-indigo-600">
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>{" "}
                      Change Password
                    </span>
                    <span className="text-indigo-600 text-sm font-semibold">
                      {showPasswordChange ? "Close ↑" : "Update →"}
                    </span>
                  </div>
                  {showPasswordChange && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all bg-white text-gray-900"
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
                <div className="border-b border-gray-100 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowAddresses(!showAddresses)}
                  >
                    <span className="text-sm text-gray-700 font-semibold flex items-center gap-2 text-indigo-600">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>{" "}
                      Shipping Addresses ({addresses.length})
                    </span>
                    <span className="text-indigo-600 text-sm font-semibold">
                      {showAddresses ? "Close ↑" : "Manage →"}
                    </span>
                  </div>

                  {showAddresses && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      {!showAddressForm && (
                        <button
                          onClick={openAddAddressForm}
                          className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>{" "}
                          Add New Address
                        </button>
                      )}

                      {showAddressForm && (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 animate-fadeIn">
                          <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                            {editingAddress ? (
                              <>
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
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>{" "}
                                Edit Address
                              </>
                            ) : (
                              <>
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
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>{" "}
                                Add New Address
                              </>
                            )}
                          </h4>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none transition-all bg-white text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none transition-all bg-white text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none transition-all bg-white text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none transition-all bg-white text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none transition-all bg-white text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none transition-all bg-white text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {addresses.length === 0 && !showAddressForm ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <div className="text-3xl mb-2 flex justify-center text-gray-400">
                            <svg
                              className="w-10 h-10"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">
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
                                    ? "border-indigo-600 bg-indigo-50 shadow-md"
                                    : "border-gray-200 bg-white hover:border-indigo-300"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 pr-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-gray-900 text-sm">
                                        {displayName}
                                      </span>
                                      {index === 0 && (
                                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                      {displayStreet}
                                      {displayCity && `, ${displayCity}`}
                                      {displayState && `, ${displayState}`}
                                      {displayPincode && ` - ${displayPincode}`}
                                    </p>
                                    {displayPhone && (
                                      <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                                        <svg
                                          className="w-3 h-3"
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
                                        </svg>{" "}
                                        {displayPhone}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1 shrink-0">
                                    <button
                                      onClick={() => openEditAddressForm(addr)}
                                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border-none"
                                      title="Edit Address"
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
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAddress(index)}
                                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none"
                                      title="Delete Address"
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
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                    {index !== 0 && (
                                      <button
                                        onClick={() => setAsDefault(index)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer border-none"
                                        title="Set as Default"
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
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                          />
                                        </svg>
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
                <div className="border-b border-gray-100 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                  >
                    <span className="text-sm text-gray-700 font-semibold flex items-center gap-2 text-indigo-600">
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>{" "}
                      Payment Methods
                    </span>
                    <span className="text-indigo-600 text-sm font-semibold">
                      {showPaymentMethods ? "Close ↑" : "Manage →"}
                    </span>
                  </div>

                  {showPaymentMethods && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex justify-between items-center p-4 border border-gray-200 rounded-xl bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm">
                              {method.type === "CARD" && (
                                <svg
                                  className="w-6 h-6 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                  />
                                </svg>
                              )}
                              {method.type === "UPI" && (
                                <svg
                                  className="w-6 h-6 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                              {method.type === "NET_BANKING" && (
                                <svg
                                  className="w-6 h-6 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {method.type === "CARD" &&
                                  `•••• ${method.lastFour}`}
                                {method.type === "UPI" && method.upiId}
                                {method.type === "NET_BANKING" &&
                                  method.bankName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {method.type === "CARD" &&
                                  `Expires ${method.expiryMonth}/${method.expiryYear}`}
                                {method.type === "UPI" && "UPI Linked"}
                                {method.type === "NET_BANKING" &&
                                  `Acc: •••• ${method.accountNumber.slice(-4)}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePayment(method.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border-none cursor-pointer"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {!showPaymentForm ? (
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>{" "}
                          Add Payment Method
                        </button>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 animate-fadeIn">
                          <h4 className="font-bold text-gray-900 mb-4 text-sm">
                            Add New Payment Method
                          </h4>

                          {/* Payment Type Selection */}
                          <div className="flex gap-2 mb-4">
                            {["CARD", "UPI", "NET_BANKING"].map((type) => (
                              <button
                                key={type}
                                onClick={() =>
                                  setPaymentFormData({
                                    ...paymentFormData,
                                    type,
                                  })
                                }
                                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                  paymentFormData.type === type
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {type === "CARD"
                                  ? "Card"
                                  : type === "UPI"
                                    ? "UPI"
                                    : "Net Banking"}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-3">
                            {paymentFormData.type === "CARD" && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                      className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                      className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                      className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            {paymentFormData.type === "UPI" && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  UPI ID
                                </label>
                                <input
                                  type="text"
                                  value={paymentFormData.upiId}
                                  onChange={(e) =>
                                    handlePaymentInputChange(
                                      "upiId",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="username@bank"
                                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                />
                              </div>
                            )}

                            {paymentFormData.type === "NET_BANKING" && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Bank Name
                                  </label>
                                  <select
                                    value={paymentFormData.bankName}
                                    onChange={(e) =>
                                      handlePaymentInputChange(
                                        "bankName",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                  >
                                    <option value="">Select Bank</option>
                                    <option value="HDFC Bank">HDFC Bank</option>
                                    <option value="SBI">
                                      State Bank of India
                                    </option>
                                    <option value="ICICI Bank">
                                      ICICI Bank
                                    </option>
                                    <option value="Axis Bank">Axis Bank</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentFormData.accountNumber}
                                    onChange={(e) =>
                                      handlePaymentInputChange(
                                        "accountNumber",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter Account Number"
                                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white text-gray-900"
                                  />
                                </div>
                              </>
                            )}

                            <div className="flex gap-3 pt-3">
                              <button
                                onClick={savePaymentMethod}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer border-none"
                              >
                                Save Payment Method
                              </button>
                              <button
                                onClick={() => setShowPaymentForm(false)}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer"
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
                <div className="border-b border-gray-100 pb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowSupport(!showSupport)}
                  >
                    <span className="text-sm font-semibold flex items-center gap-2 text-indigo-600">
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
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>{" "}
                      Help & Support
                    </span>
                    <span className="text-indigo-600 text-sm font-semibold">
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
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-indigo-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
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
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>{" "}
                          Contact Customer Service
                        </span>
                        <span>
                          {activeSupportSection === "contact" ? "−" : "+"}
                        </span>
                      </div>
                      {activeSupportSection === "contact" && (
                        <div className="p-4 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 animate-fadeIn ml-2 mb-2">
                          <p className="font-semibold text-gray-900 mb-2">
                            We're here to help!
                          </p>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
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
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <a
                                href="mailto:support@intellikart.com"
                                className="text-indigo-600 hover:underline"
                              >
                                support@intellikart.com
                              </a>
                            </p>
                            <p className="flex items-center gap-2">
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
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <a
                                href="tel:+919876543210"
                                className="text-indigo-600 hover:underline"
                              >
                                +91 98765 43210
                              </a>
                            </p>
                            <p className="flex items-center gap-2">
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>{" "}
                              Mon-Sat, 9:00 AM - 8:00 PM
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
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-indigo-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
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
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>{" "}
                          Frequently Asked Questions
                        </span>
                        <span>
                          {activeSupportSection === "faq" ? "−" : "+"}
                        </span>
                      </div>
                      {activeSupportSection === "faq" && (
                        <div className="p-4 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 animate-fadeIn ml-2 mb-2 space-y-3">
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">
                              How do I track my order?
                            </p>
                            <p>
                              Go to "Recent Orders" section above and click
                              "Track Order" on your purchase.
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">
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
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-indigo-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>{" "}
                          Return Policy
                        </span>
                        <span>
                          {activeSupportSection === "return" ? "−" : "+"}
                        </span>
                      </div>
                      {activeSupportSection === "return" && (
                        <div className="p-4 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 animate-fadeIn ml-2 mb-2">
                          <p className="font-semibold text-gray-900 mb-2">
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
                    <span className="text-sm text-red-600 font-semibold flex items-center gap-2">
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>{" "}
                      Delete Account
                    </span>
                    <span className="text-red-600 text-sm font-semibold">
                      Delete →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
