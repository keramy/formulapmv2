# Formula PM 2.0 - Complete Rebuild Plan
## Modern Architecture with Comprehensive User Workflow System

### **🎯 Project Overview**

**Previous App**: React SPA with basic features
**New Architecture**: Next.js 15 + Supabase + Advanced Workflows
**Timeline**: 16-20 weeks (4-5 months)
**Team**: 1-2 developers part-time

---

## **🏗️ Final Tech Stack (Based on Your Recommendations)**

```typescript
Frontend:         Next.js 15 + TypeScript + Tailwind CSS
UI Components:    Shadcn/ui + Lucide Icons  
Database:         Supabase (PostgreSQL + Real-time)
Authentication:   Supabase Auth + Row Level Security
State Management: Zustand + TanStack Query v5
Forms:            React Hook Form + Zod validation
File Storage:     Supabase Storage + React Dropzone
Charts:           Recharts + D3.js for Gantt
Mobile:           PWA + Mobile-first design
Deployment:       Vercel + GitHub Actions
Cost:             $47/month production
```

**Why This Stack Wins for Construction PM:**
- ✅ **Real-time collaboration** for team updates
- ✅ **Photo-driven reports** with auto-generation
- ✅ **Client portal** with approval workflows  
- ✅ **Mobile-first** for field workers
- ✅ **Row-level security** for multi-user access
- ✅ **Cost-effective** scaling

---

## **📋 Phase 1: Foundation & Multi-User Architecture (4 weeks)**

### **Week 1: Project Setup & Database Schema**
```bash
# Initialize Modern Stack
npx create-next-app@latest formula-pm-2 --typescript --tailwind --app
cd formula-pm-2
npm install @supabase/supabase-js zustand @tanstack/react-query
npm install @radix-ui/react-* lucide-react react-hook-form zod

# Supabase Project Setup
- Create new Supabase project
- Configure authentication providers
- Set up development environment
```

**Database Schema Design** (Week 1 Priority):
```sql
-- Core user management with all 9 user types
CREATE TYPE user_role AS ENUM (
  'company_owner',
  'general_manager', 
  'deputy_general_manager',
  'technical_director',
  'admin',
  'project_manager',
  'architect',
  'technical_engineer',
  'purchase_director',
  'purchase_specialist', 
  'field_worker',
  'client',
  'subcontractor'
);

-- Projects with multi-user assignment
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  project_manager_id UUID REFERENCES users(id),
  status project_status DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project team assignments
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

### **Week 2: Advanced Authentication & RLS**
```sql
-- Row Level Security for multi-user access
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Management can see all projects
CREATE POLICY "Management full access" ON projects
  FOR ALL USING (
    auth.jwt() ->> 'user_role' IN (
      'company_owner', 'general_manager', 
      'deputy_general_manager', 'technical_director', 'admin'
    )
  );

-- Project managers see assigned projects only
CREATE POLICY "PM assigned projects" ON projects
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'project_manager' AND
    project_manager_id = auth.uid()
  );

-- Clients see their projects only  
CREATE POLICY "Client project access" ON projects
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' = 'client' AND
    client_id = auth.uid()
  );
```

**Custom Authentication Logic**:
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  const hasPermission = (resource: string, action: string) => {
    const userRole = user?.user_metadata?.role;
    return checkPermission(userRole, resource, action);
  };
  
  const canAccessProject = (projectId: string) => {
    // Check if user has access to specific project
    return user?.projects?.includes(projectId) || hasManagementRole();
  };
  
  return { user, hasPermission, canAccessProject };
};
```

### **Week 3: Core UI Framework & Navigation**
```typescript
// Role-based navigation component
const Navigation = () => {
  const { user, hasPermission } = useAuth();
  
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      roles: ['all'] 
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: FolderOpen,
      roles: ['management', 'project_manager', 'architect'] 
    },
    { 
      name: 'My Projects', 
      href: '/my-projects', 
      icon: User,
      roles: ['project_manager', 'field_worker', 'subcontractor'] 
    },
    { 
      name: 'Client Portal', 
      href: '/client', 
      icon: Users,
      roles: ['client'] 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: FileText,
      roles: ['management', 'project_manager'] 
    }
  ];
  
  return (
    <nav>
      {navigationItems
        .filter(item => hasAccessToNavItem(item, user.role))
        .map(item => <NavItem key={item.name} {...item} />)
      }
    </nav>
  );
};
```

### **Week 4: Project Creation & Assignment System**
```typescript
// Advanced project creation with team assignment
const CreateProjectForm = () => {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });
  
  const createProject = async (data: ProjectFormData) => {
    // 1. Create project
    const { data: project } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();
    
    // 2. Assign project manager
    await supabase
      .from('project_assignments')
      .insert({
        project_id: project.id,
        user_id: data.project_manager_id,
        role: 'project_manager'
      });
    
    // 3. Assign team members if selected
    if (data.team_members?.length > 0) {
      const assignments = data.team_members.map(member => ({
        project_id: project.id,
        user_id: member.user_id,
        role: member.role
      }));
      
      await supabase
        .from('project_assignments')
        .insert(assignments);
    }
    
    // 4. Create default scope items
    await createDefaultScopeItems(project.id);
  };
  
  return <ProjectForm onSubmit={createProject} />;
};
```

---

## **📋 Phase 2: Advanced Scope & Document Management (5 weeks)**

### **Week 5: 4-Category Scope Management**
```typescript
// Enhanced scope management with dependencies
interface ScopeItem {
  id: string;
  project_id: string;
  category: 'construction' | 'millwork' | 'electrical' | 'mechanical';
  title: string;
  description: string;
  timeline: {
    start_date: string;
    end_date: string;
    duration_days: number;
  };
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assigned_to: string[];
  dependencies: string[]; // Other scope item IDs
  shop_drawings: string[]; // Document IDs
  material_specs: string[]; // Material spec IDs
  supplier_id?: string;
}

// Scope management with Excel integration
const ScopeManager = () => {
  const { data: scopeItems } = useQuery({
    queryKey: ['scope', projectId],
    queryFn: () => fetchScopeItems(projectId)
  });
  
  const handleExcelImport = async (file: File) => {
    const workbook = read(await file.arrayBuffer());
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json(worksheet);
    
    // Process and validate Excel data
    const scopeItems = data.map(validateScopeItem);
    
    // Bulk insert with error handling
    await supabase
      .from('scope_items')
      .upsert(scopeItems);
  };
  
  return (
    <div>
      <ScopeImportButton onImport={handleExcelImport} />
      <ScopeItemsTable 
        items={scopeItems}
        onUpdate={updateScopeItem}
        onDelete={deleteScopeItem}
      />
    </div>
  );
};
```

### **Week 6: Document Management & Approval Workflow**
```typescript
// Document approval workflow system
interface DocumentApproval {
  id: string;
  document_id: string;
  approver_type: 'internal' | 'client';
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_required';
  comments?: string;
  approved_at?: string;
  version: number;
}

// Approval workflow component
const DocumentApprovalFlow = ({ documentId }: { documentId: string }) => {
  const [approvals, setApprovals] = useState<DocumentApproval[]>([]);
  
  const handleApproval = async (action: 'approve' | 'reject', comments?: string) => {
    const approval = {
      document_id: documentId,
      approver_id: user.id,
      approver_type: user.role === 'client' ? 'client' : 'internal',
      status: action === 'approve' ? 'approved' : 'rejected',
      comments,
      approved_at: action === 'approve' ? new Date().toISOString() : undefined
    };
    
    await supabase
      .from('document_approvals')
      .insert(approval);
    
    // Send notifications to relevant users
    await sendApprovalNotification(documentId, action, user.id);
    
    // If client rejected, notify PM and architect
    if (action === 'reject' && user.role === 'client') {
      await notifyProjectTeam(documentId, 'revision_required');
    }
  };
  
  return (
    <ApprovalInterface 
      approvals={approvals}
      onApprove={handleApproval}
      userRole={user.role}
    />
  );
};
```

### **Week 7: Shop Drawings & Architectural Integration**
```typescript
// Shop drawings with architectural team integration
const ShopDrawingsManager = () => {
  const { user } = useAuth();
  
  const canEditDrawings = user.role === 'architect' || user.role === 'project_manager';
  const canApproveDrawings = user.role === 'project_manager';
  const canViewDrawings = true; // Most users can view
  
  const uploadDrawing = async (file: File, metadata: DrawingMetadata) => {
    // 1. Upload to Supabase Storage
    const { data: uploadData } = await supabase.storage
      .from('shop-drawings')
      .upload(`${projectId}/${file.name}`, file);
    
    // 2. Create drawing record
    const drawing = {
      project_id: projectId,
      scope_item_id: metadata.scope_item_id,
      filename: file.name,
      file_path: uploadData.path,
      version: 1,
      status: 'draft',
      created_by: user.id,
      drawing_type: metadata.type
    };
    
    await supabase
      .from('shop_drawings')
      .insert(drawing);
    
    // 3. Notify PM for review
    await notifyForReview(drawing.id, 'shop_drawing');
  };
  
  return (
    <DrawingsInterface 
      canEdit={canEditDrawings}
      canApprove={canApproveDrawings}
      onUpload={uploadDrawing}
    />
  );
};
```

### **Week 8: Material Specifications & Supplier Integration**
```typescript
// Material specifications with supplier workflow
interface MaterialSpec {
  id: string;
  scope_item_id: string;
  name: string;
  specification: string;
  supplier_options: SupplierOption[];
  selected_supplier_id?: string;
  client_approved: boolean;
  samples_requested: boolean;
  samples_approved: boolean;
  procurement_status: 'pending' | 'ordered' | 'delivered' | 'installed';
}

const MaterialSpecManager = () => {
  const handleSupplierSelection = async (specId: string, supplierId: string) => {
    // Update material spec with selected supplier
    await supabase
      .from('material_specs')
      .update({ selected_supplier_id: supplierId })
      .eq('id', specId);
    
    // Notify purchase department
    await notifyPurchaseDepartment(specId, supplierId);
    
    // Create purchase order workflow
    await initiatePurchaseOrder(specId, supplierId);
  };
  
  return (
    <MaterialSpecInterface 
      onSupplierSelect={handleSupplierSelection}
      userRole={user.role}
    />
  );
};
```

### **Week 9: Purchase Department Integration**
```typescript
// Purchase department workflow
const PurchaseManagement = () => {
  const { user } = useAuth();
  const isPurchaseTeam = ['purchase_director', 'purchase_specialist'].includes(user.role);
  
  const createSupplier = async (supplierData: SupplierData) => {
    const supplier = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    // Notify relevant project managers
    await notifyProjectManagers('new_supplier_added', supplier.id);
  };
  
  const assignScopeToSupplier = async (scopeItemId: string, supplierId: string) => {
    // Requires approval from GM/DGM/PM
    const approval = await requestSupplierApproval(scopeItemId, supplierId);
    
    if (approval.approved) {
      await supabase
        .from('scope_items')
        .update({ supplier_id: supplierId })
        .eq('id', scopeItemId);
    }
  };
  
  return (
    <PurchaseInterface 
      canCreateSuppliers={isPurchaseTeam}
      onCreateSupplier={createSupplier}
      onAssignSupplier={assignScopeToSupplier}
    />
  );
};
```

---

## **📋 Phase 3: Client Portal & External Access (4 weeks)**

### **Week 10: Client Portal Development**
```typescript
// Client-specific dashboard and access
const ClientDashboard = () => {
  const { user } = useAuth();
  const { data: clientProjects } = useQuery({
    queryKey: ['client-projects', user.id],
    queryFn: () => fetchClientProjects(user.id)
  });
  
  return (
    <div className="space-y-6">
      <ClientProjectOverview projects={clientProjects} />
      <PendingApprovals clientId={user.id} />
      <ProjectProgressGallery projects={clientProjects} />
      <RecentReports clientId={user.id} />
    </div>
  );
};

// Client approval interface
const ClientApprovalInterface = ({ documentId }: { documentId: string }) => {
  const [comments, setComments] = useState('');
  
  const handleApproval = async (action: 'approve' | 'reject') => {
    await supabase
      .from('document_approvals')
      .insert({
        document_id: documentId,
        approver_id: user.id,
        approver_type: 'client',
        status: action === 'approve' ? 'approved' : 'rejected',
        comments: comments || null
      });
    
    // Notify project team
    await notifyProjectTeam(documentId, action);
  };
  
  return (
    <ApprovalForm 
      onApprove={() => handleApproval('approve')}
      onReject={() => handleApproval('reject')}
      comments={comments}
      onCommentsChange={setComments}
    />
  );
};
```

### **Week 11: Subcontractor Access System**
```typescript
// Subcontractor limited access
const SubcontractorDashboard = () => {
  const { user } = useAuth();
  const { data: assignedProjects } = useQuery({
    queryKey: ['subcontractor-projects', user.id],
    queryFn: () => fetchAssignedProjects(user.id)
  });
  
  return (
    <div>
      <AssignedProjectsList projects={assignedProjects} />
      <ReportCreationInterface userId={user.id} />
      <TaskStatusUpdates userId={user.id} />
    </div>
  );
};

// Subcontractor reporting
const SubcontractorReporting = ({ projectId }: { projectId: string }) => {
  const createReport = async (reportData: ReportData) => {
    // Subcontractors can only create reports for assigned projects
    const hasAccess = await checkProjectAccess(user.id, projectId);
    
    if (!hasAccess) {
      throw new Error('Access denied');
    }
    
    await supabase
      .from('reports')
      .insert({
        ...reportData,
        project_id: projectId,
        created_by: user.id,
        report_type: 'subcontractor_progress'
      });
    
    // Notify project manager
    await notifyProjectManager(projectId, 'subcontractor_report_submitted');
  };
  
  return (
    <ReportForm 
      onSubmit={createReport}
      allowedTypes={['progress', 'issue']}
    />
  );
};
```

### **Week 12: Mobile-First Field Interface**
```typescript
// Mobile-optimized field worker interface
const FieldWorkerMobile = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  
  useEffect(() => {
    // Get GPS location for reports
    navigator.geolocation.getCurrentPosition(setLocation);
  }, []);
  
  const createMobileReport = async (reportData: MobileReportData) => {
    // Auto-fill location and weather data
    const enhancedReport = {
      ...reportData,
      location: location ? {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      } : null,
      weather: await getWeatherData(location),
      created_via: 'mobile',
      device_info: navigator.userAgent
    };
    
    await supabase
      .from('field_reports')
      .insert(enhancedReport);
  };
  
  return (
    <MobileReportInterface 
      onSubmit={createMobileReport}
      autoLocation={location}
      optimizedForTouch={true}
    />
  );
};

// PWA configuration for mobile access
// next.config.js
const withPWA = require('next-pwa');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  }
});
```

### **Week 13: Advanced Photo-Driven Reporting**
```typescript
// Enhanced reporting system based on your existing code
const AdvancedReportSystem = () => {
  const generateAutoReport = async (projectId: string, photos: Photo[]) => {
    // Use your existing auto-report service logic
    const reportData = await autoReportService.generateFromPhotos(
      projectId, 
      photos,
      {
        templateType: 'auto',
        includeSequences: true,
        includeMetadata: true
      }
    );
    
    // Store in Supabase
    await supabase
      .from('reports')
      .insert({
        ...reportData.report,
        auto_generated: true,
        generation_metadata: reportData.generationInfo
      });
    
    return reportData;
  };
  
  return (
    <AutoReportGenerator 
      onReportGenerated={generateAutoReport}
      photoFilters={['progress', 'quality', 'issue']}
    />
  );
};
```

---

## **📋 Phase 4: Real-time Features & Notifications (3 weeks)**

### **Week 14: Real-time Collaboration**
```typescript
// Real-time updates using Supabase subscriptions
const useRealTimeUpdates = (projectId: string) => {
  const [updates, setUpdates] = useState([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel(`project:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scope_items',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        // Handle real-time scope updates
        handleScopeUpdate(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'document_approvals'
      }, (payload) => {
        // Handle approval updates
        handleApprovalUpdate(payload);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);
  
  return updates;
};

// Real-time notification system
const NotificationSystem = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const subscription = supabase
      .channel(`user:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Show toast notification
        toast({
          title: payload.new.title,
          description: payload.new.message,
          action: payload.new.action_url ? (
            <Button onClick={() => router.push(payload.new.action_url)}>
              View
            </Button>
          ) : undefined
        });
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [user.id]);
  
  return null; // Just handles notifications
};
```

### **Week 15: Task Management & Assignment**
```typescript
// Advanced task management with real-time updates
interface Task {
  id: string;
  project_id: string;
  scope_item_id?: string;
  title: string;
  description: string;
  assigned_to: string[];
  created_by: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  dependencies: string[];
  attachments: string[];
  comments: TaskComment[];
}

const TaskManager = () => {
  const createTask = async (taskData: Partial<Task>) => {
    const task = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    // Notify assigned users
    for (const userId of taskData.assigned_to || []) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'New Task Assigned',
          message: `You have been assigned to: ${taskData.title}`,
          type: 'task_assignment',
          action_url: `/tasks/${task.data.id}`
        });
    }
    
    return task;
  };
  
  return (
    <TaskInterface 
      onCreate={createTask}
      onUpdate={updateTask}
      onAssign={assignTask}
    />
  );
};
```

### **Week 16: Performance Optimization & Testing**
```typescript
// Performance optimizations
const OptimizedProjectList = () => {
  // Virtualized list for large datasets
  const { data: projects, isLoading } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  
  return (
    <VirtualizedList 
      data={projects}
      renderItem={ProjectCard}
      loading={isLoading}
    />
  );
};

// Error boundaries and monitoring
const AppErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Send to monitoring service
        Sentry.captureException(error, { extra: errorInfo });
      }}
      fallback={<ErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
};
```

---

## **🚀 Deployment & Production Setup**

### **Production Configuration**
```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-auth-secret
NEXTAUTH_URL=https://your-domain.com
```

### **Vercel Deployment**
```json
// vercel.json
{
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## **📊 Success Metrics & Monitoring**

### **Key Performance Indicators**
- **Page Load Speed**: < 2 seconds
- **Time to Interactive**: < 3 seconds  
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%
- **User Satisfaction**: > 4.5/5

### **Business Metrics**
- **Report Generation Time**: 80% reduction (from 2 hours to 20 minutes)
- **Client Approval Cycle**: 60% faster (from 1 week to 2-3 days)
- **Field Worker Adoption**: > 90% usage rate
- **Project Visibility**: Real-time updates for all stakeholders

---

## **🎯 Implementation Priority**

**Phase 1** (Weeks 1-4): **Foundation** - Critical for all other features
**Phase 2** (Weeks 5-9): **Core Business Logic** - High impact on daily operations  
**Phase 3** (Weeks 10-13): **External Access** - Major competitive advantage
**Phase 4** (Weeks 14-16): **Advanced Features** - Optimization and polish

**Total Timeline**: 16 weeks (4 months)
**Budget**: $47/month + development time
**ROI**: 40-50% reduction in PM overhead + improved client satisfaction

This architecture provides a modern, scalable foundation that will serve Formula International for years to come while solving the real workflow challenges identified in our user schema analysis.