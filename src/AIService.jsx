// src/AIService.js
import AllProducts, { products, accessories, services } from "./Products";

export const AIService = {
  /**
   * Get recommended products based on text similarity (Content-Based Filtering).
   * This simulates an ML model finding similar items based on description and features.
   */
  getRecommendations: (currentProduct, limit = 5) => {
    if (!currentProduct) return [];

    const features = currentProduct.features || [];
    // 1. Tokenize the current product's description and category
    // We convert to lowercase and split by non-word characters
    const currentText = `${currentProduct.category} ${currentProduct.description} ${features.join(" ")}`;
    const currentTokens = new Set(
      currentText
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3), // Filter out short words
    );

    // 2. Score every other product based on token overlap (Jaccard Similarity concept)
    const scoredProducts = AllProducts
      .filter((p) => p.id !== currentProduct.id && p.category === currentProduct.category)
      .map((p) => {
        const pFeatures = p.features || [];
        const productText = `${p.category} ${p.description} ${pFeatures.join(" ")}`;
        const productTokens = productText.toLowerCase().split(/\W+/);

        // Count how many important words match
        const matchCount = productTokens.reduce((acc, token) => {
          return currentTokens.has(token) ? acc + 1 : acc;
        }, 0);

        // Boost score for exact feature matches
        const sharedFeatures = pFeatures.filter(f => features.includes(f)).length;

        return { ...p, score: matchCount + (sharedFeatures * 5) };
      });

    // 3. Sort by score (highest match first) and return top N
    return scoredProducts.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  /**
   * Analyze user behavior (mock) to suggest items.
   * This uses recently viewed items to generate personalized suggestions.
   */
  getPersonalizedSuggestions: (userEmail, limit = 5) => {
    const viewedKey = `recentlyViewed_${userEmail || "guest"}`;
    let recentlyViewed = [];
    try {
      recentlyViewed = JSON.parse(localStorage.getItem(viewedKey)) || [];
    } catch (e) {
      console.error("Error parsing recently viewed items", e);
      recentlyViewed = [];
    }

    if (recentlyViewed.length === 0) {
      // If no history, return some popular items as a fallback
      return AllProducts.slice(0, limit);
    }

    // 1. Create a "profile" of the user's interests from their recently viewed items
    const userProfileText = recentlyViewed
      .map(
        (p) => {
          const features = p.features || [];
          return `${p.category} ${p.title} ${p.description} ${features.join(" ")}`;
        }
      )
      .join(" ");

    const userTokens = new Set(
      userProfileText
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3),
    );

    // 2. Score all products based on this profile (similar to getRecommendations)
    const recentlyViewedTitles = new Set(recentlyViewed.map((p) => p.title));
    const scoredProducts = AllProducts
      .filter((p) => !recentlyViewedTitles.has(p.title)) // Exclude items they've already seen
      .map((p) => {
        const productTokens = `${p.category} ${p.title} ${p.description}`.toLowerCase().split(/\W+/);
        const score = productTokens.reduce((acc, token) => userTokens.has(token) ? acc + 1 : acc, 0);
        return { ...p, score };
      });

    // 3. Return the top N scored products
    return scoredProducts.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  /**
   * Get frequently bought together items based on order history.
   * This simulates an association rule learning algorithm (e.g., Apriori).
   */
  getFrequentlyBoughtTogether: (currentProduct, limit = 2) => {
    let allOrders = [];
    try {
      allOrders = JSON.parse(localStorage.getItem("mockOrders")) || [];
    } catch (e) {
      allOrders = [];
    }
    
    const coOccurrences = {};

    // 1. Analyze orders to find items bought with the current product
    allOrders.forEach((order) => {
      if (!order.items) return;
      const hasCurrent = order.items.some(
        (item) => item.title === currentProduct.title,
      );
      if (hasCurrent) {
        order.items.forEach((item) => {
          if (item.title !== currentProduct.title) {
            coOccurrences[item.title] = (coOccurrences[item.title] || 0) + 1;
          }
        });
      }
    });

    // 2. Sort by frequency
    const sortedTitles = Object.keys(coOccurrences).sort(
      (a, b) => coOccurrences[b] - coOccurrences[a],
    );

    const allItems = [...products, ...accessories, ...services];
    let recommendations = sortedTitles
      .map((title) => allItems.find((p) => p.title === title))
      .filter(Boolean)
      .slice(0, limit);

    // 3. Rule-based accessories and services (Realistic Fallback)
    if (recommendations.length < limit) {
      let accessoryKeywords = [];
      let serviceKeywords = [];
      const cat = currentProduct.category;

      if (cat === "Smartphones") {
        accessoryKeywords = ["Tempered Glass", "Back Cover"];
        serviceKeywords = ["Warranty for Smartphones"];
      } else if (cat === "TVs") {
        accessoryKeywords = ["Wall Mount", "HDMI Cable"];
        serviceKeywords = ["Warranty for Smart TVs"];
      } else if (cat === "Laptops") {
        accessoryKeywords = ["Mouse", "Laptop Sleeve"];
        serviceKeywords = ["Protection for Laptops"];
      } else if (cat === "Audio") {
        accessoryKeywords = ["Silicone Case", "Headphone Stand"];
      } else if (cat === "Wearables") {
        accessoryKeywords = ["Silicone Strap", "Screen Protector for Smartwatch"];
      }

      const foundItems = [];
      if (accessoryKeywords.length > 0) {
        foundItems.push(
          ...accessories.filter((p) =>
            accessoryKeywords.some((k) => p.title.includes(k)),
          ),
        );
      }
      if (serviceKeywords.length > 0) {
        foundItems.push(
          ...services.filter((p) =>
            serviceKeywords.some((k) => p.title.includes(k)),
          ),
        );
      }

      if (foundItems.length > 0) {
        // Add items that aren't already in recommendations
        for (const item of foundItems) {
          if (recommendations.length >= limit) break;
          if (!recommendations.some((r) => r.id === item.id)) {
            recommendations.push(item);
          }
        }
      }
    }

    // 4. Fallback if not enough data: pick items from same category (excluding current)
    if (recommendations.length < limit) {
      const fallback = products
        .filter( // Fallback to similar main products if still not enough
          (p) =>
            p.category === currentProduct.category &&
            p.id !== currentProduct.id &&
            !recommendations.some((r) => r.id === p.id),
        )
        .slice(0, limit - recommendations.length);
      recommendations = [...recommendations, ...fallback];
    }

    return recommendations.slice(0, limit);
  },
};
