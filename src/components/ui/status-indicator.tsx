import React from "react";
import { cn } from "../../lib/utils";

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "online" | "offline" | "away";
  size?: "sm" | "md" | "lg";
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status = "online", size = "sm", ...props }, ref) => {
    const statusClasses = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500"
    };

    const sizeClasses = {
      sm: "w-2 h-2",
      md: "w-3 h-3",
      lg: "w-4 h-4"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full",
          statusClasses[status],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator };
