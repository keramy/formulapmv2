'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

// Enhanced Dashboard Widget Component
interface DashboardWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  description?: string;
  actionLabel?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'text-gray-600',
    value: 'text-gray-900'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    value: 'text-green-900'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    value: 'text-yellow-900'
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    value: 'text-red-900'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    value: 'text-blue-900'
  }
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-3 h-3" />;
    case 'down':
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <Minus className="w-3 h-3" />;
  }
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  value,
  change,
  icon,
  loading = false,
  onClick,
  variant = 'default',
  description,
  actionLabel
}) => {
  const styles = variantStyles[variant];

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        styles.bg,
        styles.border,
        onClick && "cursor-pointer hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className={cn("text-2xl font-bold", styles.value)}>{value}</p>
              {change && (
                <div className={cn(
                  "flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full",
                  change.trend === 'up' && "bg-green-100 text-green-700",
                  change.trend === 'down' && "bg-red-100 text-red-700",
                  change.trend === 'neutral' && "bg-gray-100 text-gray-700"
                )}>
                  <TrendIcon trend={change.trend} />
                  <span>{Math.abs(change.value)}%</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
            {change && (
              <p className="text-xs text-gray-500">vs {change.period}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center",
              styles.bg,
              styles.icon
            )}>
              {icon}
            </div>
          )}
        </div>
        {onClick && actionLabel && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Project Status Widget
interface ProjectStatusWidgetProps {
  status: 'active' | 'completed' | 'on_hold' | 'cancelled' | 'planning';
  tasksCompleted: number;
  totalTasks: number;
  daysRemaining?: number;
  onClick?: () => void;
}

export const ProjectStatusWidget: React.FC<ProjectStatusWidgetProps> = ({
  status,
  tasksCompleted,
  totalTasks,
  daysRemaining,
  onClick
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          variant: 'info' as const,
          icon: <Clock className="w-6 h-6" />,
          label: 'Active',
          description: 'Project in progress'
        };
      case 'completed':
        return {
          variant: 'success' as const,
          icon: <CheckCircle className="w-6 h-6" />,
          label: 'Completed',
          description: 'Project finished'
        };
      case 'on_hold':
        return {
          variant: 'warning' as const,
          icon: <AlertTriangle className="w-6 h-6" />,
          label: 'On Hold',
          description: 'Project paused'
        };
      case 'cancelled':
        return {
          variant: 'danger' as const,
          icon: <AlertTriangle className="w-6 h-6" />,
          label: 'Cancelled',
          description: 'Project cancelled'
        };
      default:
        return {
          variant: 'default' as const,
          icon: <Users className="w-6 h-6" />,
          label: 'Planning',
          description: 'Project in planning'
        };
    }
  };

  const config = getStatusConfig(status);
  const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  return (
    <DashboardWidget
      title="Project Status"
      value={config.label}
      icon={config.icon}
      variant={config.variant}
      description={`${completionRate}% complete • ${tasksCompleted}/${totalTasks} tasks`}
      onClick={onClick}
      actionLabel={onClick ? "View details" : undefined}
    />
  );
};

// Team Widget
interface TeamWidgetProps {
  memberCount: number;
  activeMembers: number;
  recentActivity?: string;
  onClick?: () => void;
}

export const TeamWidget: React.FC<TeamWidgetProps> = ({
  memberCount,
  activeMembers,
  recentActivity,
  onClick
}) => {
  return (
    <DashboardWidget
      title="Team Members"
      value={memberCount}
      icon={<Users className="w-6 h-6" />}
      variant={memberCount > 0 ? 'success' : 'default'}
      description={memberCount > 0 ? `${activeMembers} active members` : "No team members yet"}
      onClick={onClick}
      actionLabel={onClick ? "Manage team" : undefined}
    />
  );
};

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", className)}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-300",
            progress < 25 ? "text-red-500" :
            progress < 50 ? "text-orange-500" :
            progress < 75 ? "text-yellow-500" :
            progress < 100 ? "text-blue-500" :
            "text-green-500"
          )}
          strokeLinecap="round"
        />
      </svg>
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-900">{progress}%</span>
      </div>
    </div>
  );
};