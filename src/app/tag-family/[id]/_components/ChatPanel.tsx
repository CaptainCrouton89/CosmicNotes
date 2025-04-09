import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ChatPanelProps {
  isVisible: boolean;
  chatId: string;
  onToggle: () => void;
}

export function ChatPanel({ isVisible, chatId, onToggle }: ChatPanelProps) {
  if (!isVisible) return null;

  return (
    <>
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold">AI Assistant</h2>
        <Button onClick={onToggle} aria-label="Hide chat">
          <span className="text-sm">Close</span>
          <ChevronRight size={20} />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface endpoint="/api/cluster/chat" chatId={chatId} />
      </div>
    </>
  );
}
