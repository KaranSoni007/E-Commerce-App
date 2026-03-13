import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const ReviewContext = createContext();

export const useReviews = () => {
  return useContext(ReviewContext);
};

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState(() => {
    const savedReviews = localStorage.getItem("productReviews");
    return savedReviews ? JSON.parse(savedReviews) : {};
  });

  // Automatically saves to Local Storage whenever reviews state changes
  useEffect(() => {
    localStorage.setItem("productReviews", JSON.stringify(reviews));
  }, [reviews]);

  const getProductReviews = useCallback(
    (productTitle) => {
      return reviews[productTitle] || [];
    },
    [reviews],
  );

  const getAverageRating = useCallback(
    (productTitle) => {
      const productReviews = reviews[productTitle] || [];
      if (productReviews.length === 0) return 0;
      const totalRating = productReviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      return (totalRating / productReviews.length).toFixed(1);
    },
    [reviews],
  );

  const getReviewCount = useCallback(
    (productTitle) => {
      return (reviews[productTitle] || []).length;
    },
    [reviews],
  );

  const getRatingBreakdown = useCallback(
    (productTitle) => {
      const productReviews = reviews[productTitle] || [];
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      productReviews.forEach((review) => {
        breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
      });
      return breakdown;
    },
    [reviews],
  );

  const addReview = useCallback((productTitle, reviewData) => {
    setReviews((prevReviews) => {
      const productReviews = prevReviews[productTitle] || [];

      // 🔹 Check if the user has actually purchased this product
      const allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
      const hasPurchased = allOrders.some(
        (order) =>
          order.userEmail === reviewData.userEmail &&
          order.items.some((item) => item.title === productTitle),
      );

      const newReview = {
        id: Date.now(),
        ...reviewData,
        createdAt: new Date().toISOString(),
        helpful: 0,
        verified: hasPurchased,
      };
      return {
        ...prevReviews,
        [productTitle]: [newReview, ...productReviews],
      };
    });
  }, []);

  const markHelpful = useCallback((productTitle, reviewId) => {
    setReviews((prevReviews) => {
      const productReviews = prevReviews[productTitle] || [];
      const updatedReviews = productReviews.map((review) =>
        review.id === reviewId
          ? { ...review, helpful: (review.helpful || 0) + 1 }
          : review,
      );
      return {
        ...prevReviews,
        [productTitle]: updatedReviews,
      };
    });
  }, []);

  const deleteReview = useCallback((productTitle, reviewId) => {
    setReviews((prevReviews) => {
      const productReviews = prevReviews[productTitle] || [];
      const updatedReviews = productReviews.filter(
        (review) => review.id !== reviewId,
      );
      return {
        ...prevReviews,
        [productTitle]: updatedReviews,
      };
    });
  }, []);

  const hasUserReviewed = useCallback(
    (productTitle, userEmail) => {
      const productReviews = reviews[productTitle] || [];
      return productReviews.some((review) => review.userEmail === userEmail);
    },
    [reviews],
  );

  const getUserReview = useCallback(
    (productTitle, userEmail) => {
      const productReviews = reviews[productTitle] || [];
      return productReviews.find((review) => review.userEmail === userEmail);
    },
    [reviews],
  );

  const editReview = useCallback((productTitle, reviewId, updatedData) => {
    setReviews((prevReviews) => {
      const productReviews = prevReviews[productTitle] || [];
      const updatedReviews = productReviews.map((review) =>
        review.id === reviewId
          ? { ...review, ...updatedData, editedAt: new Date().toISOString() }
          : review,
      );
      return {
        ...prevReviews,
        [productTitle]: updatedReviews,
      };
    });
  }, []);

  const deleteAllUserReviews = useCallback((userEmail) => {
    setReviews((prevReviews) => {
      const newReviews = { ...prevReviews };
      Object.keys(newReviews).forEach((product) => {
        if (newReviews[product]) {
          newReviews[product] = newReviews[product].filter((r) => r.userEmail !== userEmail);
        }
      });
      return newReviews;
    });
  }, []);

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        setReviews,
        getProductReviews,
        getAverageRating,
        getReviewCount,
        getRatingBreakdown,
        addReview,
        markHelpful,
        deleteReview,
        hasUserReviewed,
        getUserReview,
        editReview,
        deleteAllUserReviews,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};
