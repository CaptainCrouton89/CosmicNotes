"use client";

import { Loader2, CheckCircle2, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { type ToolInvocation as ToolInvocationType } from "ai";
import { useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const result = toolInvocation.state === "result" ? toolInvocation.result : null;
  const hasDetails = toolInvocation.args || result;

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
          {toolInvocation.args && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Arguments:</div>
              <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(toolInvocation.args, null, 2)}
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