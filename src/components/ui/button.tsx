import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/92 hover:shadow-sm",
        accent:
          "bg-accent text-accent-foreground shadow-xs hover:bg-accent/92 hover:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        soft:
          "bg-primary/10 text-primary hover:bg-primary/18 font-medium",
        neutral:
          "bg-muted text-foreground hover:bg-muted/80",
        outline:
          "border border-input bg-card shadow-2xs hover:bg-muted/50 hover:text-foreground",
        ghost:
          "hover:bg-muted/60 hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
