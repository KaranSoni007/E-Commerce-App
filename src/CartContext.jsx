import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useStock } from "./StockContext";

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { getStock } = useStock();
  // Determine current email based on AuthContext, defaulting to guest
  const userEmail = user?.email || "guest";

  const [cart, setCart] = useState(() => {
    // Try to initialize from storage based on potential auth state to avoid flash
    const email =
      localStorage.getItem("userEmail") ||
      sessionStorage.getItem("userEmail") ||
      "guest";
    const savedCart = localStorage.getItem(`cart_${email}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const isInitialized = useRef(false);
  const prevUserEmail = useRef(userEmail);

  // Load cart when user changes
  useEffect(() => {
    // If user hasn't changed (or initial mount), skip logic unless we want to force load
    if (prevUserEmail.current === userEmail) return;

    const prevEmail = prevUserEmail.current;
    prevUserEmail.current = userEmail;

    isInitialized.current = false; // Prevent saving during load
    const key = `cart_${userEmail}`;
    const savedCart = localStorage.getItem(key);
    let newCart = savedCart ? JSON.parse(savedCart) : [];

    // MERGE LOGIC: If switching from 'guest' to a user, merge guest cart into user cart
    if (prevEmail === "guest" && userEmail !== "guest" && cart.length > 0) {
      cart.forEach((guestItem) => {
        const existingItem = newCart.find(
          (item) => item.title === guestItem.title,
        );
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          newCart.push(guestItem);
        }
      });
      // Save merged cart immediately to avoid loss on refresh
      localStorage.setItem(key, JSON.stringify(newCart));
      // Optional: Clear guest cart
      localStorage.removeItem("cart_guest");
    }

    setCart(newCart);
  }, [userEmail, cart]); // Add cart to deps to capture guest state

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
    const availableStock = getStock(product.title);
    const existingItemInCart = cart.find((item) => item.title === product.title);
    const currentQuantityInCart = existingItemInCart
      ? existingItemInCart.quantity
      : 0;

    if (currentQuantityInCart + quantity > availableStock) {
      throw new Error(
        `Only ${availableStock} of "${product.title.substring(
          0,
          20,
        )}..." available.`,
      );
    }

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
    setCart((prevCart) => {
      const newCart = prevCart
        .map((item) => {
          if (item.title === title) {
            const newQuantity = (item.quantity || 1) + delta;
            const availableStock = getStock(title);

            // Cap quantity at available stock, and ensure it doesn't go below 1
            const finalQuantity = Math.min(
              Math.max(1, newQuantity),
              availableStock,
            );
            return { ...item, quantity: finalQuantity };
          }
          return item;
        });
      return newCart;
    });
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
