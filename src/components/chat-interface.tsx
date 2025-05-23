"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { linkifySummary } from "@/lib/utils";
import { Mode } from "@/types/types";
import { useChat } from "@ai-sdk/react";
import { CreateMessage } from "ai";
import { Brain } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type ChatInterfaceHandle = {
  append: (message: CreateMessage) => Promise<string | null | undefined>;
};

type ChatInterfaceProps = {
  className?: string;
  endpoint?: string;
  chatId?: string;
  additionalBody?: any;
};

const MODES: Record<
  Mode,
  { label: string; description: string; maxSteps: number; color: string }
> = {
  standard: {
    label: "Standard",
    description: "Standard mode",
    maxSteps: 15,
    color: "text-gray-800 hover:bg-gray-200",
  },
  medium: {
    label: "Medium",
    description: "Medium mode",
    maxSteps: 20,
    color: "text-green-600 hover:bg-green-200",
  },
  high: {
    label: "High",
    description: "High mode",
    maxSteps: 25,
    color: "text-blue-600 hover:bg-blue-200",
  },
};

export const ChatInterface = forwardRef<
  ChatInterfaceHandle,
  Omit<ChatInterfaceProps, "className">
>(({ endpoint, chatId, additionalBody }, ref) => {
  const chatIdToUse = chatId || "default";
  const [mode, setMode] = useState<Mode>("medium");

  const {
    messages,
    input,
    handleInputChange,
    append,
    handleSubmit,
    status,
    error,
  } = useChat({
    api: endpoint || "/api/chat",
    onError: (err: Error) => {
      console.error("Chat error:", err);
    },
    id: `chat-${chatIdToUse}`,
    maxSteps: MODES[mode].maxSteps,
    body: {
      tagId: chatIdToUse,
      mode: mode,
      ...additionalBody,
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      append,
    }),
    [append]
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, shouldAutoScroll]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (input.trim()) {
        const syntheticEvent = {
          preventDefault: () => {},
        } as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(syntheticEvent);
      }
    }
  };

  const toggleMode = () => {
    const currentIndex = Object.keys(MODES).indexOf(mode);
    const nextIndex = (currentIndex + 1) % Object.keys(MODES).length;
    setMode(Object.keys(MODES)[nextIndex] as Mode);
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-muted-foreground my-auto flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg font-medium">
              I know your notes. Ask me anything about them.
            </p>
            <p className="text-sm">Seriously :)</p>
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
                          children={linkifySummary(part.text)}
                        />
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

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t flex gap-2 items-start"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleMode}
              className={`shrink-0 ${MODES[mode].color}`}
              aria-label={`Toggle ${mode} mode`}
            >
              <Brain size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{MODES[mode].label} mode</TooltipContent>
        </Tooltip>
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message (Shift+Enter for new line)..."
          className="flex-1 resize-none"
          rows={1}
          style={{ minHeight: "40px", maxHeight: "200px" }}
          disabled={status !== "ready"}
        />
        <Button type="submit" disabled={status !== "ready" || !input.trim()}>
          {status === "ready" ? "Send" : "Thinking..."}
        </Button>
      </form>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";
