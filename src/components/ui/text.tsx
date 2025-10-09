import React from "react";
import { cn } from "../../lib/utils";

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "default" | "muted" | "large" | "medium";
  children: React.ReactNode;
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantClasses = {
      default: "text-foreground",
      muted: "text-muted-foreground",
      large: "text-lg font-medium",
      medium: "font-medium"
    };

    return (
      <p
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

Text.displayName = "Text";

export { Text };
