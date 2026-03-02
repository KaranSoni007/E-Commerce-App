import React, { createContext, useState, useContext, useEffect } from "react";

const WishlistContext = createContext();

export const useWishlist = () => {
  return useContext(WishlistContext);
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // Automatically saves to Local Storage whenever the wishlist state changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

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
