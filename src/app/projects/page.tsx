/**
 * Projects Page - Optimized Version
 * 
 * This component has been optimized for better performance:
 * - Lazy loading of heavy components (table, dialogs)
 * - Code splitting with dynamic imports
 * - Suspense boundaries for progressive loading
 * - Reduced bundle size through component separation
 * - Optimized icon imports for better tree-shaking
 * 
 * Components split into:
 * - ProjectsTable: Table functionality and rendering
 * - EditProjectDialog: Edit form and update logic
 * - DeleteProjectDialog: Delete confirmation and logic
 */

import ProjectsPageOptimized from './ProjectsPageOptimized';

export default function ProjectsPage() {
  return <ProjectsPageOptimized />;
}