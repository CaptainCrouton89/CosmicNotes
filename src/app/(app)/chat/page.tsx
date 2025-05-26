"use client";

import { ChatInterface } from "@/components/chat-interface";
import { LeftHeader } from "@/components/header/LeftHeader";

export default function ChatPage() {
  return (
    <>
      <LeftHeader>
        <h1 className="font-bold">Chat Assistant</h1>
      </LeftHeader>
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </>
  );
}
