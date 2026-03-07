import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <span className="text-6xl mb-4">😕</span>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">The page you are looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors no-underline"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;