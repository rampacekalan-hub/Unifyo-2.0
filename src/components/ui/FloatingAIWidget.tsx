"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "ai" | "thinking";
  content: string;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
};

export default function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }, { role: "thinking", content: "" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, mode: "chat" }),
      });

      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.trim());
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              fullContent += parsed.delta;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "thinking") {
                  lastMsg.role = "ai";
                  lastMsg.content = fullContent;
                }
                return newMessages;
              });
            }
          } catch {}
        }
      }
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), { role: "ai", content: "Prepáč, nastala chyba. Skús znova." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{ 
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          boxShadow: "0 0 30px rgba(99,102,241,0.5)"
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: [
            "0 0 20px rgba(99,102,241,0.4)",
            "0 0 40px rgba(99,102,241,0.6)",
            "0 0 20px rgba(99,102,241,0.4)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "rgba(8,10,22,0.95)",
              border: `1px solid ${D.indigoBorder}`,
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 40px rgba(99,102,241,0.2)"
            }}
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${D.indigoBorder}`, background: "rgba(99,102,241,0.1)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm" style={{ color: D.text }}>Unifyo AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" style={{ color: D.muted }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: D.indigo }} />
                  <p className="text-sm" style={{ color: D.muted }}>Ako ti môžem pomôcť?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                    >
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div 
                    className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                    style={msg.role === "user" 
                      ? { background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))", border: "1px solid rgba(124,58,237,0.3)", color: D.text }
                      : msg.role === "thinking"
                      ? { background: "transparent" }
                      : { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd" }
                    }
                  >
                    {msg.role === "thinking" ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: D.indigo }} />
                        <span className="text-xs" style={{ color: D.muted }}>Rozmýšľam...</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Napíš správu..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: D.text }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-lg disabled:opacity-50"
                  style={{ background: D.indigo }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
