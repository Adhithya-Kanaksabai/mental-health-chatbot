import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Heart, AlertCircle, ExternalLink } from "lucide-react";
import { streamChat, fetchCrisisResources, localeHint } from "../services/aiServices";
import type { ChatMessage, CrisisResource } from "@shared/protocol";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: Date;
  isError?: boolean;
}

const SYSTEM_PROMPT =
  "You are a kind, empathetic mental health support assistant. Always respond with warmth, emotional intelligence, and evidence-based mental wellness techniques. Never give medical advice or diagnoses.";

// Models answer in markdown. Rendered compactly for a chat bubble: headings
// become bold lines rather than page-sized titles. react-markdown does not render
// raw HTML and neutralises unsafe link protocols, so model output cannot inject
// markup into the page.
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h1: ({ children }) => <p className="font-semibold mt-2 mb-1">{children}</p>,
  h2: ({ children }) => <p className="font-semibold mt-2 mb-1">{children}</p>,
  h3: ({ children }) => <p className="font-semibold mt-2 mb-1">{children}</p>,
  h4: ({ children }) => <p className="font-semibold mt-2 mb-1">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="bg-gray-200 rounded px-1">{children}</code>,
};

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
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Scroll only the message list. scrollIntoView also scrolls every ancestor,
  // including the window, so each streamed token jolted the whole page and
  // pushed the crisis banner under the header.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Crisis numbers are region-specific and resolved server-side. They used to
  // be hardcoded US shortcodes, which connect to nothing outside the US.
  useEffect(() => {
    let cancelled = false;
    fetchCrisisResources(localeHint()).then((list) => {
      if (!cancelled) setResources(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

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

    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiMessageId, text: "", role: "assistant", timestamp: new Date() },
    ]);

    const history: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...updatedMessages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.text })),
    ];

    const patch = (fields: Partial<Message>) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMessageId ? { ...m, ...fields } : m))
      );

    let reply = "";
    controllerRef.current = new AbortController();

    await streamChat(
      { messages: history, locale: localeHint() },
      {
        onDelta: (text) => {
          reply += text;
          patch({ text: reply });
        },
        onError: (message) => {
          // Keep any answer text that already arrived; a provider can fail
          // part-way through a reply.
          patch({
            text: reply ? `${reply}\n\n⚠️ ${message}` : `⚠️ ${message}`,
            isError: true,
          });
        },
        onDone: () => {
          // An empty reply with no error shouldn't leave a blank bubble behind.
          setMessages((prev) =>
            prev.filter((m) => m.id !== aiMessageId || m.text.length > 0)
          );
          setIsTyping(false);
          controllerRef.current = null;
        },
      },
      controllerRef.current.signal
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
            <strong>Crisis Support:</strong>{" "}
            {resources.length > 0 ? (
              <>
                If you are having thoughts of self-harm, please reach out now:
                <ul className="mt-2 space-y-1">
                  {resources.map((r) => (
                    <li key={r.name}>
                      <span className="font-semibold">
                        {r.method === "text" ? "Text " : ""}
                        {r.contact}
                      </span>{" "}
                      &mdash; {r.name}
                      {r.detail ? (
                        <span className="text-red-600"> ({r.detail})</span>
                      ) : null}
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center ml-1 underline"
                          aria-label={`Official page for ${r.name}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                If you are having thoughts of self-harm, please contact your
                local emergency services, or find a verified crisis line for
                your country at findahelpline.com.
              </>
            )}
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
          <div ref={scrollRef} className="h-96 overflow-y-auto p-6 space-y-4">
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
                      : message.isError
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.role === "assistant" && !message.isError ? (
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown components={markdownComponents}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.text}
                    </p>
                  )}
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
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex space-x-3 items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
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
