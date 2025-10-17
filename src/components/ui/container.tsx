import React from "react";
import { cn } from "../../lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "page" | "section" | "centered";
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = "page", children, ...props }, ref) => {
    const baseClasses = "bg-transparent";
    
    const variantClasses = {
      page: "flex flex-col items-center justify-center min-w-dvw min-h-dvh p-2",
      section: "w-full space-y-6",
      centered: "flex items-center justify-center"
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export { Container };
