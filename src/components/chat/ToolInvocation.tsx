"use client";

import { Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { type ToolInvocation as ToolInvocationType } from "ai";

interface ToolInvocationProps {
  toolInvocation: ToolInvocationType;
}

const toolDisplayNames: Record<string, string> = {
  addNoteTool: "Creating Note",
  basicSearchNotesTool: "Searching Notes",
  deepSearchNotesTool: "Deep Searching Notes",
  scrapeWebSiteTool: "Scraping Website",
  updateNoteTool: "Updating Note",
  askWebEnabledAI: "Searching Web",
  appendTextToNote: "Appending to Note",
  addItemsToNote: "Adding Items to Note",
  addItemsToCollection: "Adding Items to Collection",
};

export function ToolInvocation({ toolInvocation }: ToolInvocationProps) {
  const displayName = toolDisplayNames[toolInvocation.toolName] || toolInvocation.toolName;
  
  const getStatusIcon = () => {
    switch (toolInvocation.state) {
      case "call":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "result":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "partial-call":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (toolInvocation.state) {
      case "call":
      case "partial-call":
        return "Running...";
      case "result":
        return "Complete";
      default:
        return "Pending";
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-muted text-sm">
      {getStatusIcon()}
      <span className="font-medium">{displayName}</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground">{getStatusText()}</span>
    </div>
  );
}