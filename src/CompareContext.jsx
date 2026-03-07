import React, { createContext, useState, useContext, useEffect } from "react";

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState(() => {
    const saved = localStorage.getItem("compareList");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("compareList", JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (product) => {
    if (compareList.length >= 4) {
      return {
        success: false,
        message: "You can compare up to 4 products only.",
      };
    }
    if (compareList.some((p) => p.title === product.title)) {
      return { success: false, message: "Product already in compare list." };
    }
    // Optional: Check category match to ensure apples-to-apples comparison
    if (
      compareList.length > 0 &&
      compareList[0].category !== product.category
    ) {
      return {
        success: false,
        message: `Compare only ${compareList[0].category} items together.`,
      };
    }

    setCompareList([...compareList, product]);
    return { success: true, message: "Added to comparison!" };
  };

  const removeFromCompare = (title) => {
    setCompareList((prev) => prev.filter((p) => p.title !== title));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (title) => {
    return compareList.some((p) => p.title === title);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};
