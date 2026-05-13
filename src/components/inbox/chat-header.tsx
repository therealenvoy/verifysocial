import * as React from "react";
import { cn } from "@/lib/utils";
import { MoreVertical, Shield, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  fanName: string;
  platform: string;
  spend: number;
  timestamp: string;
  avatarColor: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  fanName,
  platform,
  spend,
  timestamp,
  avatarColor,
}) => {
  const formattedSpend = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(spend);

  return (
    <div className="border-b border-subtle px-6 py-3 bg-surface-panel/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded", avatarColor)}>
            <span className="text-xs font-medium">{fanName.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-heading-2 font-medium tracking-tight">{fanName}</h2>
              {spend > 200 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Zap className="h-2.5 w-2.5" />
                  VIP
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary">
              <span className="font-mono uppercase tracking-wider">{platform}</span>
              <span className="text-border-medium">•</span>
              <span className="font-medium text-text-secondary">{formattedSpend}</span>
              <span className="text-border-medium">•</span>
              <span>{timestamp}</span>
              <span className="text-border-medium">•</span>
              <span className="inline-flex items-center gap-1 text-success">
                <Shield className="h-2.5 w-2.5" />
                Safe
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-text-tertiary hover:text-foreground hover:bg-surface-elevated"
          >
            <Star className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-text-tertiary hover:text-foreground hover:bg-surface-elevated"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;