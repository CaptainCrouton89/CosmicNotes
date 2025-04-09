import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChatButtonsProps {
  isChatVisible: boolean;
  onToggle: () => void;
}

export function ChatButtons({ isChatVisible, onToggle }: ChatButtonsProps) {
  return (
    <>
      {/* Chat toggle button for mobile */}
      <button
        onClick={onToggle}
        className="md:hidden fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-10"
        aria-label={isChatVisible ? "Hide chat" : "Show chat"}
      >
        {isChatVisible ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Chat expand button for desktop - visible when chat is collapsed */}
      {!isChatVisible && (
        <Button
          variant="outline"
          onClick={onToggle}
          className="hidden md:flex fixed right-4 top-3 z-10 items-center gap-2 my-auto"
          aria-label="Show chat"
        >
          <ChevronLeft size={16} />
          <span>Open Chat</span>
        </Button>
      )}
    </>
  );
}
