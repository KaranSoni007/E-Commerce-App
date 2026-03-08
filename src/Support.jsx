import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Support() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("faq");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  const renderContent = () => {
    switch (activeTab) {
      case "shipping":
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shipping Information
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We offer free shipping on all orders above ₹500. Orders are
              typically processed within 1-2 business days.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              Delivery Timelines
            </h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Metro Cities: 2-3 business days</li>
              <li>Tier 2 Cities: 3-5 business days</li>
              <li>Rest of India: 5-7 business days</li>
            </ul>
          </div>
        );
      case "returns":
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Returns & Exchanges
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We have a hassle-free 30-day return policy. If you are not
              satisfied with your purchase, you can return it for a full refund
              or exchange.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
              How to Return
            </h3>
            <ol className="list-decimal pl-5 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Go to My Account &gt; Orders</li>
              <li>Select the order and click "Return"</li>
              <li>Schedule a pickup time</li>
              <li>Refund will be processed within 5-7 days of pickup</li>
            </ol>
          </div>
        );
      case "faq":
      default:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  How do I track my order?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You can track your order from the 'My Profile' section under
                  'Recent Orders'.
                </p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What payment methods do you accept?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  We accept Credit/Debit cards, UPI, Net Banking, and Cash on
                  Delivery.
                </p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Is my personal information safe?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes, we use industry-standard encryption to protect your data.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-6 font-sans transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
          Customer Support
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setActiveTab("shipping")}
                className={`w-full text-left px-6 py-4 font-medium transition-colors cursor-pointer ${activeTab === "shipping" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                Shipping Info
              </button>
              <button
                onClick={() => setActiveTab("returns")}
                className={`w-full text-left px-6 py-4 font-medium transition-colors cursor-pointer ${activeTab === "returns" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                Returns & Exchanges
              </button>
              <button
                onClick={() => setActiveTab("faq")}
                className={`w-full text-left px-6 py-4 font-medium transition-colors cursor-pointer ${activeTab === "faq" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                FAQ
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            {renderContent()}
          </div>
        </div>
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Support;
