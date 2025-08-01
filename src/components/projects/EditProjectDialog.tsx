'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
// Optimized icon imports
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  budget_amount?: number;
  progress_percentage?: number;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdated: () => void;
  onDeleteProject?: (project: Project) => void;
}

interface EditForm {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_amount: string;
  progress_percentage: string;
}

export function EditProjectDialog({ 
  open, 
  onOpenChange, 
  project, 
  onProjectUpdated,
  onDeleteProject 
}: EditProjectDialogProps) {
  const { getAccessToken, profile } = useAuth();
  const { hasPermission } = usePermissions();
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    description: '',
    status: '',
    start_date: '',
    end_date: '',
    location: '',
    budget_amount: '',
    progress_percentage: ''
  });

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        location: project.location || '',
        budget_amount: project.budget_amount?.toString() || '',
        progress_percentage: project.progress_percentage?.toString() || ''
      });
    }
  }, [project]);

  const handleUpdateProject = async () => {
    if (!project) return;

    setIsUpdating(true);
    try {
      const token = await getAccessToken();
      
      if (!token) {
        console.error('❌ No access token available');
        return;
      }
      
      console.log('🔑 [Update Project] Got access token, making request...', {
        projectId: project.id,
        updateData: {
          name: editForm.name,
          description: editForm.description,
          status: editForm.status,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          location: editForm.location,
          budget_amount: editForm.budget_amount ? parseFloat(editForm.budget_amount) : null,
          progress_percentage: editForm.progress_percentage ? parseInt(editForm.progress_percentage) : null
        }
      });

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          status: editForm.status,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          location: editForm.location,
          budget_amount: editForm.budget_amount ? parseFloat(editForm.budget_amount) : null,
          progress_percentage: editForm.progress_percentage ? parseInt(editForm.progress_percentage) : null
        })
      });

      console.log('📡 [Update Project] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        onOpenChange(false);
        onProjectUpdated(); // Refresh the projects list
        console.log('✅ Project updated successfully');
      } else {
        let errorText = '';
        let errorData = {};
        try {
          errorText = await response.text();
          console.log('📄 [Update Project] Raw error response:', errorText);
          
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch (parseError) {
              console.log('📄 [Update Project] Failed to parse JSON, using text:', parseError);
              errorData = { message: errorText };
            }
          } else {
            errorData = { message: 'Empty response body' };
          }
        } catch (textError) {
          console.error('📄 [Update Project] Failed to read response text:', textError);
          errorData = { message: 'Failed to read response' };
        }
        
        console.error('❌ Failed to update project:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          errorData
        });
      }
    } catch (error) {
      console.error('❌ Error updating project:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    if (project && onDeleteProject) {
      console.log('🗑️ [Edit Modal Delete] Delete button clicked', {
        hasDeletePermission: hasPermission('projects.delete'),
        userRole: profile?.role,
        selectedProject: project.name
      });
      onDeleteProject(project);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Enter project name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Enter project description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={editForm.start_date}
                onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder="Project location"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget_amount">Budget ($)</Label>
              <Input
                id="budget_amount"
                type="number"
                value={editForm.budget_amount}
                onChange={(e) => setEditForm({ ...editForm, budget_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="progress_percentage">Progress (%)</Label>
              <Input
                id="progress_percentage"
                type="number"
                min="0"
                max="100"
                value={editForm.progress_percentage}
                onChange={(e) => setEditForm({ ...editForm, progress_percentage: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {onDeleteProject && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              className="mr-auto"
              title={`Delete Permission: ${hasPermission('projects.delete')} (Role: ${profile?.role})`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}