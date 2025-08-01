"use client";

import { ToolInvocation } from "@/components/chat/ToolInvocation";
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
  clusterId?: number;
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
>(({ endpoint, chatId, additionalBody, noteId, clusterId }, ref) => {
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
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [isSavingChatHistory, setIsSavingChatHistory] = useState(false);
  const [hasLoadedInitialHistory, setHasLoadedInitialHistory] = useState(false);

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

  // Reset history loading flag when noteId or clusterId changes
  useEffect(() => {
    setHasLoadedInitialHistory(false);
  }, [noteId, clusterId]);

  // Load chat history on mount if noteId or clusterId is provided
  useEffect(() => {
    const shouldLoadHistory = !isLoadingHistory && !hasLoadedInitialHistory && messages.length === 0;
    
    if (noteId && shouldLoadHistory && additionalBody?.note?.chat_history) {
      setIsLoadingHistory(true);
      try {
        const chatHistory = additionalBody.note.chat_history;
        if (Array.isArray(chatHistory)) {
          setMessages(chatHistory);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
        setHasLoadedInitialHistory(true);
      }
    } else if (clusterId && shouldLoadHistory && additionalBody?.cluster?.chat_history) {
      setIsLoadingHistory(true);
      try {
        const chatHistory = additionalBody.cluster.chat_history;
        if (Array.isArray(chatHistory)) {
          setMessages(chatHistory);
        }
      } catch (error) {
        console.error("Failed to load cluster chat history:", error);
      } finally {
        setIsLoadingHistory(false);
        setHasLoadedInitialHistory(true);
      }
    }
  }, [noteId, clusterId, additionalBody?.note?.chat_history, additionalBody?.cluster?.chat_history, setMessages, messages.length, isLoadingHistory, hasLoadedInitialHistory]);

  // Save chat history when messages change and detect note modifications
  useEffect(() => {
    messagesRef.current = messages;

    // Check if any of the latest messages contain tool invocations that modify the note or cluster
    const noteModifyingTools = [
      "addNoteTool",
      "updateNoteTool",
      "applyDiffToNoteTool",
      "appendTextToNoteTool",
      "appendTextToUnknownNoteTool",
      "addTodoItemsToNoteTool",
      "addTodoItemsToUnknownNoteTool",
      "addItemsToCollectionTool",
      "addItemsToUnknownCollectionTool",
      "addItemsToNote",
      "addItemsToCollection",
    ];
    
    // Tools that might affect clusters (when notes in the tag are modified)
    const clusterModifyingTools = [...noteModifyingTools];

    // Check for completed note-modifying tools
    const hasCompletedNoteModifyingTool = messages.some((message) => {
      if (message.parts && message.parts.length > 0) {
        return message.parts.some((part: any) => {
          // Check for tool-invocation parts with result
          if (part.type === "tool-invocation" && part.toolInvocation) {
            const toolName = part.toolInvocation.toolName;
            const state = part.toolInvocation.state;
            // Check if the tool has completed (state is 'result')
            return (
              toolName &&
              noteModifyingTools.includes(toolName) &&
              state === "result"
            );
          }
          return false;
        });
      }
      return false;
    });

    // Check if there's an ongoing note-modifying tool call (to reset the flag)
    const hasOngoingNoteModifyingTool = messages.some((message) => {
      if (message.parts && message.parts.length > 0) {
        return message.parts.some((part: any) => {
          if (part.type === "tool-invocation" && part.toolInvocation) {
            const toolName = part.toolInvocation.toolName;
            const state = part.toolInvocation.state;
            return (
              toolName &&
              noteModifyingTools.includes(toolName) &&
              (state === "call" || state === "partial-call")
            );
          }
          return false;
        });
      }
      return false;
    });

    // Reset needsRefresh when a new tool call starts
    if (hasOngoingNoteModifyingTool && needsRefresh) {
      setNeedsRefresh(false);
    }

    // Trigger refresh when a tool completes
    if (hasCompletedNoteModifyingTool && !needsRefresh) {
      setNeedsRefresh(true);
      
      if (noteId) {
        console.log(
          "Note-modifying tool detected, triggering refresh for noteId:",
          noteId
        );
        // Dispatch a custom event that the note page can listen to
        window.dispatchEvent(
          new CustomEvent("noteModified", { detail: { noteId } })
        );
      } else if (clusterId) {
        console.log(
          "Cluster-modifying tool detected, triggering refresh for clusterId:",
          clusterId
        );
        // Dispatch a custom event that the tag page can listen to
        window.dispatchEvent(
          new CustomEvent("clusterModified", { detail: { clusterId } })
        );
      }
    }

    if ((noteId || clusterId) && messages.length > 0 && !isLoadingHistory) {
      const saveTimeout = setTimeout(async () => {
        setIsSavingChatHistory(true);
        try {
          if (noteId) {
            await fetch(`/api/note/${noteId}/chat-history`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatHistory: messages }),
            });
          } else if (clusterId) {
            await fetch(`/api/cluster/${clusterId}/chat-history`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatHistory: messages }),
            });
          }
        } catch (error) {
          console.error("Failed to save chat history:", error);
        } finally {
          setIsSavingChatHistory(false);
        }
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(saveTimeout);
    }
  }, [messages, noteId, clusterId, isLoadingHistory]);

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
    setNeedsRefresh(false); // Reset the refresh flag
    // Don't reset hasLoadedInitialHistory - we want to prevent reloading after clear
    // Save cleared chat history if this is a note-specific or cluster-specific chat
    if (noteId) {
      try {
        setIsSavingChatHistory(true);
        await fetch(`/api/note/${noteId}/chat-history`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatHistory: [] }),
        });
      } catch (error) {
        console.error("Failed to clear chat history:", error);
      } finally {
        setIsSavingChatHistory(false);
      }
    } else if (clusterId) {
      try {
        setIsSavingChatHistory(true);
        await fetch(`/api/cluster/${clusterId}/chat-history`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatHistory: [] }),
        });
      } catch (error) {
        console.error("Failed to clear cluster chat history:", error);
      } finally {
        setIsSavingChatHistory(false);
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
          messages.map((message, index) => {
            // Log message structure for debugging
            if (
              message.parts &&
              message.parts.some((p) => p.type === "tool-invocation")
            ) {
              console.log("Message with tool invocations:", message);
            }

            return (
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
                  <div className="space-y-2">
                    {/* Render tool invocations from parts */}

                    {/* Then render the message parts */}
                    {message.parts?.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return part.text ? (
                            <div
                              key={`${message.id}-${i}`}
                              className="markdown"
                            >
                              <Markdown
                                remarkPlugins={[
                                  [remarkGfm, { singleTilde: false }],
                                ]}
                                children={linkifySummary(part.text)}
                              />
                            </div>
                          ) : null;
                        case "tool-invocation":
                          return (
                            <ToolInvocation
                              key={`${message.id}-${i}`}
                              toolInvocation={part}
                            />
                          );
                        default:
                          return null;
                      }
                    }) ||
                      // Fallback for older message format without parts
                      (message.content && (
                        <div className="markdown">
                          <Markdown
                            remarkPlugins={[
                              [remarkGfm, { singleTilde: false }],
                            ]}
                            children={linkifySummary(message.content)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
          })
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
