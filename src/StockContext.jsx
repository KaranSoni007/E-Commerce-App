import React, { createContext, useState, useContext, useEffect } from "react";
import AllProducts from "./Products";

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
  const [stock, setStock] = useState(() => {
    const savedStock = localStorage.getItem("productStock");
    if (savedStock) {
      try {
        return JSON.parse(savedStock);
      } catch (e) {
        console.error("Failed to parse stock from localStorage", e);
      }
    }
    // Initialize stock from products file if not in localStorage
    const initialStock = AllProducts.reduce((acc, product) => {
      acc[product.title] = product.stock !== undefined ? product.stock : 50; // Default to 50 if not specified
      return acc;
    }, {});
    localStorage.setItem("productStock", JSON.stringify(initialStock));
    return initialStock;
  });

  useEffect(() => {
    localStorage.setItem("productStock", JSON.stringify(stock));
  }, [stock]);

  const getStock = (productTitle) => {
    return stock[productTitle] !== undefined ? stock[productTitle] : 0;
  };

  const decrementStock = (cartItems) => {
    setStock((prevStock) => {
      const newStock = { ...prevStock };
      cartItems.forEach((item) => {
        if (newStock[item.title] !== undefined) {
          newStock[item.title] -= item.quantity || 1;
        }
      });
      return newStock;
    });
  };

  const value = { getStock, decrementStock };

  return (
    <StockContext.Provider value={value}>{children}</StockContext.Provider>
  );
};