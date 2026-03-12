import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const useWishlist = () => {
  return useContext(WishlistContext);
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";

  const [wishlist, setWishlist] = useState(() => {
    const email =
      localStorage.getItem("userEmail") ||
      sessionStorage.getItem("userEmail") ||
      "guest";
    const savedWishlist = localStorage.getItem(`wishlist_${email}`);
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const isInitialized = useRef(false);
  const prevUserEmail = useRef(userEmail);

  // Load wishlist when user changes
  useEffect(() => {
    if (prevUserEmail.current === userEmail) return;

    const prevEmail = prevUserEmail.current;
    prevUserEmail.current = userEmail;

    isInitialized.current = false;
    const key = `wishlist_${userEmail}`;
    const savedWishlist = localStorage.getItem(key);
    let newWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    // MERGE LOGIC: Guest -> User
    if (prevEmail === "guest" && userEmail !== "guest" && wishlist.length > 0) {
      wishlist.forEach((guestItem) => {
        if (!newWishlist.some((item) => item.title === guestItem.title)) {
          newWishlist.push(guestItem);
        }
      });
      localStorage.setItem(key, JSON.stringify(newWishlist));
      localStorage.removeItem("wishlist_guest");
    }

    setWishlist(newWishlist);
  }, [userEmail, wishlist]);

  // Save wishlist when it changes
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const key = `wishlist_${userEmail}`;
    localStorage.setItem(key, JSON.stringify(wishlist));
  }, [wishlist, userEmail]);

  const addToWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const existingItem = prevWishlist.find(
        (item) => item.title === product.title,
      );
      if (existingItem) {
        return prevWishlist; // Already in wishlist
      }
      return [
        ...prevWishlist,
        { ...product, addedAt: new Date().toISOString() },
      ];
    });
  };

  const removeFromWishlist = (title) => {
    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => item.title !== title),
    );
  };

  const isInWishlist = (title) => {
    return wishlist.some((item) => item.title === title);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.title)) {
      removeFromWishlist(product.title);
      return false; // Removed
    } else {
      addToWishlist(product);
      return true; // Added
    }
  };

  const moveToCart = (product, addToCartFunc) => {
    removeFromWishlist(product.title);
    addToCartFunc(product);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        setWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        moveToCart,
        clearWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
