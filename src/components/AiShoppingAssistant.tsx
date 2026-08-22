"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageSquare, Send, ShoppingCart, ArrowRight, Bot } from "lucide-react";
import { Product } from "@/lib/types";

interface AiShoppingAssistantProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  sender: "user" | "assistant";
  text: string;
  recommendedProducts?: Product[];
}

const QUICK_PROMPTS = [
  "Wireless earbuds under ₹2,000",
  "Best rated smartwatch",
  "Daily kitchen essentials",
  "Running shoes under ₹1,500",
];

export default function AiShoppingAssistant({
  products,
  onSelectProduct,
  onAddToCart,
}: AiShoppingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "Hi! I am TECH AI Shopping Assistant. Tell me what you're looking for or your budget!",
    },
  ]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: Message = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");

    // Simple smart product filter based on keywords and price in query
    setTimeout(() => {
      const qLower = query.toLowerCase();
      let matched = products.filter((p) => {
        const matchesKeyword =
          p.title.toLowerCase().includes(qLower) ||
          p.category.toLowerCase().includes(qLower) ||
          p.brand.toLowerCase().includes(qLower) ||
          (qLower.includes("earbud") && p.category === "Electronics") ||
          (qLower.includes("watch") && (p.title.includes("Watch") || p.category.includes("Wearables"))) ||
          (qLower.includes("kitchen") && p.category === "Home Appliances") ||
          (qLower.includes("shoe") && p.title.includes("Shoe"));

        return matchesKeyword;
      });

      // Price filters in prompt
      if (qLower.includes("2000") || qLower.includes("2,000")) {
        matched = (matched.length ? matched : products).filter((p) => p.price <= 2000);
      } else if (qLower.includes("1500") || qLower.includes("1,500")) {
        matched = (matched.length ? matched : products).filter((p) => p.price <= 1500);
      } else if (qLower.includes("best") || qLower.includes("top")) {
        matched = (matched.length ? matched : products).filter((p) => p.rating >= 4.3);
      }

      const topRecommendations = (matched.length ? matched : products.slice(0, 2)).slice(0, 3);

      const assistantMsg: Message = {
        sender: "assistant",
        text: `Here are ${topRecommendations.length} top options I found for "${query}":`,
        recommendedProducts: topRecommendations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 400);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl border border-slate-700 transition-transform hover:scale-105 cursor-pointer text-xs font-bold"
          >
            <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="hidden sm:inline">Ask TECH AI Assistant</span>
          </button>
        )}
      </div>

      {/* Assistant Modal / Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">TECH AI Shopping Assistant</h3>
                  <p className="text-[10px] text-cyan-300 font-medium">Smart catalog discovery helper</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Conversation Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] font-medium leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-cyan-600 text-white rounded-br-none"
                        : "bg-slate-100 text-slate-900 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Render Recommended Product Cards */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="w-full space-y-2 mt-2">
                      {msg.recommendedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                        >
                          <div
                            onClick={() => {
                              onSelectProduct(prod);
                              setIsOpen(false);
                            }}
                            className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1"
                          >
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-[11px]">{prod.title}</p>
                              <p className="text-[11px] font-black text-slate-950">₹{prod.price.toLocaleString("en-IN")}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onAddToCart(prod)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs transition-colors flex-shrink-0 ml-2"
                            title="Add to cart"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Prompt Pills */}
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 overflow-x-auto no-scrollbar flex gap-1.5 text-[10px]">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 text-slate-700 font-semibold whitespace-nowrap transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask about products, budget, specs..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
