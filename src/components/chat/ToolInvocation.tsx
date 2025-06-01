"use client";

import { Loader2, CheckCircle2, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { type ToolInvocation as ToolInvocationType } from "ai";
import { useState } from "react";

interface ToolInvocationProps {
  toolInvocation: ToolInvocationType | any; // Accept both types
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle nested toolInvocation structure from parts
  const actualInvocation = toolInvocation.toolInvocation || toolInvocation;
  
  // Extract the actual tool data
  const toolName = actualInvocation.toolName || actualInvocation.name || '';
  const displayName = toolDisplayNames[toolName] || toolName;
  const state = actualInvocation.state || 'call';
  
  const getStatusIcon = () => {
    switch (state) {
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
    switch (state) {
      case "call":
      case "partial-call":
        return "Running...";
      case "result":
        return "Complete";
      default:
        return "Pending";
    }
  };

  const result = state === "result" ? actualInvocation.result : null;
  const args = actualInvocation.args || actualInvocation.arguments;
  const hasDetails = args || result;

  return (
    <div className="my-2 rounded-md bg-muted/50 border border-muted text-sm">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left ${
          hasDetails ? "hover:bg-muted/70 cursor-pointer" : "cursor-default"
        }`}
      >
        {hasDetails && (
          <span className="transition-transform duration-200">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
        {getStatusIcon()}
        <span className="font-medium">{displayName}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{getStatusText()}</span>
      </button>
      
      {isExpanded && hasDetails && (
        <div className="px-3 pb-2 space-y-2">
          {args && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Arguments:</div>
              <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          
          {result && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Result:</div>
              <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                {typeof result === 'string' 
                  ? result 
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}