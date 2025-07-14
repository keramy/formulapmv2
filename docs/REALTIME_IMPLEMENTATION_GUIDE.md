# Real-time Implementation Guide - OPTIMIZATION PHASE 1.3

## Overview

This document outlines the comprehensive real-time system implemented for Formula PM v2.0, providing live updates across the dashboard, project pages, and activity feeds.

## Architecture

### Core Components

1. **RealtimeContext** (`src/contexts/RealtimeContext.tsx`)
   - Manages Supabase real-time connections
   - Handles subscriptions, presence, and broadcasting
   - Provides connection status monitoring

2. **useRealtimeSubscription Hook** (`src/hooks/useRealtimeSubscription.ts`)
   - Simplified hook for component-level subscriptions
   - Automatic cleanup and error handling
   - Specialized hooks for common use cases

3. **RealtimeDashboard** (`src/components/dashboard/RealtimeDashboard.tsx`)
   - Live dashboard with real-time updates
   - Shows online users and activity feed
   - Project and task status updates

4. **RealtimeScopeListTab** (`src/components/projects/tabs/RealtimeScopeListTab.tsx`)
   - Real-time scope item updates
   - Collaborative editing indicators
   - Live supplier assignments

## Database Setup

### Real-time Publications

The following tables are enabled for real-time updates:

```sql
-- Core tables
ALTER publication supabase_realtime ADD TABLE projects;
ALTER publication supabase_realtime ADD TABLE tasks;
ALTER publication supabase_realtime ADD TABLE scope_items;
ALTER publication supabase_realtime ADD TABLE activity_logs;
ALTER publication supabase_realtime ADD TABLE user_profiles;
ALTER publication supabase_realtime ADD TABLE project_assignments;
ALTER publication supabase_realtime ADD TABLE milestones;
ALTER publication supabase_realtime ADD TABLE material_specs;
```

### Activity Logging

Automatic activity logging is implemented via database triggers:

```sql
-- Activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    COALESCE(NEW.updated_by, NEW.created_by, auth.uid()),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
      ELSE 'modified'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'old_data', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new_data', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Usage Examples

### Basic Real-time Subscription

```typescript
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

function ProjectComponent({ projectId }: { projectId: string }) {
  const { subscribeToProject, isConnected } = useRealtimeSubscription();
  
  useEffect(() => {
    subscribeToProject(projectId, (payload) => {
      console.log('Project updated:', payload);
      // Handle project updates
    });
  }, [projectId]);

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Component content */}
    </div>
  );
}
```

### Specialized Project Hook

```typescript
import { useProjectRealtime } from '@/hooks/useRealtimeSubscription';

function ProjectDashboard({ projectId }: { projectId: string }) {
  const { projectData, tasks, scopeItems, isConnected } = useProjectRealtime(projectId);
  
  return (
    <div>
      <h1>{projectData?.name || 'Loading...'}</h1>
      <div>Tasks: {tasks.length}</div>
      <div>Scope Items: {scopeItems.length}</div>
      <div>Status: {isConnected ? '🟢 Live' : '🔴 Offline'}</div>
    </div>
  );
}
```

### User Presence Management

```typescript
import { useRealtime } from '@/contexts/RealtimeContext';

function CollaborativeEditor({ projectId }: { projectId: string }) {
  const { updatePresence, getPresence } = useRealtime();
  
  const handleEditStart = () => {
    updatePresence(projectId, 'editing');
  };
  
  const handleEditEnd = () => {
    updatePresence(projectId, 'viewing');
  };
  
  const onlineUsers = getPresence(projectId);
  
  return (
    <div>
      <div>
        Online: {onlineUsers.map(user => user.userName).join(', ')}
      </div>
      <button onFocus={handleEditStart} onBlur={handleEditEnd}>
        Edit Project
      </button>
    </div>
  );
}
```

## Real-time Features

### 1. Live Project Updates

- Project name, status, and progress changes
- Real-time assignment updates
- Milestone completions

### 2. Task Management

- Task creation, updates, and deletions
- Status changes (not started, in progress, completed)
- Assignment notifications

### 3. Scope Item Collaboration

- Live supplier assignments
- Cost updates
- Status changes
- Collaborative editing indicators

### 4. Activity Feed

- Real-time activity logging
- User action tracking
- Project-specific activity streams

### 5. User Presence

- Online/offline status
- Current activity (viewing, editing, away)
- Collaborative editing indicators

## Performance Optimizations

### 1. Selective Subscriptions

Only subscribe to relevant data:

```typescript
// Good: Subscribe to specific project
subscribeToProject(projectId, callback);

// Avoid: Global subscriptions
subscribeToAllProjects(callback);
```

### 2. Connection Management

- Automatic reconnection on network issues
- Connection status monitoring
- Graceful degradation when offline

### 3. Efficient Updates

- Optimistic updates for better UX
- Batch updates when possible
- Minimal re-renders with proper state management

## Security Considerations

### Row Level Security (RLS)

All real-time tables have RLS policies:

```sql
-- Users can only see projects they have access to
CREATE POLICY "Users can view projects they have access to" ON projects
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = id
      AND pa.user_id = auth.uid()
    )
  );
```

### Authentication

- All subscriptions require valid authentication
- User permissions are checked at the database level
- JWT tokens are validated for each connection

## Monitoring and Debugging

### Connection Status

```typescript
const { isConnected, connectionStatus } = useRealtime();

console.log('Connection Status:', {
  isConnected,
  connectionStatus, // 'connecting' | 'connected' | 'disconnected' | 'error'
});
```

### Debug Logging

Real-time events are logged for debugging:

```typescript
console.log('🔴 [Realtime] Project update:', payload);
console.log('🟢 [Realtime] Connected successfully');
console.log('🔴 [Realtime] Subscription error:', error);
```

## Testing

### Local Development

1. Start Supabase: `npx supabase start`
2. Run migrations: `npx supabase db reset`
3. Start development server: `npm run dev`

### Real-time Testing

```typescript
// Test real-time updates
const testRealtimeUpdate = async () => {
  // Make a change via API
  await fetch('/api/projects/123', {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated Project' })
  });
  
  // Should see real-time update in UI
};
```

## Migration Path

### From Static to Real-time

1. Wrap components with `RealtimeProvider`
2. Replace static data fetching with real-time subscriptions
3. Add optimistic updates for better UX
4. Implement presence indicators

### Example Migration

```typescript
// Before: Static component
function ProjectList() {
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);
  
  return <div>{projects.map(p => <Project key={p.id} {...p} />)}</div>;
}

// After: Real-time component
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const { subscribeToProjects } = useRealtimeSubscription();
  
  useEffect(() => {
    // Initial load
    fetchProjects().then(setProjects);
    
    // Real-time updates
    subscribeToProjects((payload) => {
      if (payload.eventType === 'INSERT') {
        setProjects(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setProjects(prev => prev.map(p => 
          p.id === payload.new.id ? payload.new : p
        ));
      }
    });
  }, []);
  
  return <div>{projects.map(p => <Project key={p.id} {...p} />)}</div>;
}
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Check Supabase URL and anon key
   - Verify RLS policies
   - Check network connectivity

2. **Missing Updates**
   - Ensure table is in realtime publication
   - Check subscription filters
   - Verify user permissions

3. **Performance Issues**
   - Limit subscription scope
   - Use pagination for large datasets
   - Optimize update frequency

### Debug Commands

```bash
# Check Supabase status
npx supabase status

# View real-time logs
npx supabase logs

# Reset database
npx supabase db reset
```

## Future Enhancements

1. **Presence Indicators**
   - Show who is currently viewing/editing
   - Real-time cursor positions

2. **Conflict Resolution**
   - Automatic merge of concurrent edits
   - User notification for conflicts

3. **Offline Support**
   - Queue updates when offline
   - Sync when connection restored

4. **Advanced Analytics**
   - Real-time performance metrics
   - User engagement tracking

## Conclusion

The real-time system provides a foundation for collaborative project management with live updates, user presence, and instant notifications. The implementation is scalable, secure, and provides excellent user experience for team collaboration.

For questions or issues, refer to the Supabase real-time documentation or contact the development team.