import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MessageSquare, Star } from "lucide-react";

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

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-elevated-surface/50",
        selected && "bg-elevated-surface border-l-2 border-l-primary"
      )}
      onClick={onClick}
    >
      {/* Avatar with status */}
      <div className="relative">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium", avatarColor)}>
          {fanName.charAt(0)}
        </div>
        {unread && (
          <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 truncate">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {fanName}
              </span>
              {lifecycle.includes("VIP") && (
                <Star className="h-3 w-3 text-warning fill-warning/20" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-xs text-text-secondary truncate">
                {platform}
              </span>
              <span className="text-xs text-text-tertiary">•</span>
              <span className="text-xs font-medium text-foreground">
                {formattedSpend}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-text-tertiary">{timestamp}</span>
            {safety !== "safe" && (
              <div className="flex items-center gap-0.5">
                {safety === "review" && <Clock className="h-2.5 w-2.5 text-warning" />}
                {safety === "blocked" && <MessageSquare className="h-2.5 w-2.5 text-danger" />}
                <span className="text-[10px] uppercase text-text-tertiary">
                  {safety}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Last message */}
        <p className="mt-2 text-sm text-text-secondary line-clamp-2">
          {lastMessage}
        </p>

        {/* Lifecycle badge */}
        <div className="mt-2">
          <Badge
            variant="subtle"
            size="sm"
            className="text-xs"
          >
            {lifecycle}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;