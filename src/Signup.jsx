import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "./AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(""); // 🔹 NEW: State for dynamic error messages
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Full Name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Confirm Password is required"),
      terms: Yup.boolean().oneOf(
        [true],
        "You must accept the terms and conditions",
      ),
    }),
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
            // Auto login after signup
            setTimeout(() => {
              login({ name: values.name, email: values.email });
              navigate("/");
            }, 1500);
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans p-5 transition-colors duration-200">
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
              {...formik.getFieldProps("name")}
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500 text-xs mt-1 pl-1">
                {formik.errors.name}
              </div>
            ) : null}
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
              {...formik.getFieldProps("email")}
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="text-red-500 text-xs mt-1 pl-1">
                {formik.errors.email}
              </div>
            ) : null}
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 pr-10"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                {...formik.getFieldProps("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.45 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password ? (
              <div className="text-red-500 text-xs mt-1 pl-1">
                {formik.errors.password}
              </div>
            ) : null}
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[15px] text-gray-900 transition-all duration-200 box-border placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 pr-10"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                {...formik.getFieldProps("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none p-1"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.45 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <div className="text-red-500 text-xs mt-1 pl-1">
                {formik.errors.confirmPassword}
              </div>
            ) : null}
          </div>

          <div className="mb-5">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="terms"
                checked={formik.values.terms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Terms and Conditions
                </a>
              </span>
            </label>
            {formik.touched.terms && formik.errors.terms ? (
              <div className="text-red-500 text-xs mt-1 pl-1">
                {formik.errors.terms}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl border-none bg-indigo-600 text-white font-semibold text-base cursor-pointer mt-2.5 transition-all duration-200 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
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
            <svg
              className="w-5 h-5 mr-2"
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
            </svg>{" "}
            Account created! Redirecting to login...
          </div>
        )}

        {/* 🔹 UPDATED: Now dynamically displays the professional error message */}
        {status === "error" && (
          <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center border border-red-300 text-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>{" "}
            {errorMessage}
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
