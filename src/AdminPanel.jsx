import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    // Sort by date (newest first)
    const sortedOrders = allOrders.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setOrders(sortedOrders);

    // Calculate stats
    const total = sortedOrders.length;
    const revenue = sortedOrders.reduce((sum, order) => sum + order.total, 0);
    const pending = sortedOrders.filter(
      (o) =>
        !o.status ||
        o.status === "confirmed" ||
        o.status === "processing" ||
        o.status === "shipped"
    ).length;

    setStats({ total, revenue, pending });
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
    if (window.confirm("Are you sure you want to delete this order?")) {
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      setOrders(updatedOrders);
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
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "out_for_delivery": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "return_requested": return "bg-orange-100 text-orange-800";
      case "returned": return "bg-gray-200 text-gray-800";
      case "exchange_requested": return "bg-blue-50 text-blue-700";
      case "exchanged": return "bg-indigo-50 text-indigo-700";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600">
              {formatPrice(stats.revenue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Active Orders</p>
            <p className="text-3xl font-bold text-indigo-600">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-6 py-4">
                      <select
                        value={order.status || "confirmed"}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer ${getStatusColor(
                          order.status || "confirmed"
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
                        <Link
                          to={`/track-order/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
