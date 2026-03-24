import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function Spinner({ className, size = "sm" }: SpinnerProps) {
  const sizeClass = {
    xs: "w-3 h-3 border",
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
  }[size];

  return (
    <div
      className={cn(
        "rounded-full border-current/25 border-t-current animate-spin shrink-0",
        sizeClass,
        className
      )}
    />
  );
}
