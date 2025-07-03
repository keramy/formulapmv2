# Formula PM Task Management Pattern
## Wave 2B Business Logic Implementation

### **📋 IMPLEMENTATION SUMMARY**
Standalone task management system with intelligent @mention functionality, collaborative comments, and seamless integration with Formula PM's project ecosystem for Wave 2B.

### **🏗️ ARCHITECTURE OVERVIEW**

#### **API Layer Structure**
```
/src/app/api/tasks/
├── route.ts                    # Main task CRUD operations
├── [id]/route.ts              # Individual task operations
├── [id]/comments/route.ts     # Threaded comment system
└── mentions/
    ├── suggestions/route.ts   # @mention autocomplete
    └── resolve/route.ts       # Entity resolution
```

#### **Database Schema**
```sql
-- Task Management Tables
tasks (
  id, project_id, title, description, status, priority,
  assigned_to[], created_by, due_date, estimated_hours, actual_hours
)

task_mentions (
  id, task_id, entity_type, entity_id, mentioned_text
)

task_comments (
  id, task_id, parent_comment_id, author_id, content, mentions[]
)

task_dependencies (
  id, task_id, depends_on_task_id, dependency_type
)
```

#### **Type System**
```typescript
// /src/types/tasks.ts
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string; // Rich text with @mention support
  status: TaskStatus;
  priority: TaskPriority;
  
  // @Mention References (Smart Linking)
  mentioned_projects: string[];    // @project references
  mentioned_scope_items: string[]; // @scope references  
  mentioned_documents: string[];   // @document references
  mentioned_users: string[];       // @user references
  mentioned_tasks: string[];       // @task references
}

export type MentionType = 'project' | 'scope' | 'document' | 'user' | 'task';
```

#### **Component Architecture**
```
/src/components/tasks/
├── TaskCard.tsx              # Task display with actions
├── TaskComments.tsx          # Real-time threaded comments
├── MentionEditor.tsx         # Rich text editor with @mention
└── mentions/
    ├── MentionParser.tsx     # Parse and resolve @mentions
    ├── MentionSuggestions.tsx # Autocomplete dropdown
    └── EntityResolver.tsx    # Entity linking logic
```

### **🔑 KEY PATTERNS**

#### **1. @Mention Intelligence Engine**
```typescript
// /src/lib/mentions/mentionParser.ts
export class MentionParser {
  // Entity type detection
  private getEntityType(mention: string): MentionType {
    if (mention.startsWith('@project:')) return 'project';
    if (mention.startsWith('@scope:')) return 'scope';
    if (mention.startsWith('@doc:')) return 'document';
    if (mention.startsWith('@user:')) return 'user';
    if (mention.startsWith('@task:')) return 'task';
    return 'user'; // Default to user mention
  }
  
  // Smart autocomplete
  async getSuggestions(input: string, context: MentionContext) {
    const entityType = this.detectEntityType(input);
    const provider = this.getSuggestionProvider(entityType);
    return await provider.search(input, context);
  }
}
```

#### **2. Collaborative Comments System**
```typescript
// Real-time threaded comments
export const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  
  // Real-time subscription with progressive enhancement
  useEffect(() => {
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'task_comments' },
        handleCommentChange
      )
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [taskId]);
};
```

#### **3. Entity Resolution Pattern**
```typescript
// Optimized entity resolver using existing database utilities
const getEntityResolver = (entityType: MentionType) => {
  const resolvers = {
    project: (id) => supabase.from('projects').select('id, name').eq('id', id),
    scope: (id) => supabase.from('scope_items').select('id, description').eq('id', id),
    document: (id) => supabase.from('documents').select('id, title').eq('id', id),
    user: (id) => supabase.from('user_profiles').select('id, first_name, last_name').eq('id', id),
    task: (id) => supabase.from('tasks').select('id, title').eq('id', id)
  };
  
  return resolvers[entityType];
};
```

#### **4. Permission-Based Access Control**
```typescript
// Role-based task access
export const useTaskPermissions = () => {
  const { profile } = useAuth();
  const { checkPermission } = usePermissions();
  
  return {
    canCreateTasks: checkPermission('tasks.create'),
    canViewAllTasks: checkPermission('tasks.manage_all'),
    canComment: checkPermission('tasks.comment'),
    canAssignTasks: ['company_owner', 'general_manager', 'project_manager'].includes(profile?.role)
  };
};
```

#### **5. Smart Suggestion Engine**
```typescript
// Context-aware suggestions
const getSuggestionProvider = (entityType: MentionType) => {
  return {
    async search(query: string, context: { projectId?: string }) {
      const baseQuery = supabase.from(getTableName(entityType));
      
      // Context filtering
      if (context.projectId && entityType !== 'user') {
        baseQuery.eq('project_id', context.projectId);
      }
      
      return baseQuery
        .select(getSelectFields(entityType))
        .ilike(getSearchField(entityType), `%${query}%`)
        .limit(10);
    }
  };
};
```

### **🛡️ SECURITY PATTERNS**

#### **Row Level Security Integration**
```sql
-- Tasks follow project access control
CREATE POLICY "tasks_select" ON tasks
FOR SELECT USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE user_has_project_access(auth.uid(), id)
  )
);

-- Comments inherit task permissions
CREATE POLICY "task_comments_select" ON task_comments
FOR SELECT USING (
  task_id IN (
    SELECT id FROM tasks 
    WHERE user_has_task_access(auth.uid(), id)
  )
);
```

#### **Mention Security Pattern**
```typescript
// Validate mention permissions before saving
const validateMentions = async (mentions: MentionData[], userId: string) => {
  for (const mention of mentions) {
    const hasAccess = await checkEntityAccess(mention.entity_id, mention.entity_type, userId);
    if (!hasAccess) {
      throw new Error(`Access denied to ${mention.entity_type}: ${mention.entity_id}`);
    }
  }
};
```

### **🔄 REAL-TIME PATTERNS**

#### **Progressive Enhancement Subscriptions**
```typescript
// Optimized real-time with payload inspection
const useTaskSubscription = (taskId: string) => {
  useEffect(() => {
    const channel = supabase
      .channel(`task-${taskId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` },
        (payload) => {
          // Smart refresh logic - only update if meaningful changes
          if (isSignificantChange(payload)) {
            refreshTaskData();
          }
        }
      )
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [taskId]);
};
```

#### **Comment Threading Pattern**
```typescript
// Hierarchical comment structure
export interface TaskComment {
  id: string;
  task_id: string;
  parent_comment_id?: string; // For threading
  content: string;
  mentions: MentionData[];
  reactions: CommentReaction[];
  replies?: TaskComment[]; // Nested structure
}
```

### **📊 INTEGRATION PATTERNS**

#### **Project Foundation Integration**
```typescript
// Seamless integration with Wave 2A project system
const TaskManager = ({ projectId }) => {
  const { project } = useProject(projectId);
  const { tasks } = useTasks({ projectId });
  const { canCreateTasks } = useTaskPermissions();
  
  // Task creation with project context
  const createTask = async (taskData) => {
    return await createProjectTask({
      ...taskData,
      project_id: projectId,
      created_by: user.id
    });
  };
};
```

#### **Dashboard Integration**
```typescript
// Task summary for dashboard
export const TaskSummary = () => {
  const { profile } = useAuth();
  const tasks = useTasks({ 
    assignedTo: profile?.id,
    status: ['in_progress', 'review_needed']
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
};
```

### **🎯 PERFORMANCE PATTERNS**

#### **Optimized Mention Processing**
```typescript
// Batch mention resolution
const resolveMentions = async (mentions: string[]) => {
  const grouped = groupBy(mentions, getEntityType);
  
  const promises = Object.entries(grouped).map(([type, ids]) => {
    const resolver = getEntityResolver(type as MentionType);
    return resolver(ids);
  });
  
  const results = await Promise.all(promises);
  return flattenResults(results);
};
```

#### **Efficient Comment Loading**
```typescript
// Paginated comment loading with threading
const useTaskComments = (taskId: string) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  
  const loadComments = async (page = 1) => {
    const { data } = await supabase
      .from('task_comments')
      .select(`
        *,
        author:user_profiles(first_name, last_name),
        replies:task_comments(*, author:user_profiles(first_name, last_name))
      `)
      .eq('task_id', taskId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);
      
    return data;
  };
};
```

### **✅ USAGE GUIDELINES**

#### **For Future Subagents:**
1. **Always use** the MentionParser class for @mention functionality
2. **Leverage** existing entity resolvers before creating new ones
3. **Follow** real-time subscription patterns with progressive enhancement
4. **Respect** role-based task access permissions
5. **Integrate** with project foundation for context
6. **Use** threaded comment structure for collaboration

#### **Extension Points:**
- Additional mention types (extend MentionType)
- Custom task templates (build on existing task creation)
- Advanced notification systems (use existing mention tracking)
- Task automation (build on existing dependency patterns)

#### **Anti-Patterns to Avoid:**
- ❌ Direct database queries without permission checks
- ❌ Client-side only mention validation
- ❌ Blocking real-time subscriptions for large datasets
- ❌ Hardcoded entity types in suggestion engines

### **🎊 SUCCESS METRICS**
- **@Mention Intelligence**: 5 entity types with smart autocomplete
- **Real-time Collaboration**: Live comments and updates
- **Role-based Access**: All 13 user types supported
- **Performance Optimized**: Progressive enhancement and efficient queries
- **Integration Quality**: Seamless Wave 2A project foundation integration

This pattern ensures consistent, high-quality task management implementation with intelligent collaboration features across all Formula PM modules.