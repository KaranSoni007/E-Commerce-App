import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";

  const [compareList, setCompareList] = useState(() => {
    const email =
      localStorage.getItem("userEmail") ||
      sessionStorage.getItem("userEmail") ||
      "guest";
    const saved = localStorage.getItem(`compareList_${email}`);
    return saved ? JSON.parse(saved) : [];
  });

  const isInitialized = useRef(false);
  const prevUserEmail = useRef(userEmail);

  useEffect(() => {
    if (prevUserEmail.current === userEmail) return;

    const prevEmail = prevUserEmail.current;
    prevUserEmail.current = userEmail;

    isInitialized.current = false;
    const key = `compareList_${userEmail}`;
    const saved = localStorage.getItem(key);
    let newList = saved ? JSON.parse(saved) : [];

    // MERGE LOGIC: Guest -> User
    if (
      prevEmail === "guest" &&
      userEmail !== "guest" &&
      compareList.length > 0
    ) {
      // Filter duplicates
      const uniqueGuest = compareList.filter(
        (g) => !newList.some((n) => n.title === g.title),
      );
      newList = [...newList, ...uniqueGuest];

      // Enforce limit of 4 (Keep most recently added)
      if (newList.length > 4) {
        newList = newList.slice(newList.length - 4);
      }

      localStorage.setItem(key, JSON.stringify(newList));
      localStorage.removeItem("compareList_guest");
    }

    setCompareList(newList);
  }, [userEmail, compareList]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const key = `compareList_${userEmail}`;
    localStorage.setItem(key, JSON.stringify(compareList));
  }, [compareList, userEmail]);

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
