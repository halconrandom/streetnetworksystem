import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border-2 border-black bg-[#fdfbf7] px-3 py-2 text-base font-sans font-medium text-black placeholder:text-slate-400 focus-visible:outline-none focus-visible:shadow-[4px_4px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-75",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
