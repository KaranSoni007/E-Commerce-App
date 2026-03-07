import React from "react";
import { Link } from "react-router-dom";
import { useCompare } from "./CompareContext";
import { useCart } from "./CartContext";

function Compare() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareList.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
        <span className="text-6xl mb-4">⚖️</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No items to compare
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Add items from the product list to compare them side-by-side.
        </p>
        <Link
          to="/"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors no-underline"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get all unique specification keys from all products in the compare list
  const allSpecKeys = React.useMemo(() => {
    const keys = new Set();
    compareList.forEach((product) => {
      if (product.specifications) {
        Object.keys(product.specifications).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [compareList]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Compare Products
          </h1>
          <button
            onClick={clearCompare}
            className="text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-hidden table-fixed min-w-[800px]">
            <thead>
              <tr>
                <th className="p-4 text-left w-40 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                  Features
                </th>
                {compareList.map((product) => (
                  <th
                    key={product.title}
                    className="p-4 w-64 border-b border-gray-200 dark:border-gray-700 align-top relative"
                  >
                    <button
                      onClick={() => removeFromCompare(product.title)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                    >
                      ✕
                    </button>
                    <div className="h-40 flex items-center justify-center mb-4">
                      <img
                        src={product.src}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 min-h-[40px]">
                      {product.title}
                    </h3>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {formatPrice(product.OriginalPrice)}
                    </div>
                  </th>
                ))}
                {/* Fill empty columns if less than 4 items */}
                {[...Array(4 - compareList.length)].map((_, i) => (
                  <th
                    key={i}
                    className="p-4 w-64 border-b border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30"
                  ></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <tr>
                <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Category
                </td>
                {compareList.map((product) => (
                  <td
                    key={product.title}
                    className="p-4 text-center text-sm text-gray-700 dark:text-gray-200"
                  >
                    {product.category}
                  </td>
                ))}
                {[...Array(4 - compareList.length)].map((_, i) => (
                  <td key={i}></td>
                ))}
              </tr>
              <tr>
                {[...Array(4 - compareList.length)].map((_, i) => (
                  <td key={i}></td>
                ))}
              </tr>
              {/* Key Features */}
              <tr>
                <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 align-top">
                  Key Features
                </td>
                {compareList.map((product) => (
                  <td
                    key={product.title}
                    className="p-4 text-sm text-gray-700 dark:text-gray-200 align-top"
                  >
                    <ul className="list-disc pl-4 space-y-1 text-left">
                      {product.features?.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      )) || "-"}
                    </ul>
                  </td>
                ))}
                {[...Array(4 - compareList.length)].map((_, i) => (
                  <td key={i}></td>
                ))}
              </tr>
              {/* Specifications */}
              {allSpecKeys.map((key) => {
                const values = compareList.map(
                  (product) => product.specifications?.[key]
                );
                const hasDifferences =
                  compareList.length > 1 && new Set(values).size > 1;

                return (
                  <tr
                    key={key}
                    className={
                      hasDifferences ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                    }
                  >
                    <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                      {key}
                    </td>
                    {compareList.map((product) => (
                      <td
                        key={product.title}
                        className={`p-4 text-center text-sm text-gray-700 dark:text-gray-200 ${
                          hasDifferences
                            ? "font-medium text-gray-900 dark:text-white"
                            : ""
                        }`}
                      >
                        {product.specifications?.[key] || "-"}
                      </td>
                    ))}
                    {[...Array(4 - compareList.length)].map((_, i) => (
                      <td key={i}></td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Availability
                </td>
                {compareList.map((product) => (
                  <td key={product.title} className="p-4 text-center text-sm">
                    <span className="text-green-600 font-medium">In Stock</span>
                  </td>
                ))}
                {[...Array(4 - compareList.length)].map((_, i) => (
                  <td key={i}></td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Action
                </td>
                {compareList.map((product) => (
                  <td key={product.title} className="p-4 text-center">
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  </td>
                ))}
                {[...Array(4 - compareList.length)].map((_, i) => (
                  <td key={i}></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Compare;
