import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#f4f1ea] text-slate-800 border-black",
    success: "bg-emerald-300 text-black border-black",
    warning: "bg-yellow-300 text-black border-black",
    danger: "bg-rose-400 text-black border-black",
    outline: "bg-[#fdfbf7] border-black text-black",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center border-2 px-2.5 py-0.5 text-xs font-sans font-bold uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
