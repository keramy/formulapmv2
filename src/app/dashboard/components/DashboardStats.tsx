'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { FolderOpen, CheckSquare, Users, DollarSign, AlertTriangle, Clock } from 'lucide-react';

interface DashboardStatsData {
  totalProjects: number;
  activeProjects: number;
  totalScopeItems: number;
  completedScopeItems: number;
  overdueScopeItems: number;
  teamMembers: number;
  budget: number;
  permissions: {
    canViewProjects: boolean;
    canViewUsers: boolean;
    canViewFinancials: boolean;
  };
}

export function DashboardStats() {
  const { getAccessToken, isAuthenticated, user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Enhanced authentication readiness check
      if (!isAuthenticated || !user || !profile) {
        console.log('🔐 [DashboardStats] Not fully authenticated:', { 
          isAuthenticated, 
          hasUser: !!user, 
          hasProfile: !!profile 
        });
        setLoading(false); // Stop loading when auth is incomplete
        return;
      }

      // Additional check: ensure profile has required fields
      if (!profile.is_active || !profile.role) {
        console.log('🔐 [DashboardStats] Invalid profile:', { 
          isActive: profile.is_active, 
          role: profile.role 
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);

        // Get access token for authenticated API call
        const token = await getAccessToken();
        console.log('🔐 [DashboardStats] Token check:', { 
          hasToken: !!token, 
          tokenLength: token?.length,
          userId: user?.id
        });
        if (!token) {
          console.log('🔐 [DashboardStats] No token available');
          return;
        }

        // Fetch stats from authenticated API endpoint
        const response = await fetch('/api/dashboard/comprehensive-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('🔐 [DashboardStats] 401 Unauthorized - User profile might be missing or inactive');
            console.error('🔐 [DashboardStats] User details:', {
              userId: user?.id,
              userEmail: user?.email,
              profileId: profile?.id,
              profileRole: profile?.role,
              profileActive: profile?.is_active
            });
          }
          // Get detailed error from server response
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`;
            }
            console.error('📊 [DashboardStats] API Error Details:', errorData);
          } catch (parseError) {
            console.error('📊 [DashboardStats] Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }

        const statsData = await response.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isAuthenticated, user, profile, getAccessToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      total: stats.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      show: stats.permissions.canViewProjects
    },
    {
      title: 'Scope Items Completed',
      value: stats.completedScopeItems,
      total: stats.totalScopeItems,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      show: stats.permissions.canViewProjects
    },
    {
      title: 'Overdue Items',
      value: stats.overdueScopeItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      show: stats.permissions.canViewProjects
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      show: stats.permissions.canViewUsers
    },
    {
      title: 'Total Budget',
      value: `$${(stats.budget / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      show: stats.permissions.canViewFinancials
    }
  ].filter(card => card.show);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              {stat.total !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  of {stat.total} total
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}