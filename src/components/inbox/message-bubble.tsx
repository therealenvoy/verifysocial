import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface MessageBubbleProps {
  sender: string;
  text: string;
  timestamp: string;
  confidence?: string;
  safety?: string;
  mode?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  sender,
  text,
  timestamp,
  confidence,
  safety,
  mode,
}) => {
  const isAI = sender === "ai";

  return (
    <div className={cn("flex", isAI ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%]">
        <div
          className={cn(
            "rounded-xl p-4",
            isAI
              ? "bg-primary/5 border border-primary/10"
              : "bg-surface border border-border"
          )}
        >
          <p className="text-sm text-foreground">{text}</p>
          {/* Metadata for AI messages */}
          {isAI && (confidence || safety || mode) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {confidence && (
                <Badge
                  variant="subtle"
                  size="sm"
                  className="gap-1 text-xs"
                  withDot
                  dotColor={
                    confidence === "high"
                      ? "var(--success)"
                      : confidence === "medium"
                      ? "var(--warning)"
                      : "var(--muted-foreground)"
                  }
                >
                  {confidence}
                </Badge>
              )}
              {safety && (
                <Badge
                  variant="subtle"
                  size="sm"
                  className="gap-1 text-xs"
                  withDot
                  dotColor={
                    safety === "passed"
                      ? "var(--success)"
                      : "var(--warning)"
                  }
                >
                  {safety === "passed" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {safety.replace("-", " ")}
                </Badge>
              )}
              {mode && (
                <Badge variant="outline" size="sm" className="text-xs">
                  {mode}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "mt-1 text-xs text-text-tertiary",
            isAI ? "text-right" : "text-left"
          )}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;