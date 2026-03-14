import React, { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import AllProducts from "./Products";
import { useCart } from "./CartContext";

// A new, lightweight component to render product cards inside the chat window.
const ProductCardInChat = memo(({ product, closeChat }) => {
  const navigate = useNavigate();
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
    closeChat();
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-48 shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="h-24 bg-gray-100 rounded-t-lg flex items-center justify-center p-2">
        <img
          src={product.src}
          alt={product.title}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 h-8">
          {product.title}
        </p>
        <p className="text-sm font-bold text-indigo-600 mt-1">
          {formatPrice(product.OriginalPrice)}
        </p>
      </div>
    </div>
  );
});

// Detailed Product View Component for Chat
const ProductDetailInChat = memo(({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const handleAddToCart = () => {
    try {
      addToCart(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden mt-2 w-full max-w-[95%] text-left">
      <div className="relative h-48 bg-white p-4 flex items-center justify-center border-b border-gray-100">
        <img
          src={product.src}
          alt={product.title}
          className="max-h-full max-w-full object-contain"
        />
        {product.category && (
          <span className="absolute top-2 left-2 bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-medium">
            {product.category}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h4 className="font-bold text-gray-900 text-sm leading-snug">
          {product.title}
        </h4>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-600">
            {formatPrice(product.OriginalPrice)}
          </span>
          {product.MRP && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.MRP)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`w-full py-2 rounded-lg font-bold text-xs text-white transition-colors shadow-sm ${
            isAdded ? "bg-green-500" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isAdded ? "Added to Cart" : "Add to Cart"}
        </button>

        {product.features && product.features.length > 0 && (
          <div className="text-xs text-gray-600">
            <p className="font-semibold mb-1 text-gray-800">Key Features:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {product.features.slice(0, 3).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {product.specifications && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(product.specifications)
                .slice(0, 4)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b border-gray-200 last:border-0 pb-1 last:pb-0"
                  >
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-500 text-right">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hi there! 👋 I'm Nova, your AI shopping assistant. I can help you find products, track orders, or answer support questions.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Listen for custom event triggered from Navbar
  useEffect(() => {
    const handleToggleNova = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-nova", handleToggleNova);
    return () => {
      window.removeEventListener("toggle-nova", handleToggleNova);
    };
  }, []);

  // Mock AI Logic
  const generateResponse = async (text) => {
    const lowerText = text.toLowerCase();
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 500),
    ); // Simulate network delay

    // 1. Search for Product Matches
    const matchedProducts = AllProducts.filter((p) =>
      p.title.toLowerCase().includes(lowerText),
    );

    if (matchedProducts.length === 1) {
      return {
        text: `Here is everything I found about ${matchedProducts[0].title}:`,
        productDetail: matchedProducts[0],
      };
    }

    if (matchedProducts.length > 1) {
      return {
        text: `I found ${matchedProducts.length} products matching "${text}". Here are the top results:`,
        products: matchedProducts.slice(0, 5),
      };
    }

    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return { text: "Hello! How can I assist you with your shopping today?" };
    }
    if (
      lowerText.includes("order") ||
      lowerText.includes("track") ||
      lowerText.includes("status")
    ) {
      if (user) {
        return {
          text: "You can view and track your recent orders in the 'My Profile' section. Would you like me to take you there?",
        };
      }
      return {
        text: "Please log in to track your orders. I can help you find the login page!",
      };
    }
    if (lowerText.includes("return") || lowerText.includes("refund")) {
      return {
        text: "We have a hassle-free 30-day return policy. If you're not satisfied, you can initiate a return from your Order History.",
      };
    }
    if (lowerText.includes("laptop") || lowerText.includes("computer")) {
      const laptops = AllProducts.filter((p) => p.category === "Laptops").slice(
        0,
        3,
      );
      return {
        text: "I found some great laptops for you!",
        products: laptops,
      };
    }
    if (lowerText.includes("offer") || lowerText.includes("discount")) {
      return {
        text: "We currently have a 20% OFF sale! Use code 'INTERN20' at checkout.",
      };
    }
    if (lowerText.includes("phone") || lowerText.includes("mobile")) {
      const phones = AllProducts.filter(
        (p) => p.category === "Smartphones",
      ).slice(0, 3);
      return {
        text: "Here are some of the latest phones we have in stock:",
        products: phones,
      };
    }

    return {
      text: "I'm still learning! You can ask me about products, shipping, returns, or check our Support page for more details.",
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now(), type: "user", text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Navigation logic based on intent
    if (inputText.toLowerCase().includes("take me to orders") && user) {
      setTimeout(() => {
        navigate("/profile");
        setIsOpen(false);
      }, 1500);
    }

    const response = await generateResponse(inputText);
    setIsTyping(false);
    const botMessage = {
      id: Date.now() + 1,
      type: "bot",
      text: response.text,
      products: response.products || null,
      productDetail: response.productDetail || null,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const quickActions = [
    "Track my Order",
    "Return Policy",
    "Best Laptops",
    "Current Offers",
  ];

  const handleQuickAction = (action) => {
    const userMessage = { id: Date.now(), type: "user", text: action };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    generateResponse(action).then((response) => {
      setIsTyping(false);
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: response.text,
        products: response.products || null,
        productDetail: response.productDetail || null,
      };
      setMessages((prev) => [...prev, botMessage]);
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        text: "Hi there! 👋 I'm Nova, your AI shopping assistant. I can help you find products, track orders, or answer support questions.",
      },
    ]);
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 md:left-auto md:right-8 z-[120] w-full md:w-[420px] h-[85vh] md:h-[650px] max-h-[90vh] bg-white md:rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden font-sans border-t border-x border-gray-200"
          >
            {/* Header (Updated to match Rufus AI style) */}
            <div className="bg-white p-4 flex items-center justify-between shrink-0 border-b border-gray-100">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-black font-bold text-2xl tracking-tight leading-none">
                    Nova
                  </h3>
                  <span className="text-black font-bold text-xl leading-none flex items-center relative">
                    ai
                    <svg
                      className="w-3 h-3 absolute -top-1.5 -right-2.5 text-black"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.39 9.61L22 12L14.39 14.39L12 22L9.61 14.39L2 12L9.61 9.61L12 2Z" />
                    </svg>
                  </span>
                </div>
                <span className="text-gray-400 font-medium text-sm mt-0.5 leading-none">
                  Shopping Assistant
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear Chat"
                >
                  <svg
                    className="w-5 h-5"
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
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Close"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col w-full ${
                    msg.type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {msg.text && (
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.type === "user"
                          ? "bg-gray-100 text-gray-800 rounded-tr-none"
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                  {msg.products && (
                    <div className="mt-2 w-full flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {msg.products.map((product) => (
                        <ProductCardInChat
                          key={product.id}
                          product={product}
                          closeChat={() => setIsOpen(false)}
                        />
                      ))}
                    </div>
                  )}
                  {msg.productDetail && (
                    <ProductDetailInChat product={msg.productDetail} />
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (only show if few messages) */}
            {messages.length < 4 && !isTyping && (
              <div className="px-4 py-2 bg-gray-50 overflow-x-auto flex gap-2 no-scrollbar shrink-0 border-t border-gray-100">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs rounded-full hover:bg-indigo-50 transition-colors shadow-sm"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <svg
                    className="w-5 h-5 ml-0.5 transform rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Chatbot);
