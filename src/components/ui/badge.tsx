
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        green: "border-transparent bg-green-500 text-white hover:bg-green-600",
        purple: "border-transparent bg-purple-500 text-white hover:bg-purple-600",
        red: "border-transparent bg-red-500 text-white hover:bg-red-600",
        yellow: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "purple",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
