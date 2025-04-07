"use client";

import { ChatInterface } from "@/components/chat-interface";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Chat Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about your notes or get help with organizing your
          thoughts.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
