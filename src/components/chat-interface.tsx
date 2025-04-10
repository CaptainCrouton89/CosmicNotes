"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkifySummary } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatInterfaceProps = {
  className?: string;
  endpoint?: string;
  chatId?: string;
};

export function ChatInterface({
  endpoint,
  chatId,
}: Omit<ChatInterfaceProps, "className">) {
  // Generate a stable chat ID that persists across navigations
  const chatIdToUse = chatId || "default";

  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: endpoint || "/api/chat",
      onError: (err: Error) => {
        console.error("Chat error:", err);
      },
      id: `cluster-${chatIdToUse}`,
      maxSteps: 15,
      body: {
        tagName: chatIdToUse,
      },
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle scroll events to detect if user has scrolled away from bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Check if user is at bottom (with small tolerance)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to bottom when messages change if shouldAutoScroll is true
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">
                I know your notes. Ask me anything about them.
              </p>
              <p className="text-sm">Seriously :)</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div key={`${message.id}-${i}`} className="markdown">
                        <Markdown
                          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                        >
                          {linkifySummary(part.text)}
                        </Markdown>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-500 rounded-md">
            Error: {error.message || "Something went wrong"}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1"
          disabled={status !== "ready"}
        />
        <Button type="submit" disabled={status !== "ready" || !input.trim()}>
          {status === "ready" ? "Send" : "Thinking..."}
        </Button>
      </form>
    </div>
  );
}
