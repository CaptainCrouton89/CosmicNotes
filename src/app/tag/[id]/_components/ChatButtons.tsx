import { RightHeader } from "@/components/header/RightHeader";
import { Button } from "@/components/ui/button";
import { Brain, ChevronLeft, ChevronRight } from "lucide-react";

interface ChatButtonsProps {
  isChatVisible: boolean;
  onToggle: () => void;
}

export function ChatButtons({ isChatVisible, onToggle }: ChatButtonsProps) {
  return (
    <RightHeader>
      {/* Chat toggle button for mobile */}
      {!isChatVisible && (
        <button
          onClick={onToggle}
          className="md:hidden fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-10"
          aria-label="Show chat"
        >
          <Brain size={20} />
        </button>
      )}
      {/* Chat expand button for desktop - visible when chat is collapsed */}

      <Button
        variant="outline"
        onClick={onToggle}
        className="hidden md:flex fixed z-10 items-center gap-2 my-auto"
        aria-label={isChatVisible ? "Close chat" : "Open chat"}
      >
        {!isChatVisible ? (
          <ChevronLeft size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
        <span>{isChatVisible ? "Close Chat" : "Open Chat"}</span>
      </Button>
      {isChatVisible && (
        <Button variant="outline" onClick={onToggle} className="md:hidden">
          <Brain size={16} />
        </Button>
      )}
    </RightHeader>
  );
}
