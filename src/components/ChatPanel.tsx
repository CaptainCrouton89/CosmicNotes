import { ChatInterface } from "@/components/chat-interface";

interface ChatPanelProps {
  isVisible: boolean;
  endpoint: string;
  chatId: string;
  onToggle: () => void;
  additionalBody?: Record<string, any>;
}

export function ChatPanel({
  isVisible,
  endpoint,
  chatId,
  additionalBody,
}: ChatPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="flex-1 overflow-hidden pb-4 md:pb-0">
      <ChatInterface
        endpoint={endpoint}
        chatId={chatId}
        additionalBody={additionalBody}
      />
    </div>
  );
}
