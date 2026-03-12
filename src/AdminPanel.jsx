import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 });
  const [chartData, setChartData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filtering and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!loading) {
      // Simulate Admin Auth Check
      if (!user || user.email !== "admin@intellikart.com") {
        alert("⚠️ Access Denied: Administrator privileges required.");
        navigate("/login");
      } else {
        loadOrders();
      }
    }
  }, [user, loading, navigate]);

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

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    // Sort by date (newest first)
    const sortedOrders = allOrders.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    setAllOrders(sortedOrders);

    // Calculate stats
    const total = allOrders.length;
    const revenue = sortedOrders.reduce((sum, order) => sum + order.total, 0);
    const pending = sortedOrders.filter(
      (o) => {
        const status = getOrderStatus(o);
        return status === "confirmed" ||
               status === "processing" ||
               status === "shipped" ||
               status === "out_for_delivery";
      }
    ).length;

    setStats({ total, revenue, pending });

    // Calculate chart data for the last 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const dailyRevenue = last7Days.map((day) => {
      const dayString = day.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const total = sortedOrders
        .filter(
          (order) =>
            new Date(order.date).toLocaleDateString("en-CA") === dayString,
        )
        .reduce((sum, order) => sum + order.total, 0);
      return {
        date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: total,
      };
    });
    setChartData(dailyRevenue);
    setLastUpdated(new Date());
  };

  const handleStatusChange = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    const updatedOrders = allOrders.map((order) => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    });

    localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
    loadOrders(); // Refresh state and stats
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm(`Are you sure you want to delete order #${orderId}?`)) {
      const updatedOrders = allOrders.filter((order) => order.id !== orderId);
      localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));
      loadOrders(); // Recalculate stats
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

  // Prevent rendering if unauthorized (prevents flashing of content)
  if (loading || !user || user.email !== "admin@intellikart.com") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Admin Dashboard
          </h1>
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Back to Store
          </Link>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Weekly Revenue
          </h3>
          <div className="h-64 flex items-end gap-2 sm:gap-4">
            {chartData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-indigo-200 rounded-t-lg hover:bg-indigo-400 transition-all"
                  style={{
                    height: `${
                      (day.revenue /
                        Math.max(...chartData.map((d) => d.revenue), 1)) *
                      100
                    }%`,
                  }}
                  title={`${day.date}: ${formatPrice(day.revenue)}`}
                ></div>
                <p className="text-xs text-gray-500 mt-2">{day.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <button
                onClick={loadOrders}
                className="text-gray-400 hover:text-indigo-600"
                title="Refresh Stats"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600">
              {formatPrice(stats.revenue)}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                All-time revenue
              </p>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Active Orders</p>
            <p className="text-3xl font-bold text-indigo-600">
              {stats.pending}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                Orders not delivered or cancelled
              </p>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">All Orders</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by ID or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((email) => (
                  <option key={email} value={email}>
                    {email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Actions</th>
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
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      {
                        order.paymentMethod === "Cash on Delivery" ? "COD" :
                        order.paymentMethod === "Credit/Debit Card" ? "Card" :
                        order.paymentMethod === "UPI" ? "UPI" :
                        order.paymentMethod === "Net Banking" ? "Net Banking" :
                        "Online"
                      }
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={getOrderStatus(order)}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer ${getStatusColor(
                          getOrderStatus(order),
                        )}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setViewOrder(order)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
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
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Customer Info</h3>
                    <p className="font-medium text-gray-900">{viewOrder.userEmail}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Order Date: {new Date(viewOrder.date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Shipping Address</h3>
                    {(() => {
                      const address = viewOrder.deliveryAddress || 
                        (JSON.parse(localStorage.getItem("mockAddresses")) || [])
                          .find(a => a.userEmail === viewOrder.userEmail)?.text;

                      if (!address) return <p className="text-sm text-gray-500">Address not available</p>;

                      const firstComma = address.indexOf(',');
                      return (
                        <div className="text-sm text-gray-900 leading-relaxed">
                          <p className="font-bold">{firstComma !== -1 ? address.substring(0, firstComma) : address}</p>
                          {firstComma !== -1 && <p>{address.substring(firstComma + 2)}</p>}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Payment & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Method</h3>
                    <p className="font-bold text-gray-900">{viewOrder.paymentMethod || "Cash on Delivery"}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Status</h3>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(getOrderStatus(viewOrder))}`}>
                      {(getOrderStatus(viewOrder) || "confirmed").toUpperCase().replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Order Items ({viewOrder.items.length})</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                          <th className="px-4 py-3 font-medium text-gray-600 text-center">Qty</th>
                          <th className="px-4 py-3 font-medium text-gray-600 text-right">Price</th>
                          <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                  <img src={item.src} alt={item.title} className="w-full h-full object-contain" />
                                </div>
                                <span className="font-medium text-gray-900 line-clamp-1 max-w-[200px]" title={item.title}>{item.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">{item.quantity || 1}</td>
                            <td className="px-4 py-3 text-right">{formatPrice(item.OriginalPrice)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatPrice((item.OriginalPrice) * (item.quantity || 1))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">Total Order Value</td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-600 text-lg">{formatPrice(viewOrder.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white sticky bottom-0">
                <Link to={`/track-order/${viewOrder.id}`} target="_blank" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors no-underline">
                  Track as Customer
                </Link>
                <button onClick={() => setViewOrder(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
