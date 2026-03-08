import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "./AuthContext";

function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      newPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("New Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
        .required("Confirm Password is required"),
    }),
    onSubmit: async (values) => {
      setStatus("loading");
      setErrorMessage("");

      try {
        await resetPassword(values.email, values.newPassword);

        // If the user is resetting the password for the remembered account, clear the stale password
        if (localStorage.getItem("rememberedEmail") === values.email) {
          localStorage.removeItem("rememberedPassword");
        }

        setStatus("success");
        setTimeout(() => navigate("/login"), 2000);
      } catch (error) {
        setErrorMessage(error.message);
        setStatus("error");
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 font-sans p-5 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] w-full max-w-105 border border-gray-100 dark:border-gray-700 relative transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
        <Link
          to="/login"
          className="inline-block mb-6 text-gray-500 dark:text-gray-400 text-sm no-underline font-semibold transition-colors duration-200 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            🔑
          </div>
          <h2 className="m-0 mb-2 text-gray-900 dark:text-white text-2xl font-extrabold">
            Reset Password
          </h2>
          <p className="m-0 text-gray-500 dark:text-gray-400 text-sm">
            Enter your email and a new password.
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="w-full">
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-[15px] text-gray-900 dark:text-white transition-all duration-200 box-border placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-600/10"
              type="email"
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
            <label className="block mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative">
              <input
                className="w-full py-3.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-[15px] text-gray-900 dark:text-white transition-all duration-200 box-border placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-600/10 pr-10"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                {...formik.getFieldProps("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none p-1"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
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
            {formik.touched.newPassword && formik.errors.newPassword ? (
              <div className="text-red-500 text-xs mt-1 pl-1">
                {formik.errors.newPassword}
              </div>
            ) : null}
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                className="w-full py-3.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-[15px] text-gray-900 dark:text-white transition-all duration-200 box-border placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-600/10 pr-10"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...formik.getFieldProps("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none p-1"
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

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl border-none bg-gray-900 dark:bg-indigo-600 text-white font-semibold text-base cursor-pointer my-2.5 transition-all duration-200 hover:bg-gray-700 dark:hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-indigo-600"
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Updating...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        {status === "success" && (
          <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
            <span className="mr-2">✨</span> Password updated! Redirecting...
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium flex items-center justify-center border border-red-300 dark:border-red-800 text-center">
            <span className="mr-2">⚠️</span> {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
