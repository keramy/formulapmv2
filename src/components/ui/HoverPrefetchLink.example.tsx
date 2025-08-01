/**
 * HoverPrefetchLink Usage Examples
 * 
 * This file demonstrates various usage patterns for the HoverPrefetchLink component
 * in Formula PM V2. These examples show how to implement performance-optimized
 * navigation with smart prefetching.
 */

'use client';

import { HoverPrefetchLink, prefetchUtils } from './HoverPrefetchLink';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

// Example 1: Basic project link with route prefetching only
export function BasicProjectLink({ project }: { project: any }) {
  return (
    <HoverPrefetchLink 
      href={`/projects/${project.id}`}
      delay={150}
      className="text-blue-600 hover:text-blue-800 font-medium"
    >
      {project.name}
    </HoverPrefetchLink>
  );
}

// Example 2: Enhanced project link with API data prefetching
export function EnhancedProjectLink({ project }: { project: any }) {
  return (
    <HoverPrefetchLink 
      href={`/projects/${project.id}`}
      prefetchData={[
        `/api/projects/${project.id}`,
        `/api/projects/${project.id}/stats`,
        `/api/projects/${project.id}/milestones`,
        `/api/projects/${project.id}/team`
      ]}
      delay={200}
      className="block p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
    >
      <div>
        <h3 className="font-semibold text-gray-900">{project.name}</h3>
        <p className="text-sm text-gray-600">{project.description}</p>
        <Badge variant="outline">{project.status}</Badge>
      </div>
    </HoverPrefetchLink>
  );
}

// Example 3: High-priority navigation button (no delay)
export function HighPriorityButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild>
      <HoverPrefetchLink 
        href={href}
        priority={true}  // No delay, prefetch immediately
        prefetchData={['/api/clients', '/api/users']}  // Prefetch form data
        className="inline-flex items-center justify-center"
      >
        {children}
      </HoverPrefetchLink>
    </Button>
  );
}

// Example 4: Table row with intersection observer
export function ProjectTableRow({ project }: { project: any }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <HoverPrefetchLink
          href={`/projects/${project.id}`}
          prefetchData={[`/api/projects/${project.id}`]}
          prefetchOnVisible={true}  // Only enable prefetch when visible
          delay={150}
          className="flex items-center cursor-pointer"
        >
          <div>
            <div className="font-medium text-gray-900">{project.name}</div>
            <div className="text-sm text-gray-500">{project.code}</div>
          </div>
        </HoverPrefetchLink>
      </td>
      {/* Other table cells */}
    </tr>
  );
}

// Example 5: Card with smart prefetching
export function ProjectCard({ project }: { project: any }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <HoverPrefetchLink
        href={`/projects/${project.id}`}
        prefetchData={[
          `/api/projects/${project.id}`,
          `/api/projects/${project.id}/stats`
        ]}
        delay={200}
        className="block"
      >
        <CardHeader>
          <CardTitle className="text-lg">{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant="outline">{project.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Progress:</span>
              <span className="text-sm font-medium">{project.progress}%</span>
            </div>
          </div>
        </CardContent>
      </HoverPrefetchLink>
    </Card>
  );
}

// Example 6: Navigation menu with conditional prefetching
export function NavigationMenu({ user }: { user: any }) {
  return (
    <nav className="space-y-2">
      <HoverPrefetchLink
        href="/dashboard"
        delay={100}
        priority={true}
        className="block px-4 py-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-gray-100"
      >
        Dashboard
      </HoverPrefetchLink>
      
      <HoverPrefetchLink
        href="/projects"
        prefetchData={['/api/projects']}
        delay={150}
        className="block px-4 py-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-gray-100"
      >
        Projects
      </HoverPrefetchLink>
      
      {/* Conditional prefetching based on user role */}
      {user.role === 'admin' && (
        <HoverPrefetchLink
          href="/admin"
          prefetchData={['/api/users', '/api/system-stats']}
          delay={200}
          className="block px-4 py-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-gray-100"
        >
          Admin Panel
        </HoverPrefetchLink>
      )}
    </nav>
  );
}

// Example 7: Disabled prefetching for external links
export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <HoverPrefetchLink
      href={href}
      disabled={true}  // Disable prefetching for external links
      className="text-blue-600 hover:text-blue-800 external-link"
    >
      {children}
    </HoverPrefetchLink>
  );
}

// Example 8: Manual cache management
export function CacheManagementExample() {
  const handleClearCache = () => {
    prefetchUtils.clearCache();
    console.log('Prefetch cache cleared');
  };

  const handleGetStats = () => {
    const stats = prefetchUtils.getCacheStats();
    console.log('Cache stats:', stats);
  };

  const handlePreload = async () => {
    await prefetchUtils.prefetch('/projects/important', [
      '/api/projects/important',
      '/api/projects/important/team'
    ]);
    console.log('Important project preloaded');
  };

  return (
    <div className="space-x-4">
      <Button onClick={handleClearCache} variant="outline">
        Clear Cache
      </Button>
      <Button onClick={handleGetStats} variant="outline">
        Get Stats
      </Button>
      <Button onClick={handlePreload} variant="outline">
        Preload Important
      </Button>
    </div>
  );
}

// Advanced Performance Pattern: Prefetch on scroll
export function ScrollBasedPrefetch({ projects }: { projects: any[] }) {
  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <HoverPrefetchLink
          key={project.id}
          href={`/projects/${project.id}`}
          prefetchData={[`/api/projects/${project.id}`]}
          prefetchOnVisible={true}
          delay={index < 3 ? 100 : 200} // Faster prefetch for first 3 items
          priority={index < 3} // High priority for first 3 items
          className="block p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
        >
          <ProjectCard project={project} />
        </HoverPrefetchLink>
      ))}
    </div>
  );
}

/**
 * Usage Guidelines:
 * 
 * 1. Use `delay={150}` for normal links (default)
 * 2. Use `priority={true}` for critical navigation (no delay)
 * 3. Use `prefetchData` to preload API endpoints users will need
 * 4. Use `prefetchOnVisible={true}` for long lists to optimize performance
 * 5. Use `disabled={true}` for external links or when prefetching isn't beneficial
 * 6. Use prefetchUtils for manual cache management in complex scenarios
 * 
 * Performance Tips:
 * - Shorter delays (50-100ms) for high-priority actions
 * - Longer delays (200-300ms) for secondary navigation
 * - Always include relevant API endpoints in prefetchData
 * - Use intersection observer (prefetchOnVisible) for content below the fold
 * - Clear cache periodically in long-running sessions
 */