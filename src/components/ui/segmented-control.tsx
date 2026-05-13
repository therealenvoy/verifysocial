import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps<T>) => {
  const sizeClasses = {
    sm: "h-7 text-xs",
    md: "h-9 text-sm",
    lg: "h-11 text-base",
  };

  return (
    <div
      className={cn(
        "inline-flex rounded-md bg-elevated-surface p-0.5",
        sizeClasses[size],
        className
      )}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "flex items-center justify-center rounded-md px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-text-secondary hover:text-foreground"
          )}
          onClick={() => onChange(option.value)}
          style={{
            marginLeft: index === 0 ? 0 : "-1px",
            zIndex: value === option.value ? 1 : 0,
          }}
        >
          {option.icon && <span className="mr-2">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
};

export { SegmentedControl };
export type { SegmentedControlOption };