import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  // Determine current email based on AuthContext, defaulting to guest
  const userEmail = user?.email || "guest";

  const [cart, setCart] = useState(() => {
    // Try to initialize from storage based on potential auth state to avoid flash
    const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "guest";
    const savedCart = localStorage.getItem(`cart_${email}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const isInitialized = useRef(false);

  // Load cart when user changes
  useEffect(() => {
    isInitialized.current = false; // Prevent saving during load
    const key = `cart_${userEmail}`;
    const savedCart = localStorage.getItem(key);
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }, [userEmail]);

  // Save cart when it changes, but only to the current user's key
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const key = `cart_${userEmail}`;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, userEmail]);

  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.title === product.title,
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.title === product.title
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prevCart, { ...product, quantity: quantity }];
    });
  };

  // 🔹 Remove item completely
  const removeFromCart = (title) => {
    setCart((prevCart) => prevCart.filter((item) => item.title !== title));
  };

  // 🔹 Increase or decrease quantity
  const updateQuantity = (title, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.title === title) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }),
    );
  };

  // 🔹 FIX: Added clearCart function so the checkout page can actually empty the cart
  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      // 🔹 FIX: Exported clearCart and setCart so Cart.jsx has access to them
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
