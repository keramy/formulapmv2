/**
 * Client Dashboard Actions Component
 * 
 * Handles interactive dashboard actions that require client-side state
 * Separate from server components to maintain performance benefits
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, FileText, FolderPlus, UserPlus } from 'lucide-react';

interface ClientDashboardActionsProps {
  userId: string;
  role: string;
}

export function ClientDashboardActions({ userId, role }: ClientDashboardActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const canCreateProjects = ['company_owner', 'admin', 'general_manager', 'technical_director'].includes(role);
  const canCreateUsers = ['company_owner', 'admin'].includes(role);

  return (
    <div className="flex items-center gap-2">
      {/* Quick Action - Create Project */}
      {canCreateProjects && (
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      )}

      {/* More Actions Dropdown */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canCreateProjects && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/projects/new" className="w-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scope" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Scope
                </Link>
              </DropdownMenuItem>
            </>
          )}
          
          {canCreateUsers && (
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=users" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link href="/reports" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              View Reports
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}