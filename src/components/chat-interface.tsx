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
import { Brain, Trash2 } from "lucide-react";
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
  noteId?: number;
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
>(({ endpoint, chatId, additionalBody, noteId }, ref) => {
  const chatIdToUse = chatId || "default";
  const [mode, setMode] = useState<Mode>("medium");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    append,
    handleSubmit,
    status,
    error,
    setMessages,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesRef = useRef(messages);

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

  // Load chat history on mount if noteId is provided
  useEffect(() => {
    if (noteId && !isLoadingHistory && additionalBody?.note?.chat_history) {
      setIsLoadingHistory(true);
      try {
        const chatHistory = additionalBody.note.chat_history;
        if (Array.isArray(chatHistory)) {
          setMessages(chatHistory);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
  }, [noteId, additionalBody, setMessages]);

  // Save chat history when messages change
  useEffect(() => {
    messagesRef.current = messages;
    
    if (noteId && messages.length > 0 && !isLoadingHistory) {
      const saveTimeout = setTimeout(() => {
        fetch(`/api/note/${noteId}/chat-history`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatHistory: messages }),
        }).catch(error => {
          console.error('Failed to save chat history:', error);
        });
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(saveTimeout);
    }
  }, [messages, noteId, isLoadingHistory]);

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, shouldAutoScroll]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (input.trim() && status === "ready") {
        const syntheticEvent = {
          preventDefault: () => {},
        } as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(syntheticEvent);
      }
    }
  };

  // Add effect to refocus textarea after message is sent
  useEffect(() => {
    if (status === "ready" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [status]);

  const toggleMode = () => {
    const currentIndex = Object.keys(MODES).indexOf(mode);
    const nextIndex = (currentIndex + 1) % Object.keys(MODES).length;
    setMode(Object.keys(MODES)[nextIndex] as Mode);
  };

  const clearChat = async () => {
    setMessages([]);
    // Save cleared chat history if this is a note-specific chat
    if (noteId) {
      try {
        await fetch(`/api/note/${noteId}/chat-history`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatHistory: [] }),
        });
      } catch (error) {
        console.error('Failed to clear chat history:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex justify-end p-2 border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={clearChat}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
        </div>
      )}
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
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message (Shift+Enter for new line)..."
          className="flex-1 resize-none"
          rows={1}
          style={{ minHeight: "40px", maxHeight: "200px" }}
        />
        <Button type="submit" disabled={status !== "ready" || !input.trim()}>
          {status === "ready" ? "Send" : "Thinking..."}
        </Button>
      </form>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";
