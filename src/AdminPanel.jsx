import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AllProducts, { services } from "./Products";
import { useStock } from "./StockContext";

function AdminPanel() {
  const { user, loading, logout } = useAuth();
  const { incrementStock, decrementStock, updateProductStock, removeProductStock, getStock } = useStock();
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 });
  const [chartData, setChartData] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(false);

  // Date Range State
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // Default to last 7 days
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  });

  // Filtering and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, products, orders
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Product Management State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");

  const ITEMS_PER_PAGE = 10;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const calculateStats = useCallback(
    (sortedOrders) => {
      const startStr = dateRange.startDate;
      const endStr = dateRange.endDate;

      const filteredOrders = sortedOrders.filter((order) => {
        const orderDateStr = order.date.split("T")[0];
        return orderDateStr >= startStr && orderDateStr <= endStr;
      });

    // Calculate stats
      const total = filteredOrders.length;
      const revenue = filteredOrders.reduce(
      (sum, order) => sum + (Number(order.total) || 0),
      0,
    );
      const pending = filteredOrders.filter((o) => {
      const status = getOrderStatus(o);
      return (
        status === "confirmed" ||
        status === "processing" ||
        status === "shipped" ||
        status === "out_for_delivery"
      );
    }).length;

    setStats({ total, revenue, pending });

      const start = new Date(startStr);
      const end = new Date(endStr);
      const days = [];
      let current = new Date(start);
      if (start <= end) {
        while (current <= end) {
          days.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      }

      const dailyData = days.map((day) => {
      const dayString = day.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
      const ordersForDay = sortedOrders.filter(
        (order) => order.date && order.date.split("T")[0] === dayString,
      );
      const accepted = ordersForDay
        .filter((o) => getOrderStatus(o) === "delivered")
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
      const rejected = ordersForDay
        .filter((o) => ["cancelled", "returned"].includes(getOrderStatus(o)))
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      return {
        date: day.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC", // Ensure label matches UTC date
        }),
        accepted,
        rejected,
      };
    });
    setChartData(dailyData);
    setLastUpdated(new Date());
    setAnimateCharts(false);
    setTimeout(() => setAnimateCharts(true), 100);
    },
    [dateRange],
  );

  const loadData = useCallback(() => {
    // Load Orders
    let orders = JSON.parse(localStorage.getItem("mockOrders")) || [];

    // Initialize with sample orders if empty so the dashboard isn't blank
    if (orders.length === 0) {
      const today = new Date();
      orders = Array.from({ length: 15 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

        // Create realistic items and total
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let orderTotal = 0;
        for (let j = 0; j < itemCount; j++) {
          const product =
            AllProducts[Math.floor(Math.random() * AllProducts.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          orderItems.push({ ...product, quantity });
          orderTotal += product.OriginalPrice * quantity;
        }

        return {
          id: 1001 + i,
          userEmail: `demo_user${i}@example.com`,
          date: date.toISOString(),
          total: orderTotal,
          status: ["confirmed", "processing", "shipped", "delivered"][
            Math.floor(Math.random() * 4)
          ],
          paymentMethod: "Credit Card",
          items: orderItems,
        };
      });
      localStorage.setItem("mockOrders", JSON.stringify(orders));
    }

    const sortedOrders = orders.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    setAllOrders(sortedOrders);
    calculateStats(sortedOrders);

    // Load Products
    const storedProducts = JSON.parse(localStorage.getItem("allProducts"));
    if (storedProducts) {
      setProducts(storedProducts);
    } else {
      // Initialize with default products if empty
      const initialProducts = [...AllProducts, ...services];
      setProducts(initialProducts);
      localStorage.setItem("allProducts", JSON.stringify(initialProducts));

      // Initialize stock
      const initialStock = initialProducts.reduce((acc, p) => {
        acc[p.title] = p.stock || 50;
        return acc;
      }, {});
      localStorage.setItem("productStock", JSON.stringify(initialStock));
    }
  }, [calculateStats]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      // Simulate Admin Auth Check
      if (user.email !== "admin@intellikart.com") {
        navigate("/login", { replace: true });
      } else {
        loadData();
      }
    }
  }, [user, loading, navigate, loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate network delay for better UX
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
    }, 800);
  };

  const getOrderStatus = (order) => {
    if (order.status) return order.status;

    const orderTime = new Date(order.date).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - orderTime) / (1000 * 60 * 60);

    if (hoursDiff < 1) return "confirmed";
    if (hoursDiff < 4) return "processing";
    if (hoursDiff < 24) return "shipped";
    if (hoursDiff < 72) return "out_for_delivery";
    return "delivered";
  };

  const handleStatusChange = (orderId, newStatus) => {
    const currentOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    const orderToUpdate = currentOrders.find((order) => order.id === orderId);

    if (!orderToUpdate) return;

    const oldStatus = getOrderStatus(orderToUpdate);

    const updatedOrders = currentOrders.map((order) => {
      if (order.id === orderId) {
        const updates = { status: newStatus };
        if (newStatus === "cancelled") {
          updates.cancelledAt = new Date().toISOString();
        }
        if (newStatus === "returned") {
          updates.returnedAt = new Date().toISOString();
        }
        return { ...order, ...updates };
      }
      return order;
    });

    // If status changes to cancelled or returned, replenish stock
    if (
      (newStatus === "cancelled" || newStatus === "returned") &&
      oldStatus !== "cancelled" &&
      oldStatus !== "returned"
    ) {
      incrementStock(orderToUpdate.items);
    }

    // If status changes FROM cancelled/returned TO active, decrement stock (re-reserve items)
    if (
      (oldStatus === "cancelled" || oldStatus === "returned") &&
      (newStatus !== "cancelled" && newStatus !== "returned")
    ) {
      decrementStock(orderToUpdate.items);
    }

    localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
    loadData(); // Refresh state and stats
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm(`Are you sure you want to delete order #${orderId}?`)) {
      const orderToDelete = allOrders.find((order) => order.id === orderId);
      const status = getOrderStatus(orderToDelete);

      // Replenish stock if the order was not fulfilled
      if (
        orderToDelete &&
        orderToDelete.items &&
        !["delivered", "returned", "cancelled", "exchanged"].includes(status)
      ) {
        incrementStock(orderToDelete.items);
      }

      const updatedOrders = allOrders.filter((order) => order.id !== orderId);
      localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
      loadData(); // Recalculate stats
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "return_requested", label: "Return Requested" },
    { value: "returned", label: "Returned" },
    { value: "exchange_requested", label: "Exchange Requested" },
    { value: "exchanged", label: "Exchanged" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "return_requested":
        return "bg-orange-100 text-orange-800";
      case "returned":
        return "bg-gray-200 text-gray-800";
      case "exchange_requested":
        return "bg-blue-50 text-blue-700";
      case "exchanged":
        return "bg-indigo-50 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const uniqueUsers = useMemo(() => {
    return [...new Set(allOrders.map((order) => order.userEmail))];
  }, [allOrders]);

  const maxRevenue = useMemo(() => {
    if (!chartData.length) return 1;
    const maxVal = Math.max(...chartData.map((d) => d.accepted + d.rejected));
    return maxVal > 0 ? maxVal : 1;
  }, [chartData]);

  // Memoized filtering and pagination logic
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || getOrderStatus(order) === statusFilter;
      const matchesUser =
        userFilter === "all" || order.userEmail === userFilter;
      const matchesSearch =
        !searchTerm ||
        order.id.toString().includes(searchTerm) ||
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch && matchesUser;
    });
  }, [allOrders, statusFilter, searchTerm, userFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, userFilter]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Prevent rendering if unauthorized (prevents flashing of content)
  if (loading || !user || user.email !== "admin@intellikart.com") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Product Actions
  const handleEditProduct = (product) => {
    // Get the latest live stock from StockContext instead of the stale product list
    const currentLiveStock = getStock(product.title);
    
    setEditingProduct(product);
    // Override the stale stock with the live stock value
    setProductForm({ ...product, stock: currentLiveStock });
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: "",
      category: "",
      OriginalPrice: "",
      MRP: "",
      description: "",
      src: "",
      stock: 50,
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const productToDelete = products.find((p) => p.id === productId);
      const updatedProducts = products.filter((p) => p.id !== productId);
      setProducts(updatedProducts);
      localStorage.setItem("allProducts", JSON.stringify(updatedProducts));

      // Cleanup Stock via Context
      removeProductStock(productToDelete.title);
    }
  };

  const saveProduct = (e) => {
    e.preventDefault();
    let updatedProducts;

    // Ensure numeric values
    const productToSave = {
      ...productForm,
      OriginalPrice: Number(productForm.OriginalPrice),
      MRP: Number(productForm.MRP),
      stock: Number(productForm.stock || 50),
    };

    if (isNaN(productToSave.OriginalPrice) || isNaN(productToSave.MRP) || isNaN(productToSave.stock)) {
      alert("Please enter valid numbers for Price, MRP and Stock.");
      return;
    }

    if (editingProduct) {
      updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...productToSave } : p,
      );
    } else {
      const newId =
        products.length > 0
          ? Math.max(...products.map((p) => Number(p.id) || 0)) + 1
          : 1;
      updatedProducts = [{ id: newId, ...productToSave }, ...products];
    }

    setProducts(updatedProducts);
    localStorage.setItem("allProducts", JSON.stringify(updatedProducts));

    // Update StockContext state directly
    if (editingProduct && editingProduct.title !== productToSave.title) {
      removeProductStock(editingProduct.title);
    }
    updateProductStock(productToSave.title, productToSave.stock);

    setShowProductModal(false);
    alert(editingProduct ? "Product updated!" : "Product added!");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm((prev) => ({ ...prev, src: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title
      .toLowerCase()
      .includes(productSearch.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || p.category === categoryFilter;

    const stock = getStock(p.title);
    let matchesStock = true;
    if (stockFilter === "in") matchesStock = stock > 0;
    else if (stockFilter === "low") matchesStock = stock <= 10;
    else if (stockFilter === "out") matchesStock = stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="h-screen bg-gray-100 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white w-64 shrink-0 transition-all duration-300 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64 absolute h-full z-20"
        } md:relative md:translate-x-0`}
      >
        <div className="h-16 flex items-center px-6 bg-gray-800 border-b border-gray-700 shrink-0">
          <span className="text-xl font-bold tracking-wider">
            IntelliKart<span className="text-indigo-400">Admin</span>
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => handleNavClick("dashboard")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white border-r-4 border-indigo-300"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Dashboard
          </button>
          <button
            onClick={() => handleNavClick("products")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "products"
                ? "bg-indigo-600 text-white border-r-4 border-indigo-300"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Products
          </button>
          <button
            onClick={() => handleNavClick("orders")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "orders"
                ? "bg-indigo-600 text-white border-r-4 border-indigo-300"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Orders
          </button>
        </nav>
        <div className="p-4 bg-gray-900 border-t border-gray-800 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors w-full text-left"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center w-1/3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-500 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "products" && "Product Management"}
              {activeTab === "orders" && "Order Management"}
            </h2>
          </div>
          <div className="flex items-center justify-end gap-4 w-1/3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                A
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Admin User
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="animate-fadeIn">
              {/* Date Filter */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-700 font-semibold text-sm">
                    Date Range:
                  </span>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
                  <span className="text-gray-400 font-medium">-</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500 font-medium uppercase">
                      Total Orders
                    </p>
                    <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
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
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <div className="mt-auto pt-4 flex items-center text-sm text-green-600">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span className="font-medium">12% increase</span>
                    <span className="text-gray-400 ml-2">from last month</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500 font-medium uppercase">
                      Total Revenue
                    </p>
                    <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatPrice(stats.revenue)}
                  </p>
                  <div className="mt-auto pt-4 flex items-center text-sm text-green-600">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span className="font-medium">8% increase</span>
                    <span className="text-gray-400 ml-2">from last month</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500 font-medium uppercase">
                      Pending Orders
                    </p>
                    <span className="p-2 bg-amber-50 rounded-lg text-amber-600">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                  <div className="mt-auto pt-4 flex items-center text-sm text-gray-500">
                    <span className="font-medium text-amber-600">
                      {
                        allOrders.filter(
                          (o) => getOrderStatus(o) === "processing",
                        ).length
                      }{" "}
                      Processing
                    </span>
                    <span className="mx-2">•</span>
                    <span>Action required</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Weekly Revenue Breakdown
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                      <span>Accepted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-red-400"></div>
                      <span>Lost</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 relative ml-10">
                  {tooltip && (
                    <div
                      className="absolute bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs z-10 pointer-events-none transition-opacity"
                      style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        opacity: tooltip.visible ? 1 : 0,
                      }}
                    >
                      <p className="font-bold mb-1">{tooltip.date}</p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Accepted: {formatPrice(tooltip.accepted)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        Lost: {formatPrice(tooltip.rejected)}
                      </p>
                    </div>
                  )}
                  <svg width="100%" height="100%" className="overflow-visible">
                    <g className="grid-lines">
                      {[0.25, 0.5, 0.75, 1].map((p) => (
                        <line
                          key={p}
                          x1="0"
                          x2="100%"
                          y1={`${(1 - p) * 100}%`}
                          y2={`${(1 - p) * 100}%`}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="2,3"
                        />
                      ))}
                    </g>
                    <g className="y-axis-labels" textAnchor="end">
                      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                        <text
                          key={p}
                          x="-8"
                          y={`${(1 - p) * 100}%`}
                          dy="0.32em"
                          className="text-xs fill-gray-500"
                        >
                          {formatPrice(maxRevenue * p).replace("₹", "")}
                        </text>
                      ))}
                    </g>
                    <g className="bars">
                      {chartData.map((day, index) => {
                        const targetAcceptedHeight =
                          (day.accepted / maxRevenue) * 100;
                        const targetRejectedHeight =
                          (day.rejected / maxRevenue) * 100;

                        const acceptedHeight = animateCharts ? targetAcceptedHeight : 0;
                        const rejectedHeight = animateCharts ? targetRejectedHeight : 0;

                        const x = `${(index / chartData.length) * 100 + (1 / chartData.length) * 15}%`;
                        const barWidth = `${(1 / chartData.length) * 70}%`;

                        return (
                          <g
                            key={index}
                            onMouseMove={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                ...day,
                                visible: true,
                                x: e.clientX - rect.left + 20,
                                y: e.clientY - rect.top - 70,
                              });
                            }}
                            onMouseLeave={() =>
                              setTooltip((t) => t && { ...t, visible: false })
                            }
                          >
                            <rect
                              x={x}
                              y={`${100 - acceptedHeight - rejectedHeight}%`}
                              width={barWidth}
                              height={`${rejectedHeight}%`}
                              fill="#f87171"
                              className="transition-all duration-700 ease-out"
                              rx="4"
                              ry="4"
                            />
                            <rect
                              x={x}
                              y={`${100 - acceptedHeight}%`}
                              width={barWidth}
                              height={`${acceptedHeight}%`}
                              fill="#34d399"
                              className="transition-all duration-700 ease-out"
                              rx="4"
                              ry="4"
                            />
                            <text
                              x={`calc(${x} + ${barWidth} / 2)`}
                              y="100%"
                              dy="1.2em"
                              textAnchor="middle"
                              className="text-xs fill-gray-500"
                            >
                              {day.date}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="animate-fadeIn space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative max-w-md w-full">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-[140px]"
                  >
                    <option value="all">All Stock Status</option>
                    <option value="in">In Stock</option>
                    <option value="low">Low Stock (≤10)</option>
                    <option value="out">Out of Stock</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-[140px]"
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Product
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-gray-700">
                          Product
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Category
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Price
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Stock
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-gray-100 p-1 shrink-0">
                                <img
                                  src={product.src}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/40?text=No+Image";
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1 max-w-xs">
                                  {product.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {product.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 font-medium text-center">
                            {formatPrice(product.OriginalPrice)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                getStock(product.title) > 10
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {getStock(product.title)} in stock
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          {activeTab === "orders" && (
            <div className="animate-fadeIn space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative max-w-md w-full">
                  <input
                    type="text"
                    placeholder="Search by ID or Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="all">All Users</option>
                    {uniqueUsers.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors ${isRefreshing ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <svg
                      className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-gray-700">
                          Order ID
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700">
                          Customer
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Date
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Total
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Payment
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Status
                        </th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {order.userEmail}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-center">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 text-center">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">
                            {order.paymentMethod === "Cash on Delivery"
                              ? "COD"
                              : order.paymentMethod === "Credit/Debit Card"
                                ? "Card"
                                : order.paymentMethod === "UPI"
                                  ? "UPI"
                                  : order.paymentMethod === "Net Banking"
                                    ? "Net Banking"
                                    : "Online"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                                getOrderStatus(order),
                              )}`}
                            >
                              {(getOrderStatus(order) || "confirmed")
                                .toUpperCase()
                                .replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {getOrderStatus(order) === "confirmed" ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order.id, "processing")
                                    }
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Approve Order"
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
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order.id, "cancelled")
                                    }
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Reject Order"
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
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <select
                                  value={getOrderStatus(order)}
                                  onChange={(e) =>
                                    handleStatusChange(order.id, e.target.value)
                                  }
                                  className={`w-36 px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer ${getStatusColor(
                                    getOrderStatus(order),
                                  )}`}
                                >
                                  {statusOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <button
                                onClick={() => setViewOrder(order)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Record"
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
                          </td>
                        </tr>
                      ))}
                      {paginatedOrders.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            No orders match your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          {viewOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-bold text-gray-900">
                    Order Details #{viewOrder.id}
                  </h2>
                  <button
                    onClick={() => setViewOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6 text-gray-500"
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
                </div>
                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">
                        Customer Info
                      </h3>
                      <p className="font-medium text-gray-900">
                        {viewOrder.userEmail}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Order Date: {new Date(viewOrder.date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">
                        Shipping Address
                      </h3>
                      {(() => {
                        const address =
                          viewOrder.deliveryAddress ||
                          (
                            JSON.parse(localStorage.getItem("mockAddresses")) ||
                            []
                          ).find((a) => a.userEmail === viewOrder.userEmail)
                            ?.text;

                        if (!address)
                          return (
                            <p className="text-sm text-gray-500">
                              Address not available
                            </p>
                          );

                        const firstComma = address.indexOf(",");
                        return (
                          <div className="text-sm text-gray-900 leading-relaxed">
                            <p className="font-bold">
                              {firstComma !== -1
                                ? address.substring(0, firstComma)
                                : address}
                            </p>
                            {firstComma !== -1 && (
                              <p>{address.substring(firstComma + 2)}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Payment & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Payment Method
                      </h3>
                      <p className="font-bold text-gray-900">
                        {viewOrder.paymentMethod || "Cash on Delivery"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Current Status
                      </h3>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(getOrderStatus(viewOrder))}`}
                      >
                        {(getOrderStatus(viewOrder) || "confirmed")
                          .toUpperCase()
                          .replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                      Order Items ({viewOrder.items.length})
                    </h3>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-medium text-gray-600">
                              Product
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-center">
                              Qty
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-right">
                              Price
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-600 text-right">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {viewOrder.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                    <img
                                      src={item.src}
                                      alt={item.title}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src =
                                          "https://via.placeholder.com/40?text=No+Image";
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="font-medium text-gray-900 line-clamp-1 max-w-50"
                                    title={item.title}
                                  >
                                    {item.title}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.quantity || 1}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatPrice(item.OriginalPrice)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(
                                  item.OriginalPrice * (item.quantity || 1),
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td
                              colSpan="3"
                              className="px-4 py-3 text-right font-bold text-gray-900"
                            >
                              Total Order Value
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600 text-lg">
                              {formatPrice(viewOrder.total)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white sticky bottom-0">
                  <Link
                    to={`/track-order/${viewOrder.id}`}
                    target="_blank"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors no-underline"
                  >
                    Track as Customer
                  </Link>
                  <button
                    onClick={() => setViewOrder(null)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Add/Edit Modal */}
          {showProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={saveProduct}
                  className="p-6 space-y-4 overflow-y-auto"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Title
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        value={productForm.title}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            category: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Category</option>
                        <option value="TVs">TVs</option>
                        <option value="Smartphones">Smartphones</option>
                        <option value="Laptops">Laptops</option>
                        <option value="Audio">Audio</option>
                        <option value="Wearables">Wearables</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        value={productForm.stock}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            stock: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (Original)
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        value={productForm.OriginalPrice}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            OriginalPrice: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MRP
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        value={productForm.MRP}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            MRP: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Image
                      </label>
                      
                      {productForm.src && (
                        <div className="mb-3 h-40 flex justify-center bg-gray-50 rounded-lg p-2 border border-dashed border-gray-300">
                          <img 
                            src={productForm.src} 
                            alt="Preview" 
                            className="h-full object-contain"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <div className="flex-1">
                           <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={productForm.src}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                src: e.target.value,
                              })
                            }
                            placeholder="Enter Image URL"
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer h-full"
                          >
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            Upload
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Use a URL or upload an image (max 500KB recommended).</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Save Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
