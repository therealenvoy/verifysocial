import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, MessageSquare, Star, ChevronRight } from "lucide-react";

export interface ConversationItemProps {
  id: string;
  fanName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  spend: number;
  lifecycle: string;
  safety: string;
  platform: string;
  avatarColor: string;
  selected?: boolean;
  onClick?: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  fanName,
  lastMessage,
  timestamp,
  unread,
  spend,
  lifecycle,
  safety,
  platform,
  avatarColor,
  selected,
  onClick,
}) => {
  // Format spend
  const formattedSpend = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(spend);

  // Safety colors
  const safetyColor = {
    safe: "text-success",
    review: "text-warning",
    blocked: "text-danger",
  }[safety];

  // Lifecycle colors
  const lifecycleColor = {
    "High‑Intent": "text-primary",
    VIP: "text-warning",
    Warm: "text-success",
    Blocked: "text-danger",
  }[lifecycle] || "text-text-secondary";

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-start gap-3 p-3 transition-colors border-b border-subtle",
        selected 
          ? "bg-surface-elevated/30 border-l-2 border-l-primary" 
          : "hover:bg-surface-elevated/20"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded text-xs font-medium", avatarColor)}>
          {fanName.charAt(0)}
        </div>
        {unread && (
          <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface-panel" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 truncate">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium truncate",
                selected ? "text-foreground" : "text-text-secondary",
                unread && "font-semibold"
              )}>
                {fanName}
              </span>
              {lifecycle.includes("VIP") && (
                <Star className="h-3 w-3 text-warning fill-warning/20" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs">
              <span className="text-text-tertiary">{platform}</span>
              <span className="text-text-tertiary">•</span>
              <span className={cn("font-medium", lifecycleColor)}>
                {lifecycle}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="font-medium text-foreground">
                {formattedSpend}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-text-tertiary">{timestamp}</span>
            {safety !== "safe" && (
              <div className={cn("flex items-center gap-0.5 text-xs", safetyColor)}>
                {safety === "review" && <Clock className="h-2.5 w-2.5" />}
                {safety === "blocked" && <MessageSquare className="h-2.5 w-2.5" />}
                <span className="uppercase">{safety}</span>
              </div>
            )}
          </div>
        </div>

        {/* Last message */}
        <p className={cn(
          "mt-2 text-sm line-clamp-2",
          selected ? "text-text-secondary" : "text-text-tertiary",
          unread && "text-foreground font-medium"
        )}>
          {lastMessage}
        </p>

        {/* Metadata row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selected && (
              <ChevronRight className="h-3 w-3 text-primary" />
            )}
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-sm",
              safety === "safe" ? "bg-success/10 text-success" :
              safety === "review" ? "bg-warning/10 text-warning" :
              "bg-danger/10 text-danger"
            )}>
              {safety}
            </span>
          </div>
          {selected && (
            <span className="text-xs text-text-tertiary">
              Click to reply
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;