import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white shadow-sm hover:bg-brand-600",
        destructive:
          "bg-red-600 text-white shadow-xs hover:bg-red-700",
        outline:
          "border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900",
        secondary:
          "bg-gray-100 text-gray-700 shadow-xs hover:bg-gray-200",
        ghost:
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        "ghost-destructive":
          "text-red-600 hover:bg-red-50 hover:text-red-700",
        link:
          "text-brand-600 underline-offset-4 hover:underline hover:text-brand-700",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-xs": "h-6 w-6",
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
