import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger" | "muted";
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = "md",
  color = "primary",
  showLabel = false,
  labelPosition = "outside",
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    muted: "bg-muted-foreground",
  };

  const labelColorClasses = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-text-tertiary",
  };

  const bar = (
    <div className={cn("w-full rounded-full bg-elevated-surface", sizeClasses[size], className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          colorClasses[color]
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );

  if (!showLabel) {
    return bar;
  }

  if (labelPosition === "inside") {
    return (
      <div className="relative">
        {bar}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-medium",
            labelColorClasses[color]
          )}
        >
          {clampedValue}%
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className={cn("font-medium", labelColorClasses[color])}>Progress</span>
        <span className="text-text-secondary">{clampedValue}%</span>
      </div>
      {bar}
    </div>
  );
};

export { ProgressBar };