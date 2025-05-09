import {
  ChatInterface,
  ChatInterfaceHandle,
} from "@/components/chat-interface";
import React from "react";

interface ChatPanelProps {
  isVisible: boolean;
  endpoint: string;
  chatId: string;
  onToggle: () => void;
  additionalBody?: Record<string, any>;
  chatRef?: React.Ref<ChatInterfaceHandle>;
}

export function ChatPanel({
  isVisible,
  endpoint,
  chatId,
  additionalBody,
  chatRef,
}: ChatPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="flex-1 overflow-hidden pb-4 md:pb-0">
      <ChatInterface
        ref={chatRef}
        endpoint={endpoint}
        chatId={chatId}
        additionalBody={additionalBody}
      />
    </div>
  );
}
