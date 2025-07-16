'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { DataStateWrapper } from '@/components/ui/loading-states';
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
  const { getAccessToken, isAuthenticated, user, profile } = useAuth();

  useEffect(() => {
    // Enhanced authentication check
    if (isAuthenticated && user && profile && profile.is_active) {
      fetchCompanyStats();
    } else {
      console.log('🔐 [GlobalStatsCards] Not ready for API call:', {
        isAuthenticated,
        hasUser: !!user,
        hasProfile: !!profile,
        profileActive: profile?.is_active
      });
      setLoading(false);
    }
  }, [isAuthenticated, user, profile]);

  const fetchCompanyStats = async () => {
    try {
      // Get access token for authenticated API call
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Fetch stats from authenticated API endpoint
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Get detailed error from server response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`;
          }
          console.error('📈 [GlobalStatsCards] API Error Details:', errorData);
        } catch (parseError) {
          console.error('📈 [GlobalStatsCards] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const stats = await response.json();
      setStats(stats);
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

  return (
    <DataStateWrapper
      loading={loading}
      error={null}
      data={stats}
      onRetry={() => window.location.reload()}
      loadingComponent={
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
      }
      emptyComponent={
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No company statistics available</h3>
            <p className="text-gray-600">Statistics will appear once you have active projects</p>
          </CardContent>
        </Card>
      }
    >
      {(() => {
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
      })()}
    </DataStateWrapper>
  );
}

/**
 * Enhanced GlobalStatsCards with DataStateWrapper integration
 * This provides consistent loading states and error handling for global statistics
 */
export function GlobalStatsCardsEnhanced() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) {
      setError('User authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/comprehensive-stats');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch global statistics';
      setError(errorMessage);
      console.error('Error fetching global stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const calculateBudgetPercentage = () => {
    if (!stats || stats.totalBudget === 0) return 0;
    return Math.round((stats.actualSpent / stats.totalBudget) * 100);
  };

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={stats}
      onRetry={fetchStats}
      emptyComponent={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground">No global statistics available</div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.actualSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculateBudgetPercentage()}% of ${stats.totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pendingApprovals > 0 ? 'text-yellow-600' : ''}`}>
                {stats.pendingApprovals}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

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
      )}
    </DataStateWrapper>
  );
}