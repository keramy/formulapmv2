'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  DollarSign, 
  ClipboardCheck, 
  AlertTriangle 
} from 'lucide-react';

interface StatsData {
  activeProjects: number;
  totalBudget: number;
  actualSpent: number;
  pendingApprovals: number;
  atRiskProjects: number;
}

export function GlobalStatsCards() {
  const [stats, setStats] = useState<StatsData>({
    activeProjects: 0,
    totalBudget: 0,
    actualSpent: 0,
    pendingApprovals: 0,
    atRiskProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyStats();
  }, []);

  const fetchCompanyStats = async () => {
    try {
      // Fetch active projects count and budget data
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, budget, actual_cost, status, end_date')
        .in('status', ['active', 'planning', 'bidding']);

      if (projectError) throw projectError;

      // Calculate stats from projects
      const activeCount = projects?.filter(p => p.status === 'active').length || 0;
      const totalBudget = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
      const actualSpent = projects?.reduce((sum, p) => sum + (p.actual_cost || 0), 0) || 0;
      
      // Calculate at-risk projects (budget overrun or past deadline)
      const today = new Date();
      const atRiskCount = projects?.filter(p => {
        const isOverBudget = p.actual_cost > p.budget * 0.9; // 90% budget threshold
        const isPastDeadline = p.end_date && new Date(p.end_date) < today && p.status === 'active';
        return isOverBudget || isPastDeadline;
      }).length || 0;

      // Fetch pending approvals count
      const { count: approvalCount, error: approvalError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'review');

      if (approvalError) throw approvalError;

      setStats({
        activeProjects: activeCount,
        totalBudget,
        actualSpent,
        pendingApprovals: approvalCount || 0,
        atRiskProjects: atRiskCount
      });
    } catch (error) {
      console.error('Error fetching company stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateBudgetPercentage = () => {
    if (stats.totalBudget === 0) return 0;
    return Math.round((stats.actualSpent / stats.totalBudget) * 100);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const budgetPercentage = calculateBudgetPercentage();
  const budgetStatus = budgetPercentage > 80 ? 'text-red-600' : budgetPercentage > 60 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Projects Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeProjects}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      {/* Budget vs Actuals Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget vs Actual</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.actualSpent)}</div>
          <p className="text-xs text-muted-foreground">
            of {formatCurrency(stats.totalBudget)} budget
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span>Spent</span>
              <span className={budgetStatus}>{budgetPercentage}%</span>
            </div>
            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  budgetPercentage > 80 ? 'bg-red-500' : 
                  budgetPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          <p className="text-xs text-muted-foreground">Awaiting review</p>
        </CardContent>
      </Card>

      {/* At-Risk Projects Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">At-Risk Projects</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.atRiskProjects > 0 ? 'text-red-600' : ''}`}>
            {stats.atRiskProjects}
          </div>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </CardContent>
      </Card>
    </div>
  );
}