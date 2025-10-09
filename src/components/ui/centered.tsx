import React from "react";
import { cn } from "../../lib/utils";

interface CenteredProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Centered = React.forwardRef<HTMLDivElement, CenteredProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Centered.displayName = "Centered";

export { Centered };
