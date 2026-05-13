import * as React from "react";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
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
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", avatarColor)}>
            <span className="text-sm font-medium">{fanName.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-heading-2 font-medium">{fanName}</h2>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-text-secondary">
              <span>{platform}</span>
              <span>•</span>
              <span className="font-medium">{formattedSpend}</span>
              <span>•</span>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;