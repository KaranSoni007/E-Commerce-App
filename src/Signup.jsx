import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";

function Signup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(""); // 🔹 NEW: State for dynamic error messages

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      setStatus("loading");
      setErrorMessage(""); // Reset error message on new submission

      // 🔹 MOCK BACKEND: Simulating a 1-second network request
      setTimeout(() => {
        try {
          // 1. Fetch existing users from local storage (our fake database)
          const existingUsers =
            JSON.parse(localStorage.getItem("mockUsers")) || [];

          // 2. Check if the email already exists
          const emailExists = existingUsers.some(
            (user) => user.email === values.email,
          );

          if (emailExists) {
            // 3. Reject signup with a professional message
            setErrorMessage(
              "An account with this email already exists. Please sign in instead.",
            );
            setStatus("error");
          } else {
            // 4. Save the new user to the fake database
            existingUsers.push(values);
            localStorage.setItem("mockUsers", JSON.stringify(existingUsers));

            setStatus("success");
            setTimeout(() => navigate("/login"), 1500);
          }
        } catch (error) {
          console.error("Mock DB Error:", error);
          setErrorMessage("An unexpected error occurred. Please try again.");
          setStatus("error");
        }
      }, 1000); // 1-second delay for realistic UX
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans p-5">
      <div className="bg-white p-12 px-10 rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] w-full max-w-105 border border-gray-100 relative transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
        <Link
          to="/"
          className="inline-block mb-6 text-gray-500 text-sm no-underline font-semibold transition-colors duration-200 hover:text-gray-900"
        >
          ← Back to Store
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            K
          </div>
          <h2 className="m-0 mb-2 text-gray-900 text-2xl font-extrabold">
            Create an Account
          </h2>
          <p className="m-0 text-gray-500 text-sm">
            Sign up to get started with your dashboard.
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="w-full">
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Full Name
            </label>
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formik.values.name}
              onChange={formik.handleChange}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Email Address
            </label>
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Password
            </label>
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formik.values.password}
              onChange={formik.handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl border-none bg-gray-900 text-white font-semibold text-base cursor-pointer mt-2.5 transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{" "}
                Processing...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {status === "success" && (
          <div className="mt-6 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium flex items-center justify-center border border-emerald-300">
            <span className="mr-2">✨</span> Account created! Redirecting to
            login...
          </div>
        )}

        {/* 🔹 UPDATED: Now dynamically displays the professional error message */}
        {status === "error" && (
          <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center border border-red-300 text-center">
            <span className="mr-2">⚠️</span> {errorMessage}
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold no-underline transition-colors hover:underline hover:text-indigo-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
