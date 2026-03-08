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
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-[15px] text-gray-900 dark:text-white transition-all duration-200 box-border placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-600/10"
              type="password"
              placeholder="••••••••"
              {...formik.getFieldProps("newPassword")}
            />
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
            <input
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-[15px] text-gray-900 dark:text-white transition-all duration-200 box-border placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-600/10"
              type="password"
              placeholder="••••••••"
              {...formik.getFieldProps("confirmPassword")}
            />
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
