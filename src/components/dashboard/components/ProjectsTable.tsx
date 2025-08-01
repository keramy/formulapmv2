'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
// Optimized icon imports
import Building from 'lucide-react/dist/esm/icons/building';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';

interface Project {
  id: string;
  name: string;
  status: string;
  project_type?: string;
  budget_amount: number;
  actual_cost: number;
  start_date: string;
  end_date?: string;
  progress_percentage: number;
  location?: string;
  project_manager?: {
    first_name: string;
    last_name: string;
  };
}

interface ProjectsTableProps {
  projects: Project[];
  loading: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  totalProjects: number;
}

export function ProjectsTable({ 
  projects, 
  loading, 
  sortField, 
  sortDirection, 
  onSort,
  totalProjects 
}: ProjectsTableProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₺${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₺${(amount / 1000).toFixed(0)}K`;
    }
    return `₺${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on-tender': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Projects Summary ({totalProjects})
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Overview of all construction projects
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Badge variant="secondary">All</Badge>
            <Badge variant="outline">Active</Badge>
            <Badge variant="outline">Completed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Project Name
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('budget_amount')}
                >
                  <div className="flex items-center gap-2">
                    Budget
                    {sortField === 'budget_amount' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('start_date')}
                >
                  <div className="flex items-center gap-2">
                    Start Date
                    {sortField === 'start_date' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('end_date')}
                >
                  <div className="flex items-center gap-2">
                    Deadline
                    {sortField === 'end_date' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Due</th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('progress_percentage')}
                >
                  <div className="flex items-center gap-2">
                    Progress
                    {sortField === 'progress_percentage' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading rows for table
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div>
                          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                    <td className="py-4 px-4"><div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : (
                projects.map((project) => {
                const daysRemaining = getDaysRemaining(project.end_date || '');
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                const isNearDeadline = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
                
                return (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          {project.location && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {project.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(project.status)} text-xs font-medium`}
                      >
                        {project.status?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {project.project_type || 'Management'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(project.budget_amount || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(project.start_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'TBD'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {daysRemaining !== null && (
                        <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                          isOverdue 
                            ? 'bg-red-100 text-red-700'
                            : isNearDeadline 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isOverdue ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Overdue by {Math.abs(daysRemaining)} days
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              {daysRemaining} days left
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Progress 
                            value={project.progress_percentage || 0} 
                            className="h-2"
                            style={{
                              backgroundColor: '#f3f4f6',
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                          {project.progress_percentage || 0}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.floor((project.progress_percentage || 0) / 20)} / 5 tasks
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              Start by creating your first construction project.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}