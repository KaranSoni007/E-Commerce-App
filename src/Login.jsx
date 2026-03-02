import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";

function Login() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(""); // 🔹 NEW: State for dynamic error messages

  // 🔹 INITIALIZE FORMIK
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      setStatus("loading");
      setErrorMessage(""); // Reset error message on new submission

      // 🔹 MOCK BACKEND: Simulating a 1-second network request
      setTimeout(() => {
        try {
          // 1. Fetch our fake database created in Signup.jsx
          const existingUsers =
            JSON.parse(localStorage.getItem("mockUsers")) || [];

          // 2. Look for the user by email
          const user = existingUsers.find((u) => u.email === values.email);

          if (!user) {
            // 3. Professional message if the email isn't registered
            setErrorMessage(
              "We cannot find an account with that email address. Please sign up.",
            );
            setStatus("error");
          } else if (user.password !== values.password) {
            // 4. Professional message if the password doesn't match
            setErrorMessage(
              "The password you entered is incorrect. Please try again.",
            );
            setStatus("error");
          } else {
            // 5. Success! Issue fake tokens so the Navbar works perfectly
            localStorage.setItem("token", "mock-jwt-token-12345");
            localStorage.setItem("userName", user.name);
            localStorage.setItem("userId", "mock-user-id");
            localStorage.setItem("userEmail", user.email);
            window.dispatchEvent(new Event("userUpdated")); // 🔹 Update Navbar on login

            setStatus("success");
            setTimeout(() => navigate("/"), 1000);
          }
        } catch (error) {
          console.error("Mock Login Error:", error);
          setErrorMessage("An unexpected error occurred. Please try again.");
          setStatus("error");
        }
      }, 1000); // 1-second delay for realistic UX
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans p-5">
      <div className="bg-white p-10 rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] w-full max-w-105 border border-gray-100 relative transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
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
            Welcome Back
          </h2>
          <p className="m-0 text-gray-500 text-sm">
            Please enter your details to sign in.
          </p>
        </div>

        {/* 🔹 FORMIK HANDLES THE SUBMIT */}
        <form onSubmit={formik.handleSubmit} className="w-full">
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Email
            </label>
            {/* 🔹 EXPLICIT FORMIK BINDINGS */}
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
              type="email"
              placeholder="name@example.com"
              {...formik.getFieldProps("email")}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Password
            </label>
            {/* 🔹 EXPLICIT FORMIK BINDINGS */}
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10"
              type="password"
              placeholder="••••••••"
              {...formik.getFieldProps("password")}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl border-none bg-gray-900 text-white font-semibold text-base cursor-pointer my-2.5 transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Logging in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* 🔹 UPDATED: Now dynamically displays the professional error messages */}
        {status === "error" && (
          <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center border border-red-300 text-center">
            <span className="mr-2">⚠️</span> {errorMessage}
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500 text-center">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 font-semibold no-underline transition-colors hover:underline hover:text-indigo-800"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
