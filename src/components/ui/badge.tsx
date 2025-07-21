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
        // Project Status badges
        planning: "border-transparent bg-project-planning/10 text-project-planning border-project-planning/20",
        active: "border-transparent bg-project-active/10 text-project-active border-project-active/20",
        bidding: "border-transparent bg-project-bidding/10 text-project-bidding border-project-bidding/20",
        "on-hold": "border-transparent bg-project-on-hold/10 text-project-on-hold border-project-on-hold/20",
        completed: "border-transparent bg-project-completed/10 text-project-completed border-project-completed/20",
        cancelled: "border-transparent bg-project-cancelled/10 text-project-cancelled border-project-cancelled/20",
        
        // Task Status badges
        pending: "border-transparent bg-task-pending/10 text-task-pending border-task-pending/20",
        "in-progress": "border-transparent bg-task-in-progress/10 text-task-in-progress border-task-in-progress/20",
        review: "border-transparent bg-task-review/10 text-task-review border-task-review/20",
        done: "border-transparent bg-task-completed/10 text-task-completed border-task-completed/20",
        blocked: "border-transparent bg-task-blocked/10 text-task-blocked border-task-blocked/20",
        
        // Priority badges
        "priority-low": "border-transparent bg-priority-low/10 text-priority-low border-priority-low/20",
        "priority-medium": "border-transparent bg-priority-medium/10 text-priority-medium border-priority-medium/20",
        "priority-high": "border-transparent bg-priority-high/10 text-priority-high border-priority-high/20",
        "priority-urgent": "border-transparent bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20",
        
        // Scope Category badges
        "scope-construction": "border-transparent bg-scope-construction/10 text-scope-construction border-scope-construction/20",
        "scope-millwork": "border-transparent bg-scope-millwork/10 text-scope-millwork border-scope-millwork/20",
        "scope-electrical": "border-transparent bg-scope-electrical/10 text-scope-electrical border-scope-electrical/20",
        "scope-mechanical": "border-transparent bg-scope-mechanical/10 text-scope-mechanical border-scope-mechanical/20",
        
        // Risk Level badges
        "risk-low": "border-transparent bg-risk-low/10 text-risk-low border-risk-low/20",
        "risk-medium": "border-transparent bg-risk-medium/10 text-risk-medium border-risk-medium/20",
        "risk-high": "border-transparent bg-risk-high/10 text-risk-high border-risk-high/20",
        
        // Role badges - Updated 6-Role System
        management: "border-transparent bg-management/10 text-management border-management/20",
        purchase: "border-transparent bg-purchase/10 text-purchase border-purchase/20",
        technical: "border-transparent bg-technical/10 text-technical border-technical/20",
        project: "border-transparent bg-project/10 text-project border-project/20",
        client: "border-transparent bg-client/10 text-client border-client/20",
        admin: "border-transparent bg-admin/10 text-admin border-admin/20",
        
        // Status badges - Semantic system
        "status-success": "border-transparent bg-status-success/10 text-status-success border-status-success/20",
        "status-warning": "border-transparent bg-status-warning/10 text-status-warning border-status-warning/20",
        "status-info": "border-transparent bg-status-info/10 text-status-info border-status-info/20",
        "status-danger": "border-transparent bg-status-danger/10 text-status-danger border-status-danger/20",
        
        // Shop Drawing Status badges
        "shop-pending": "border-transparent bg-task-pending/10 text-task-pending border-task-pending/20",
        "shop-under-review": "border-transparent bg-task-review/10 text-task-review border-task-review/20",
        "shop-approved": "border-transparent bg-status-success/10 text-status-success border-status-success/20",
        "shop-rejected": "border-transparent bg-status-danger/10 text-status-danger border-status-danger/20",
        "shop-revision-required": "border-transparent bg-status-warning/10 text-status-warning border-status-warning/20",
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