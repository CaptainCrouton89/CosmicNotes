import { ChatInterface } from "@/components/chat-interface";

interface ChatPanelProps {
  isVisible: boolean;
  chatId: string;
  onToggle: () => void;
  additionalBody?: Record<string, any>;
}

export function ChatPanel({
  isVisible,
  chatId,
  additionalBody,
}: ChatPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="flex-1 overflow-hidden pb-4 md:pb-0">
      <ChatInterface
        endpoint="/api/cluster/chat"
        chatId={chatId}
        additionalBody={additionalBody}
      />
    </div>
  );
}
