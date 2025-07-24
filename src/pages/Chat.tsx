import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Heart, AlertCircle } from "lucide-react";
import { streamAIReply } from "../services/aiServices";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text:
        "Hello! I'm here to provide you with compassionate support and evidence-based techniques for emotional well-being. How are you feeling today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      role: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    let aiResponse = "";
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "",
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);

    const chatHistory = [
      {
        role: "system",
        content:
          "You are a kind, empathetic mental health support assistant. Always respond with warmth, emotional intelligence, and evidence-based mental wellness techniques. Never give medical advice or diagnoses.",
      },
      ...updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.text,
      })),
    ];

    controllerRef.current = new AbortController();

    try {
      await streamAIReply(
        chatHistory,
        (token) => {
          aiResponse += token;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessage.id ? { ...m, text: aiResponse } : m
            )
          );
        },
        () => {
          setIsTyping(false);
          controllerRef.current = null;
        },
        controllerRef.current.signal
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: "⚠️ I'm having trouble responding right now. Please try again shortly.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
      controllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-warm-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-sage-500 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text mb-2">
            Supportive Chat
          </h1>
          <p className="text-gray-600">
            A safe space for compassionate guidance and support
          </p>
        </motion.div>

        {/* Crisis Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3"
        >
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <strong>Crisis Support:</strong> If you're having thoughts of
            self-harm, please call 988 (Suicide & Crisis Lifeline) or text HOME
            to 741741 immediately.
          </div>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-primary-200"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex space-x-3 items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
              />
              <div className="flex flex-col items-center">
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors duration-200"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
                {isTyping && (
                  <button
                    onClick={() => controllerRef.current?.abort()}
                    className="text-xs text-red-500 mt-1 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-500"
        >
          This chat provides supportive guidance but is not a substitute for
          professional mental health care.
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;
