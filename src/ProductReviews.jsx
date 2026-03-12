import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useReviews } from "./ReviewContext";
import { useAuth } from "./AuthContext";

function ProductReviews({ productTitle, product }) {
  const {
    reviews: allReviews,
    addReview,
    markHelpful,
    deleteReview,
    hasUserReviewed,
    getUserReview,
    editReview,
  } = useReviews();
  const { user } = useAuth();

  // Get reviews for this product directly from context - this ensures automatic updates
  const reviews = allReviews[productTitle] || [];

  // Calculate derived values using useMemo for performance
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  }, [reviews]);

  const reviewCount = reviews.length;

  const ratingBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
    });
    return breakdown;
  }, [reviews]);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState("all");
  const [canReview, setCanReview] = useState(false);

  // Get current user info
  const userName = user?.name || "Guest";
  const userEmail = user?.email || "guest@example.com";
  const isLoggedIn = !!user;

  // Review form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    review: "",
    pros: "",
    cons: "",
    recommend: true,
  });

  useEffect(() => {
    if (isLoggedIn) {
      const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
      const hasPurchasedAndReceived = allOrders.some(
        (order) =>
          order.userEmail === userEmail &&
          order.status === "delivered" &&
          order.items.some((item) => item.title === productTitle),
      );
      setCanReview(hasPurchasedAndReceived);
    } else {
      setCanReview(false);
    }
    // Re-check when user or product changes. allReviews is a proxy for when a review is added/deleted.
  }, [userEmail, productTitle, isLoggedIn, allReviews]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      rating: 5,
      title: "",
      review: "",
      pros: "",
      cons: "",
      recommend: true,
    });
    setEditingReview(null);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert("Please log in to write a review.");
      return;
    }

    if (!formData.title.trim() || !formData.review.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const reviewData = {
      userName,
      userEmail,
      ...formData,
    };

    if (editingReview) {
      editReview(productTitle, editingReview.id, formData);
      alert("Review updated successfully!");
    } else {
      addReview(productTitle, reviewData);
      alert("Review submitted successfully!");
    }

    resetForm();
    setShowReviewForm(false);
    // Reviews will automatically update via context - no manual refresh needed
  };

  const handleEdit = (review) => {
    setFormData({
      rating: review.rating,
      title: review.title,
      review: review.review,
      pros: review.pros || "",
      cons: review.cons || "",
      recommend: review.recommend !== false,
    });
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDelete = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReview(productTitle, reviewId);
      // Reviews will automatically update via context - no manual refresh needed
    }
  };

  const handleHelpful = (reviewId) => {
    markHelpful(productTitle, reviewId);
    // Reviews will automatically update via context - no manual refresh needed
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== "all") {
      filtered = filtered.filter((r) => r.rating === parseInt(filterRating));
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "highest":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case "helpful":
        filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStarPercentage = (rating) => {
    const count = ratingBreakdown[rating] || 0;
    return reviewCount > 0 ? (count / reviewCount) * 100 : 0;
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const userHasReviewed = hasUserReviewed(productTitle, userEmail);
  const userReview = getUserReview(productTitle, userEmail);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Reviews Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Customer Reviews
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-bold text-gray-900">
                {averageRating} out of 5
              </span>
              <span className="text-gray-500">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white text-gray-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>

            {/* Filter Dropdown */}
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white text-gray-900"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Write Review Button */}
            {isLoggedIn && canReview && !userHasReviewed && (
              <button
                onClick={() => {
                  resetForm();
                  setShowReviewForm(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Write a Review
              </button>
            )}

            {isLoggedIn && userHasReviewed && (
              <button
                onClick={() => handleEdit(userReview)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Edit Your Review
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Rating Breakdown - Left Column */}
        <div className="lg:col-span-1">
          <h4 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-8">
                  {rating} star
                </span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${getStarPercentage(rating)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {ratingBreakdown[rating] || 0}
                </span>
              </div>
            ))}
          </div>

          {/* Review Stats */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h5 className="font-semibold text-gray-900 mb-3">
              Review Statistics
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Reviews</span>
                <span className="font-medium text-gray-900">{reviewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Verified Purchases</span>
                <span className="font-medium text-gray-900">
                  {reviews.filter((r) => r.verified).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Would Recommend</span>
                <span className="font-medium text-gray-900">
                  {reviews.filter((r) => r.recommend).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List - Right Column */}
        <div className="lg:col-span-2">
          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 p-6 bg-indigo-50 rounded-xl animate-fadeIn">
              <h4 className="font-bold text-gray-900 mb-4">
                {editingReview ? "Edit Your Review" : "Write a Review"}
              </h4>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleInputChange("rating", star)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/50"
                      >
                        <svg
                          className={`w-6 h-6 ${star <= formData.rating ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Summarize your experience"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white text-gray-900"
                    required
                  />
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    value={formData.review}
                    onChange={(e) =>
                      handleInputChange("review", e.target.value)
                    }
                    placeholder="Tell us what you liked or disliked about this product"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 resize-none bg-white text-gray-900"
                    required
                  />
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pros (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.pros}
                      onChange={(e) =>
                        handleInputChange("pros", e.target.value)
                      }
                      placeholder="What did you like?"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cons (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.cons}
                      onChange={(e) =>
                        handleInputChange("cons", e.target.value)
                      }
                      placeholder="What could be better?"
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Recommend */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recommend}
                      onChange={(e) =>
                        handleInputChange("recommend", e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      I would recommend this product to a friend
                    </span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
                  >
                    {editingReview ? "Update Review" : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      resetForm();
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-5 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {review.userName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {review.userName}
                          </span>
                          {review.verified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <svg
                                className="w-3 h-3 inline-block mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>{" "}
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                        {review.editedAt && (
                          <span className="text-xs text-gray-400 ml-2">
                            (edited)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User Actions */}
                    {review.userEmail === userEmail && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(review)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {review.title}
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {review.review}
                  </p>

                  {/* Pros & Cons */}
                  {(review.pros || review.cons) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {review.pros && (
                        <div className="flex items-start gap-2">
                          <span className="text-green-500 font-bold mt-0.5">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-gray-700 block">
                              Pros
                            </span>
                            <span className="text-sm text-gray-600">
                              {review.pros}
                            </span>
                          </div>
                        </div>
                      )}
                      {review.cons && (
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 font-bold mt-0.5">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-gray-700 block">
                              Cons
                            </span>
                            <span className="text-sm text-gray-600">
                              {review.cons}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommend */}
                  {review.recommend !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                      {review.recommend ? (
                        <>
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                            />
                          </svg>
                          <span className="text-sm text-green-600 font-medium">
                            Would recommend
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                            />
                          </svg>
                          <span className="text-sm text-red-600 font-medium">
                            Would not recommend
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      Helpful ({review.helpful || 0})
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-gray-300">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  No reviews yet
                </h4>
                <p className="text-gray-500 mb-4">
                  Be the first to review this product!
                </p>
                {isLoggedIn && canReview && !userHasReviewed ? (
                  <button
                    onClick={() => {
                      resetForm();
                      setShowReviewForm(true);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Write a Review
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">
                    {!isLoggedIn
                      ? "Please log in to write a review."
                      : !canReview && !userHasReviewed
                        ? "You can review products you've purchased after they are delivered."
                        : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductReviews;
