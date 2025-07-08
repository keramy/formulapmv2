'use client';

import { useParams } from 'next/navigation';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { TabbedWorkspace } from '@/components/projects/TabbedWorkspace';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="p-6 space-y-6">
      <ProjectHeader projectId={projectId} />
      <TabbedWorkspace projectId={projectId} />
    </div>
  );
}