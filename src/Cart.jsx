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
  const [paymentMethod, setPaymentMethod] = useState("");

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

  const paymentOptions = [
    "Credit/Debit Card",
    "UPI",
    "Net Banking",
    "Cash on Delivery",
  ];

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

    const savedPayment = localStorage.getItem(`preferredPayment_${userEmail}`);
    if (savedPayment) {
      setPaymentMethod(savedPayment);
    } else {
      setPaymentMethod("Credit/Debit Card");
    }
  }, []);

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

  const handleCheckout = (e) => {
    if (e) e.preventDefault();

    if (!address.trim()) {
      alert(
        "⚠️ Please enter or select a delivery address before checking out.",
      );
      return;
    }

    const userEmail = getUserEmail();

    const newOrder = {
      id: Math.floor(100000 + Math.random() * 900000),
      userEmail: userEmail,
      items: [...cart],
      total: total,
      paymentMethod: paymentMethod,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    const existingOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    existingOrders.push(newOrder);
    localStorage.setItem("mockOrders", JSON.stringify(existingOrders));

    localStorage.setItem("cart", JSON.stringify([]));

    if (clearCart) {
      clearCart();
    } else if (setCart) {
      setCart([]);
    }

    navigate(`/order-confirmation/${newOrder.id}`);
  };

  if (cart.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans pb-20 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <span className="text-[60px] block mb-4">🛒</span>
          <h2 className="text-[24px] text-gray-900 dark:text-white mb-2 font-bold">
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

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans pb-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-10 px-6">
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-5">
          <h1 className="text-[30px] font-extrabold text-gray-900 dark:text-white m-0 mb-2">
            Shopping Cart
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 m-0">
            Review your items and proceed to checkout.
          </p>
        </div>

        <div className="flex gap-8 flex-wrap items-start">
          {/* Left Column: Cart Items */}
          <div className="flex-auto basis-[60%] flex flex-col gap-5">
            {cart.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 flex p-5 gap-6 items-center"
              >
                <div className="w-30 h-30 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden shrink-0 p-2">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="grow flex flex-col gap-4">
                  <div>
                    <h3 className="m-0 mb-2 text-lg font-bold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="m-0 text-base font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatPrice(getNumericPrice(item.OriginalPrice))}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuantity && updateQuantity(item.title, -1)
                        }
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-none w-8 h-8 rounded-md text-base font-bold cursor-pointer text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-base font-semibold text-gray-900 dark:text-white min-w-5 text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity && updateQuantity(item.title, 1)
                        }
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-none w-8 h-8 rounded-md text-base font-bold cursor-pointer text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.title)}
                      className="bg-transparent hover:bg-red-50 border-none text-red-500 text-sm font-semibold cursor-pointer p-2 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <div className="flex-auto basis-[30%] min-w-[320px] sticky top-25">
            <form
              onSubmit={handleCheckout}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 className="m-0 mb-6 text-xl font-extrabold text-gray-900 dark:text-white">
                Order Summary
              </h3>

              <div className="mb-5">
                <div className="flex w-full">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="grow py-2.5 px-3 border border-gray-300 dark:border-gray-600 rounded-l-lg text-sm outline-none transition-colors focus:border-indigo-600 dark:bg-gray-700 dark:text-white"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-none py-2.5 px-4 rounded-r-lg font-semibold cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                </div>

                <div className="text-right mt-1.5">
                  <span
                    onClick={() => setShowOffers(!showOffers)}
                    className="text-[13px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
                  >
                    {showOffers ? "Hide offers" : "View available offers"}
                  </span>
                </div>

                {showOffers && (
                  <div className="mt-3 space-y-2 animate-fadeIn">
                    {availableOffers.map((offer, idx) => (
                      <div
                        key={idx}
                        className="border border-dashed border-indigo-300 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm block">
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
                          className="bg-white dark:bg-gray-700 border border-indigo-200 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors"
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

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-5"></div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-500 text-[15px]">
                  Subtotal ({cart.reduce((a, c) => a + (c.quantity || 1), 0)}{" "}
                  items)
                </span>
                <span className="text-gray-900 dark:text-white text-[15px] font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between mb-4">
                  <span className="text-emerald-600 text-[15px] font-semibold">
                    Discount ({discountPercent * 100}%)
                  </span>
                  <span className="text-emerald-600 text-[15px] font-semibold">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between mb-4">
                <span className="text-gray-500 text-[15px]">
                  Estimated Tax (5%)
                </span>
                <span className="text-gray-900 dark:text-white text-[15px] font-semibold">
                  {formatPrice(tax)}
                </span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-5"></div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-900 dark:text-white text-lg font-extrabold">
                  Total
                </span>
                <span className="text-gray-900 dark:text-white text-[22px] font-extrabold">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Delivery Address Section - Optimized for Checkout */}
              <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-semibold text-gray-700 dark:text-gray-300 text-[15px]">
                    Delivery Address <span className="text-red-600">*</span>
                  </label>
                  <Link
                    to="/profile"
                    className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <span>⚙️</span> Manage in Profile
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
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50 shadow-md"
                              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">
                                  {displayName}
                                </span>
                                {isSelected && (
                                  <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    Selected
                                  </span>
                                )}
                                {isDefault && !isSelected && (
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
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
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                              title="Edit Address"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Address Edit Form */}
                {showAddressForm && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 mb-4 animate-fadeIn">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
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
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
                          className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-semibold text-sm transition-colors"
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
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300 text-[15px]">
                  Payment Method <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentOptions.map((method, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border cursor-pointer text-center text-xs font-medium transition-colors ${
                        paymentMethod === method
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-indigo-300 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {method}
                    </div>
                  ))}
                </div>

                {/* Payment Details */}
                <div className="mt-4">
                  {paymentMethod === "Credit/Debit Card" && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 space-y-3 animate-fadeIn">
                      <input
                        required
                        type="text"
                        placeholder="Card Number"
                        maxLength="19"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                      <div className="flex gap-3">
                        <input
                          required
                          type="password"
                          placeholder="CVV"
                          maxLength="3"
                          className="w-1/4 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          required
                          type="text"
                          placeholder="Enter OTP"
                          maxLength="6"
                          className="w-1/2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("OTP sent to your registered mobile number!");
                          }}
                          className="w-1/4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg text-sm"
                        >
                          Get OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "UPI" && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 space-y-3 animate-fadeIn">
                      <input
                        required
                        type="text"
                        placeholder="UPI ID (eg. 9876543210@ybl)"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                      <div className="flex gap-3">
                        <input
                          required
                          type="password"
                          placeholder="Enter OTP"
                          maxLength="6"
                          className="w-2/3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("OTP sent!");
                          }}
                          className="w-1/3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg text-sm"
                        >
                          Get OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "Net Banking" && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 space-y-3 animate-fadeIn">
                      <select
                        required
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600"
                      >
                        <option value="">-- Select Bank --</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                      </select>
                      <input
                        required
                        type="text"
                        placeholder="Account Number"
                        maxLength="16"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                      <div className="flex gap-3">
                        <input
                          required
                          type="text"
                          placeholder="Enter OTP"
                          maxLength="6"
                          className="w-2/3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            alert("OTP sent!");
                          }}
                          className="w-1/3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg text-sm"
                        >
                          Get OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "Cash on Delivery" && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center">
                      💵 Pay {formatPrice(total)} at delivery
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-xl font-semibold text-base mt-6 transition-colors shadow-lg"
              >
                Proceed to Checkout
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
