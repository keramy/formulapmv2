'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
// Optimized icon imports
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';

interface Project {
  id: string;
  name: string;
}

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectDeleted: () => void;
}

export function DeleteProjectDialog({ 
  open, 
  onOpenChange, 
  project, 
  onProjectDeleted 
}: DeleteProjectDialogProps) {
  const { getAccessToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      
      if (!token) {
        console.error('❌ No access token available for delete');
        return;
      }
      
      console.log('🔑 [Delete Project] Got access token, making request...');

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 [Delete Project] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        let result;
        try {
          const responseText = await response.text();
          console.log('📄 [Delete Project] Raw response text:', responseText);
          
          if (responseText) {
            result = JSON.parse(responseText);
            console.log('📋 [Delete Project] Parsed response data:', result);
          } else {
            console.error('❌ [Delete Project] Empty response body from server');
            result = { success: false, error: 'Empty response body' };
          }
        } catch (parseError) {
          console.error('❌ [Delete Project] Failed to parse response as JSON:', parseError);
          result = { success: false, error: 'Invalid JSON response' };
        }
        
        if (result.success) {
          onOpenChange(false);
          onProjectDeleted(); // Refresh the projects list
          console.log('✅ Project deleted successfully:', result.data?.deleted_project?.name);
        } else {
          console.error('❌ Delete operation failed:', result.error || 'Unknown error');
        }
      } else {
        let errorText = '';
        let errorData = {};
        try {
          errorText = await response.text();
          console.log('📄 [Delete Project] Raw error response:', errorText);
          
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch (parseError) {
              console.log('📄 [Delete Project] Failed to parse JSON, using text:', parseError);
              errorData = { message: errorText };
            }
          } else {
            errorData = { message: 'Empty response body' };
          }
        } catch (textError) {
          console.error('📄 [Delete Project] Failed to read response text:', textError);
          errorData = { message: 'Failed to read response' };
        }
        
        console.error('❌ Failed to delete project:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          errorData
        });
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{project?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}