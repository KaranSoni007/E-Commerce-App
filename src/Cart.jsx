import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";

function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, setCart } =
    useCart();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });

  const [showOffers, setShowOffers] = useState(false);

  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Payment State
  const [savedPayments, setSavedPayments] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState(""); // ID or 'COD'
  const [cvvInput, setCvvInput] = useState(""); // For saved cards
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // New Payment Form State in Cart
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
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

  // Address Form State (for editing only)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const availableOffers = [
    { code: "INTERN20", desc: "Get 20% OFF on your entire order." },
    { code: "WELCOME50", desc: "Flat 50% OFF for new users!" },
  ];

  // Get current user email
  const getUserEmail = () => {
    return user?.email || "user@example.com";
  };

  // Load saved addresses
  useEffect(() => {
    const userEmail = getUserEmail();
    const allAddresses =
      JSON.parse(localStorage.getItem("mockAddresses")) || [];
    const userAddresses = allAddresses.filter((a) => a.userEmail === userEmail);
    setSavedAddresses(userAddresses);

    if (userAddresses.length > 0 && !address) {
      setAddress(userAddresses[0].text);
    }

    // Load saved payments
    const allPayments = JSON.parse(localStorage.getItem("mockPayments")) || [];
    const userPayments = allPayments.filter((p) => p.userEmail === userEmail);
    setSavedPayments(userPayments);

    // Default to COD if no payments, or first payment
    setSelectedPaymentId("COD");
  }, []);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const getNumericPrice = (priceStr) => {
    if (!priceStr) return 0;
    return parseFloat(String(priceStr).replace(/[^0-9.-]+/g, "")) || 0;
  };

  const formatPrice = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();

    if (code === "INTERN20") {
      setDiscountPercent(0.2);
      setCouponMessage({ type: "success", text: "✨ Coupon applied! 20% OFF" });
    } else if (code === "WELCOME50") {
      setDiscountPercent(0.5);
      setCouponMessage({ type: "success", text: "✨ Coupon applied! 50% OFF" });
    } else if (code === "") {
      setCouponMessage({ type: "error", text: "Please enter a code." });
    } else {
      setDiscountPercent(0);
      setCouponMessage({
        type: "error",
        text: "❌ Invalid or expired coupon code.",
      });
    }
  };

  const subtotal = cart.reduce(
    (total, item) =>
      total + getNumericPrice(item.OriginalPrice) * (item.quantity || 1),
    0,
  );
  const discountAmount = subtotal * discountPercent;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.05;
  const total = discountedSubtotal + tax;

  // Address Management Functions
  const openAddForm = () => {
    setEditingAddress(null);
    setFormData({
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });
    setShowAddressForm(true);
  };

  const openEditForm = (addressItem) => {
    setEditingAddress(addressItem);

    // Parse address data - handle both structured and old text-only formats
    let parsedData = {
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    };

    if (addressItem.fullName || addressItem.phone || addressItem.street) {
      // New structured format
      parsedData = {
        fullName: addressItem.fullName || "",
        phone: addressItem.phone || "",
        street: addressItem.street || "",
        city: addressItem.city || "",
        state: addressItem.state || "",
        pincode: addressItem.pincode || "",
      };
    } else if (addressItem.text) {
      // Old text format - parse from comma-separated string
      const parts = addressItem.text.split(", ");
      if (parts.length >= 6) {
        parsedData = {
          fullName: parts[0] || "",
          phone: parts[1] || "",
          street: parts[2] || "",
          city: parts[3] || "",
          state: parts[4] || "",
          pincode: parts[5].replace(/^-\s*/, "") || "",
        };
      } else if (parts.length >= 5) {
        parsedData = {
          fullName: parts[0] || "",
          phone: parts[1] || "",
          street: parts[2] || "",
          city: parts[3] || "",
          state: parts[4] || "",
          pincode: parts[5] ? parts[5].replace(/^-\s*/, "") : "",
        };
      } else if (parts.length === 1) {
        parsedData.street = addressItem.text;
      } else {
        parsedData.fullName = parts[0] || "";
        parsedData.phone = parts[1] || "";
        parsedData.street = parts[2] || "";
        if (parts[3]) parsedData.city = parts[3];
        if (parts[4]) parsedData.state = parts[4];
      }
    }

    setFormData(parsedData);
    setShowAddressForm(true);
  };

  const closeForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setFormData({
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveAddress = () => {
    // Validation
    if (!formData.fullName.trim()) {
      alert("Please enter full name");
      return;
    }
    if (!formData.phone.trim()) {
      alert("Please enter phone number");
      return;
    }
    if (!formData.street.trim()) {
      alert("Please enter street address");
      return;
    }
    if (!formData.city.trim()) {
      alert("Please enter city");
      return;
    }
    if (!formData.state.trim()) {
      alert("Please enter state");
      return;
    }
    if (!formData.pincode.trim()) {
      alert("Please enter PIN code");
      return;
    }
    const userEmail = getUserEmail();
    const allAddresses =
      JSON.parse(localStorage.getItem("mockAddresses")) || [];

    const addressData = {
      userEmail,
      text: `${formData.fullName}, ${formData.phone}, ${formData.street}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
      ...formData,
    };

    if (editingAddress) {
      // Update existing address
      const index = allAddresses.findIndex(
        (a) => a.userEmail === userEmail && a.text === editingAddress.text,
      );
      if (index !== -1) {
        allAddresses[index] = addressData;
      }
    } else {
      allAddresses.push(addressData);
    }

    localStorage.setItem("mockAddresses", JSON.stringify(allAddresses));

    // Refresh addresses
    const updatedUserAddresses = allAddresses.filter(
      (a) => a.userEmail === userEmail,
    );
    setSavedAddresses(updatedUserAddresses);

    // Select the newly saved/added address
    setAddress(addressData.text);

    closeForm();
  };

  const selectAddress = (addressItem) => {
    setAddress(addressItem.text);
  };

  const handlePaymentInputChange = (field, value) => {
    if (field === "cardNumber") {
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

    const userEmail = getUserEmail();
    const allPayments = JSON.parse(localStorage.getItem("mockPayments")) || [];

    const newPayment = {
      id: Date.now(),
      userEmail,
      ...paymentFormData,
      lastFour:
        paymentFormData.type === "CARD"
          ? paymentFormData.cardNumber.replace(/\s/g, "").slice(-4)
          : null,
    };

    const updatedPayments = [...allPayments, newPayment];
    localStorage.setItem("mockPayments", JSON.stringify(updatedPayments));

    // Update local state
    const userPayments = updatedPayments.filter(
      (p) => p.userEmail === userEmail,
    );
    setSavedPayments(userPayments);
    setSelectedPaymentId(newPayment.id); // Auto-select new payment
    setShowPaymentForm(false);

    // Reset form
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
    alert("✅ Payment method added!");
  };

  const handleCheckout = (e) => {
    if (e) e.preventDefault();

    if (!address.trim()) {
      alert(
        "⚠️ Please enter or select a delivery address before checking out.",
      );
      return;
    }

    // Payment Validation
    let finalPaymentMethod = "Cash on Delivery";
    if (selectedPaymentId !== "COD") {
      const selectedPayment = savedPayments.find(
        (p) => p.id === selectedPaymentId,
      );
      if (!selectedPayment) {
        alert("Please select a valid payment method.");
        return;
      }
      // OTP validation
      if (otp.length !== 6) {
        alert("Please enter the 6-digit OTP.");
        return;
      }
      // Mock OTP check
      if (otp !== "123456") {
        alert("Invalid OTP. Please try again.");
        return;
      }
      finalPaymentMethod =
        selectedPayment.type === "CARD"
          ? "Credit/Debit Card"
          : selectedPayment.type === "UPI"
            ? "UPI"
            : "Net Banking";
    }

    const userEmail = getUserEmail();

    const newOrder = {
      id: Math.floor(100000 + Math.random() * 900000),
      userEmail: userEmail,
      items: [...cart],
      total: total,
      paymentMethod: finalPaymentMethod,
      date: new Date().toISOString(),
    };

    const existingOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    existingOrders.push(newOrder);
    localStorage.setItem("mockOrders", JSON.stringify(existingOrders));
    
    clearCart();

    navigate(`/order-confirmation/${newOrder.id}`);
  };

  if (cart.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen font-sans pb-20 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <span className="text-[60px] block mb-4">🛒</span>
          <h2 className="text-[24px] text-gray-900 mb-2 font-bold">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link
            to="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold inline-block transition-colors duration-200 no-underline"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const isGetOtpDisabled = () => {
    if (!selectedPaymentId || selectedPaymentId === "COD") {
      return true;
    }
    const selectedPayment = savedPayments.find(
      (p) => p.id === selectedPaymentId,
    );
    if (!selectedPayment) {
      return true;
    }
    if (selectedPayment.type === "CARD" && cvvInput.length !== 3) {
      return true;
    }
    return false;
  };

  const isCheckoutDisabled = () => {
    if (!address.trim()) return true;
    if (selectedPaymentId && selectedPaymentId !== "COD") {
      if (!otpSent || otp.length !== 6) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-500">
            You have {cart.reduce((acc, item) => acc + (item.quantity || 1), 0)}{" "}
            items in your cart
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Cart Items */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {cart.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center transition-all hover:shadow-md"
              >
                <div className="w-full sm:w-32 h-32 rounded-xl bg-gray-50 p-2 flex items-center justify-center border border-gray-100 shrink-0">
                  <Link
                    to={`/product/${item.id}`}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-contain mix-blend-multiply"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  </Link>
                </div>
                <div className="flex-1 w-full flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3">
                    <Link
                      to={`/product/${item.id}`}
                      className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 leading-snug hover:text-indigo-600 transition-colors no-underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-lg font-bold text-indigo-600 whitespace-nowrap">
                      {formatPrice(getNumericPrice(item.OriginalPrice))}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-auto pt-1">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() =>
                          updateQuantity && updateQuantity(item.title, -1)
                        }
                        className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors active:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-gray-900">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity && updateQuantity(item.title, 1)
                        }
                        className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors active:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.title)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-[400px] w-full shrink-0 sticky top-24">
            <form
              onSubmit={handleCheckout}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-xl font-extrabold text-gray-900 mb-6">
                Order Summary
              </h3>

              <div className="mb-5">
                <div className="flex w-full gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="grow py-2.5 px-4 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors shadow-sm"
                  >
                    Apply
                  </button>
                </div>

                <div className="text-right mt-1.5">
                  <span
                    onClick={() => setShowOffers(!showOffers)}
                    className="text-[13px] text-indigo-600 font-semibold cursor-pointer hover:underline"
                  >
                    {showOffers ? "Hide offers" : "View available offers"}
                  </span>
                </div>

                {showOffers && (
                  <div className="mt-3 space-y-2 animate-fadeIn">
                    {availableOffers.map((offer, idx) => (
                      <div
                        key={idx}
                        className="border border-dashed border-indigo-300 bg-indigo-50 p-3 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-indigo-700 text-sm block">
                            {offer.code}
                          </span>
                          <span className="text-xs text-gray-600">
                            {offer.desc}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCouponCode(offer.code);
                            setShowOffers(false);
                          }}
                          className="bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-indigo-50 cursor-pointer transition-colors"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {couponMessage.text && (
                  <p
                    className={`mt-2 text-[13px] font-medium ${couponMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              <div className="space-y-3 py-4 border-t border-b border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[15px]">
                    Subtotal ({cart.reduce((a, c) => a + (c.quantity || 1), 0)}{" "}
                    items)
                  </span>
                  <span className="text-gray-900 text-[15px] font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-600 text-[15px] font-semibold">
                      Discount ({discountPercent * 100}%)
                    </span>
                    <span className="text-emerald-600 text-[15px] font-semibold">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[15px]">
                    Estimated Tax (5%)
                  </span>
                  <span className="text-gray-900 text-[15px] font-semibold">
                    {formatPrice(tax)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <span className="text-gray-900 text-lg font-bold">
                  Total Amount
                </span>
                <span className="text-indigo-600 text-2xl font-extrabold">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Delivery Address Section - Optimized for Checkout */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-900 text-base">
                    Delivery Address <span className="text-red-500">*</span>
                  </h4>
                  <Link
                    to="/profile"
                    className="text-indigo-600 text-xs font-semibold hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg no-underline"
                  >
                    Manage
                  </Link>
                </div>

                {/* Saved Addresses List - Select & Edit Only */}
                {savedAddresses.length > 0 && !showAddressForm && (
                  <div className="mb-4 space-y-3">
                    {savedAddresses.map((addr, index) => {
                      const displayName =
                        addr.fullName ||
                        (addr.text ? addr.text.split(", ")[0] : "Unknown");
                      const displayPhone =
                        addr.phone ||
                        (addr.text ? addr.text.split(", ")[1] : "");
                      const displayStreet =
                        addr.street ||
                        (addr.text ? addr.text.split(", ")[2] : addr.text);
                      const displayCity =
                        addr.city ||
                        (addr.text ? addr.text.split(", ")[3] : "");
                      const displayState =
                        addr.state ||
                        (addr.text ? addr.text.split(", ")[4] : "");
                      const displayPincode =
                        addr.pincode ||
                        (addr.text ? addr.text.split(", ")[5] : "");

                      const isSelected = address === addr.text;
                      const isDefault = index === 0;

                      return (
                        <div
                          key={index}
                          onClick={() => selectAddress(addr)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Radio Indicator */}
                          <div
                            className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-indigo-600" : "border-gray-300"}`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-indigo-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-900 text-sm">
                                    {displayName}
                                  </span>
                                  {isSelected && (
                                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                      Selected
                                    </span>
                                  )}
                                  {isDefault && !isSelected && (
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-xs leading-relaxed">
                                  {displayStreet}
                                  {displayCity && `, ${displayCity}`}
                                  {displayState && `, ${displayState}`}
                                  {displayPincode && ` - ${displayPincode}`}
                                </p>
                                {displayPhone && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    📞 {displayPhone}
                                  </p>
                                )}
                              </div>
                              {/* Edit Button Only - No Delete */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(addr);
                                }}
                                className="text-gray-400 hover:text-indigo-600 p-1 rounded transition-colors"
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
                                    strokeWidth="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  ></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Address Edit Form */}
                {showAddressForm && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-4 animate-fadeIn">
                    <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                      {editingAddress
                        ? "✏️ Edit Address"
                        : "➕ Add New Address"}
                    </h4>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) =>
                              handleInputChange("fullName", e.target.value)
                            }
                            className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            maxLength="10"
                            className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) =>
                            handleInputChange("street", e.target.value)
                          }
                          className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) =>
                              handleInputChange("city", e.target.value)
                            }
                            className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) =>
                              handleInputChange("state", e.target.value)
                            }
                            className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) =>
                              handleInputChange("pincode", e.target.value)
                            }
                            maxLength="6"
                            className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          onClick={saveAddress}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
                        >
                          {editingAddress ? "Save Changes" : "Save Address"}
                        </button>
                        <button
                          type="button"
                          onClick={closeForm}
                          className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add New Address Button */}
                {!showAddressForm && (
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="mt-4 w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">+</span> Add New Address
                  </button>
                )}
              </div>

              {/* Payment Method */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <label className="block mb-3 font-semibold text-gray-700 text-[15px]">
                  Select Payment Method <span className="text-red-600">*</span>
                </label>

                <div className="space-y-3">
                  {/* Saved Payments List */}
                  {savedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      onClick={() => {
                        setSelectedPaymentId(payment.id);
                        setCvvInput(""); // Reset CVV when switching
                        setOtp("");
                        setOtpSent(false);
                        setOtpTimer(0);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                        selectedPaymentId === payment.id
                          ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                          : "border-gray-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      {/* Radio Indicator */}
                      <div
                        className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPaymentId === payment.id ? "border-indigo-600" : "border-gray-300"}`}
                      >
                        {selectedPaymentId === payment.id && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">
                            {payment.type === "CARD" &&
                              `•••• ${payment.lastFour}`}
                            {payment.type === "UPI" && payment.upiId}
                            {payment.type === "NET_BANKING" && payment.bankName}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {payment.type === "CARD"
                              ? "Card"
                              : payment.type === "UPI"
                                ? "UPI"
                                : "Net Banking"}
                          </span>
                        </div>

                        {/* CVV Input for Card */}
                        {selectedPaymentId === payment.id &&
                          payment.type === "CARD" && (
                            <div className="mt-2 animate-fadeIn">
                              <input
                                type="password"
                                placeholder="CVV"
                                maxLength="3"
                                className="w-20 p-2 text-sm border border-gray-300 rounded-md focus:border-indigo-600 outline-none"
                                value={cvvInput}
                                onChange={(e) => setCvvInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  ))}

                  {/* Cash on Delivery Option */}
                  <div
                    onClick={() => {
                      setSelectedPaymentId("COD");
                      setOtp("");
                      setOtpSent(false);
                      setOtpTimer(0);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                      selectedPaymentId === "COD"
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                        : "border-gray-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPaymentId === "COD" ? "border-indigo-600" : "border-gray-300"}`}
                    >
                      {selectedPaymentId === "COD" && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      Cash on Delivery
                    </span>
                  </div>

                  {/* OTP Section */}
                  {selectedPaymentId && selectedPaymentId !== "COD" && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3 animate-fadeIn">
                      <h4 className="text-sm font-bold text-gray-800">
                        Verify to Place Order
                      </h4>
                      <div className="flex gap-3">
                        <input
                          required
                          type="password"
                          placeholder="Enter OTP"
                          maxLength="6"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          disabled={!otpSent}
                          className="w-2/3 p-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("OTP sent to your registered email!");
                            setOtpSent(true);
                            setOtpTimer(30);
                          }}
                          disabled={otpTimer > 0 || isGetOtpDisabled()}
                          className={`w-1/3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg text-sm ${otpTimer > 0 || isGetOtpDisabled() ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {otpTimer > 0
                            ? `Wait ${otpTimer}s`
                            : otpSent
                              ? "Resend OTP"
                              : "Get OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add New Payment Button */}
                  {!showPaymentForm && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">+</span> Add New Payment Method
                    </button>
                  )}

                  {/* New Payment Form */}
                  {showPaymentForm && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-fadeIn">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm">
                        Add Payment Details
                      </h4>

                      {/* Type Selection */}
                      <div className="flex gap-2 mb-3">
                        {["CARD", "UPI", "NET_BANKING"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setPaymentFormData({ ...paymentFormData, type })
                            }
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                              paymentFormData.type === type
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-gray-600 border-gray-300"
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
                            <input
                              type="text"
                              placeholder="Card Number"
                              maxLength="19"
                              value={paymentFormData.cardNumber}
                              onChange={(e) =>
                                handlePaymentInputChange(
                                  "cardNumber",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                            />
                            <input
                              type="text"
                              placeholder="Card Holder Name"
                              value={paymentFormData.cardHolder}
                              onChange={(e) =>
                                handlePaymentInputChange(
                                  "cardHolder",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="MM"
                                maxLength="2"
                                className="w-1/4 p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                                value={paymentFormData.expiryMonth}
                                onChange={(e) =>
                                  handlePaymentInputChange(
                                    "expiryMonth",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="text"
                                placeholder="YY"
                                maxLength="2"
                                className="w-1/4 p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                                value={paymentFormData.expiryYear}
                                onChange={(e) =>
                                  handlePaymentInputChange(
                                    "expiryYear",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="password"
                                placeholder="CVV"
                                maxLength="3"
                                className="w-1/2 p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                                value={paymentFormData.cvv}
                                onChange={(e) =>
                                  handlePaymentInputChange(
                                    "cvv",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </>
                        )}

                        {paymentFormData.type === "UPI" && (
                          <input
                            type="text"
                            placeholder="UPI ID (e.g. user@upi)"
                            value={paymentFormData.upiId}
                            onChange={(e) =>
                              handlePaymentInputChange("upiId", e.target.value)
                            }
                            className="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                          />
                        )}

                        {paymentFormData.type === "NET_BANKING" && (
                          <>
                            <select
                              value={paymentFormData.bankName}
                              onChange={(e) =>
                                handlePaymentInputChange(
                                  "bankName",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600 bg-white"
                            >
                              <option value="">Select Bank</option>
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="SBI">State Bank of India</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="Axis Bank">Axis Bank</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Account Number"
                              value={paymentFormData.accountNumber}
                              onChange={(e) =>
                                handlePaymentInputChange(
                                  "accountNumber",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-600"
                            />
                          </>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={savePaymentMethod}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
                          >
                            Save & Use
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPaymentForm(false)}
                            className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCheckoutDisabled()}
                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold text-base mt-6 transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] ${isCheckoutDisabled() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {selectedPaymentId === "COD"
                  ? "Place Order"
                  : "Verify & Place Order"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Cart;
