import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status badges
        planning: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        active: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        "on-hold": "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        completed: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        cancelled: "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        todo: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        "in-progress": "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        review: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        done: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        // Role badges
        management: "border-transparent bg-management/10 text-management border-management/20",
        project: "border-transparent bg-project/10 text-project border-project/20",
        technical: "border-transparent bg-technical/10 text-technical border-technical/20",
        purchase: "border-transparent bg-purchase/10 text-purchase border-purchase/20",
        field: "border-transparent bg-field/10 text-field border-field/20",
        client: "border-transparent bg-client/10 text-client border-client/20",
        external: "border-transparent bg-external/10 text-external border-external/20",
      },
    },
    defaultVariants: {
      variant: "default",
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