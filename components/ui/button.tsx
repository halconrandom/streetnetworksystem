import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-violet-500 text-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-violet-600 active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
      secondary: "bg-yellow-300 text-black border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-yellow-400 active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
      outline: "bg-[#fdfbf7] text-black border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#f4f1ea] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
      ghost: "bg-transparent text-slate-700 hover:text-black hover:bg-[#f4f1ea]",
      danger: "bg-rose-500 text-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-rose-600 active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
    }

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10 text-base",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-sans font-bold uppercase transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
