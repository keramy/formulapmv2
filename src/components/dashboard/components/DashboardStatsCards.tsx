'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Optimized icon imports
import Building from 'lucide-react/dist/esm/icons/building';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';

interface DashboardStats {
  totalPortfolioValue: number;
  activeProjectValue: number;
  revenueGenerated: number;
  taskCompletion: number;
  overallProgress: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
}

interface DashboardStatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export function DashboardStatsCards({ stats, loading }: DashboardStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₺${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₺${(amount / 1000).toFixed(0)}K`;
    }
    return `₺${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Total Portfolio Value */}
      <Card className="border-l-4 border-l-slate-600 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
          <Building className="h-5 w-5 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.totalPortfolioValue || 0)}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <ArrowUp className="h-3 w-3" />
            {stats?.totalProjects || 0} total projects
          </p>
        </CardContent>
      </Card>

      {/* Active Project Value */}
      <Card className="border-l-4 border-l-blue-600 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Project Value</CardTitle>
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.activeProjectValue || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.activeProjects || 0} projects in progress
          </p>
        </CardContent>
      </Card>

      {/* Revenue Generated */}
      <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Revenue Generated</CardTitle>
          <DollarSign className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.revenueGenerated || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            From completed work
          </p>
        </CardContent>
      </Card>

      {/* Task Completion */}
      <Card className="border-l-4 border-l-orange-600 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Task Completion</CardTitle>
          <CheckCircle className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.taskCompletion || 0}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Work orders completed
          </p>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card className="border-l-4 border-l-purple-600 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.overallProgress || 0}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Average completion rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}