'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  FileText,
  Calendar,
  Download,
  Filter,
  Search,
  DollarSign,
  Clock,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'operational' | 'project' | 'client';
  icon: React.ComponentType<{ className?: string }>;
  lastGenerated?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on-demand';
  permission: string;
  featured?: boolean;
}

const reportCategories = [
  { id: 'all', label: 'All Reports', icon: FileText },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'operational', label: 'Operational', icon: Activity },
  { id: 'project', label: 'Project', icon: Building },
  { id: 'client', label: 'Client', icon: Users }
];

const availableReports: ReportCard[] = [
  {
    id: 'project-overview',
    title: 'Project Overview Dashboard',
    description: 'Comprehensive overview of all active projects with key metrics',
    category: 'project',
    icon: BarChart3,
    lastGenerated: '2024-01-15',
    frequency: 'daily',
    permission: 'reports.read.all',
    featured: true
  },
  {
    id: 'financial-summary',
    title: 'Financial Summary',
    description: 'Revenue, expenses, and profit analysis across all projects',
    category: 'financial',
    icon: DollarSign,
    lastGenerated: '2024-01-14',
    frequency: 'weekly',
    permission: 'reports.read.financial',
    featured: true
  },
  {
    id: 'task-completion',
    title: 'Task Completion Analysis',
    description: 'Track task completion rates and identify bottlenecks',
    category: 'operational',
    icon: CheckCircle,
    lastGenerated: '2024-01-15',
    frequency: 'weekly',
    permission: 'reports.read.all'
  },
  {
    id: 'client-satisfaction',
    title: 'Client Satisfaction Report',
    description: 'Client feedback and satisfaction metrics',
    category: 'client',
    icon: Users,
    lastGenerated: '2024-01-10',
    frequency: 'monthly',
    permission: 'reports.read.client'
  },
  {
    id: 'budget-variance',
    title: 'Budget Variance Analysis',
    description: 'Compare actual vs. budgeted costs across projects',
    category: 'financial',
    icon: TrendingUp,
    lastGenerated: '2024-01-12',
    frequency: 'monthly',
    permission: 'reports.read.financial'
  },
  {
    id: 'resource-utilization',
    title: 'Resource Utilization',
    description: 'Track team utilization and resource allocation',
    category: 'operational',
    icon: Activity,
    lastGenerated: '2024-01-13',
    frequency: 'weekly',
    permission: 'reports.read.all'
  },
  {
    id: 'project-timeline',
    title: 'Project Timeline Report',
    description: 'Track project milestones and identify delays',
    category: 'project',
    icon: Clock,
    lastGenerated: '2024-01-14',
    frequency: 'weekly',
    permission: 'reports.read.all'
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment Report',
    description: 'Identify and track project risks and mitigation strategies',
    category: 'project',
    icon: AlertTriangle,
    lastGenerated: '2024-01-11',
    frequency: 'monthly',
    permission: 'reports.read.all'
  }
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = availableReports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const hasReportPermission = user && hasPermission(report.permission as any);
    return matchesCategory && matchesSearch && hasReportPermission;
  });

  const featuredReports = filteredReports.filter(report => report.featured);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-yellow-100 text-yellow-800';
      case 'quarterly': return 'bg-purple-100 text-purple-800';
      case 'on-demand': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      case 'client': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Please log in to view reports.</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('projects.read.all') && !hasPermission('financials.view')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate insights and track performance across your projects</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Featured Reports */}
      {featuredReports.length > 0 && selectedCategory === 'all' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Featured Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getCategoryColor(report.category)}>
                            {report.category}
                          </Badge>
                          <Badge variant="outline" className={getFrequencyColor(report.frequency)}>
                            {report.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    {report.lastGenerated && (
                      <p className="text-xs text-gray-500 mb-4">
                        Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Generate Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Reports */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {selectedCategory === 'all' ? 'All Reports' : `${reportCategories.find(cat => cat.id === selectedCategory)?.label} Reports`}
        </h2>
        
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'No reports available for the selected category.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getCategoryColor(report.category)}>
                            {report.category}
                          </Badge>
                          <Badge variant="outline" className={getFrequencyColor(report.frequency)}>
                            {report.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    {report.lastGenerated && (
                      <p className="text-xs text-gray-500 mb-4">
                        Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Generate Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}