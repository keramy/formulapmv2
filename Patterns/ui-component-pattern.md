# Formula PM UI Component Pattern
## Wave 1 Foundation Implementation

### **📋 IMPLEMENTATION SUMMARY**
Comprehensive UI component library and design system using Shadcn/ui, Tailwind CSS, and role-based theming for Formula PM 2.0. Provides consistent, accessible, and responsive components for all application features.

### **🏗️ ARCHITECTURE OVERVIEW**

#### **Component Library Structure**
```
/src/components/
├── ui/                         # Base Shadcn/ui components
│   ├── button.tsx             # Button with variants
│   ├── card.tsx               # Card containers
│   ├── form.tsx               # Form components
│   ├── input.tsx              # Input fields
│   ├── data-table.tsx         # Advanced table component
│   ├── dialog.tsx             # Modal dialogs
│   ├── dropdown-menu.tsx      # Dropdown menus
│   ├── select.tsx             # Select dropdowns
│   ├── tabs.tsx               # Tab navigation
│   ├── toast.tsx              # Toast notifications
│   └── ...                    # 20+ other components
├── layouts/
│   └── MainLayout.tsx         # Role-adaptive main layout
├── navigation/
│   ├── GlobalSidebar.tsx      # Desktop navigation
│   ├── MobileBottomNav.tsx    # Mobile navigation
│   └── UserProfileHeader.tsx  # User profile display
├── forms/
│   └── SimpleFormBuilder.tsx  # Dynamic form builder
└── providers/
    └── ThemeProvider.tsx      # Theme management
```

#### **Design System Configuration**
```
components.json                # Shadcn/ui configuration
tailwind.config.js            # Custom theme tokens
/src/app/globals.css          # CSS variables and base styles
```

### **🔑 KEY PATTERNS**

#### **1. Role-Based Component Theming**
```typescript
// Role-specific color schemes
const getRoleTheme = (role: UserRole) => {
  const themes = {
    company_owner: { primary: 'purple', accent: 'gold' },
    general_manager: { primary: 'blue', accent: 'silver' },
    technical_engineer: { primary: 'green', accent: 'blue' },
    field_worker: { primary: 'orange', accent: 'yellow' },
    client: { primary: 'slate', accent: 'blue' },
    // ... other roles
  };
  return themes[role] || themes.client;
};

// Apply theme in components
const UserAvatar = () => {
  const { profile } = useAuth();
  const theme = getRoleTheme(profile?.role);
  
  return (
    <Avatar className={`border-2 border-${theme.primary}-500`}>
      <AvatarImage src={profile?.avatar_url} />
      <AvatarFallback className={`bg-${theme.primary}-100 text-${theme.primary}-700`}>
        {getInitials(profile)}
      </AvatarFallback>
    </Avatar>
  );
};
```

#### **2. Responsive Layout Pattern**
```typescript
// Mobile-first responsive design
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize
  };
};

// Adaptive navigation
export const Navigation = () => {
  const { isMobile } = useResponsive();
  
  return isMobile ? <MobileBottomNav /> : <GlobalSidebar />;
};
```

#### **3. Permission-Adaptive Components**
```typescript
// Components that adapt based on user permissions
export const ProjectCard = ({ project }) => {
  const { canEditProject, canDeleteProject, canViewFinancials } = usePermissions();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        {canViewFinancials && (
          <Badge variant="secondary">
            Budget: ${project.budget?.toLocaleString()}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <p>{project.description}</p>
        
        <div className="flex gap-2 mt-4">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}`}>View</Link>
          </Button>
          
          {canEditProject && (
            <Button variant="default">Edit</Button>
          )}
          
          {canDeleteProject && (
            <Button variant="destructive">Delete</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

#### **4. Dynamic Form Builder Pattern**
```typescript
// Type-safe dynamic form generation
export interface FormFieldConfig<T = any> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'date';
  validation?: ZodSchema;
  options?: { label: string; value: any }[];
  placeholder?: string;
  description?: string;
  conditional?: (values: T) => boolean;
}

export const SimpleFormBuilder = <T extends Record<string, any>>({
  fields,
  onSubmit,
  defaultValues,
  className
}: FormBuilderProps<T>) => {
  const form = useForm<T>({
    resolver: zodResolver(createFormSchema(fields)),
    defaultValues
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {fields.map((field) => (
          <FormField
            key={field.name as string}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {renderFieldByType(field, formField)}
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
```

#### **5. Advanced Data Table Pattern**
```typescript
// Reusable data table with sorting, filtering, pagination
export const DataTable = <T,>({
  columns,
  data,
  searchable = true,
  filterable = true,
  exportable = false,
  onRowClick,
  className
}: DataTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, globalFilter }
  });
  
  return (
    <div className={className}>
      {/* Search and filters */}
      {searchable && (
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="mb-4"
        />
      )}
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
};
```

### **🎨 DESIGN SYSTEM PATTERNS**

#### **1. CSS Custom Properties**
```css
/* /src/app/globals.css */
:root {
  /* Base colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  
  /* Role-specific colors */
  --role-company-owner: 270 95% 75%;
  --role-general-manager: 221 83% 53%;
  --role-technical-engineer: 142 76% 36%;
  --role-field-worker: 25 95% 53%;
  --role-client: 210 20% 50%;
  
  /* Component-specific */
  --sidebar-width: 16rem;
  --header-height: 4rem;
  --mobile-nav-height: 4rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variants */
  }
}
```

#### **2. Component Variant System**
```typescript
// Button variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Role-specific variants
        'role-manager': "bg-blue-600 text-white hover:bg-blue-700",
        'role-technical': "bg-green-600 text-white hover:bg-green-700",
        'role-field': "bg-orange-600 text-white hover:bg-orange-700"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);
```

#### **3. Theme Provider Pattern**
```typescript
// Dark/light mode with role theming
export const ThemeProvider = ({ children, ...props }) => {
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem('theme') as Theme) || 'system'
  );
  
  const { profile } = useAuth();
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply base theme
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Apply role-specific CSS variables
    if (profile?.role) {
      const roleTheme = getRoleTheme(profile.role);
      root.style.setProperty('--role-primary', roleTheme.primary);
      root.style.setProperty('--role-accent', roleTheme.accent);
    }
  }, [theme, profile?.role]);
  
  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
};
```

### **📱 MOBILE PATTERNS**

#### **1. Mobile-First Navigation**
```typescript
// Bottom navigation for mobile
export const MobileBottomNav = () => {
  const pathname = usePathname();
  const { canViewScope, canViewTasks, canViewProjects } = usePermissions();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { name: 'Projects', href: '/projects', icon: FolderOpen, show: canViewProjects },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, show: canViewTasks },
    { name: 'Scope', href: '/scope', icon: List, show: canViewScope },
    { name: 'Profile', href: '/profile', icon: User, show: true }
  ].filter(item => item.show);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-2 text-xs",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
```

#### **2. Responsive Grid System**
```typescript
// Responsive card grids
export const ResponsiveGrid = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "grid gap-4",
        "grid-cols-1",                    // Mobile: 1 column
        "sm:grid-cols-2",                 // Small: 2 columns  
        "lg:grid-cols-3",                 // Large: 3 columns
        "xl:grid-cols-4",                 // XL: 4 columns
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### **✅ USAGE GUIDELINES**

#### **For Future Subagents:**
1. **Always use** existing Shadcn/ui components before creating custom ones
2. **Follow** the role-based theming system for consistent user experience
3. **Implement** mobile-first responsive design patterns
4. **Use** the form builder for dynamic forms
5. **Leverage** the data table component for lists and tables
6. **Apply** permission-adaptive patterns in components

#### **Component Creation Guidelines:**
```typescript
// Template for new components
export interface NewComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  // ... other props
}

export const NewComponent = React.forwardRef<
  HTMLDivElement,
  NewComponentProps
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        newComponentVariants({ variant, size }),
        className
      )}
      {...props}
    />
  );
});

NewComponent.displayName = "NewComponent";
```

#### **Extension Points:**
- Additional Shadcn/ui components (follow existing patterns)
- Role-specific component variants (extend variant system)
- Custom form field types (extend form builder)
- Mobile-specific components (follow responsive patterns)

### **🎯 SUCCESS METRICS**
- **21 Shadcn/ui components** implemented and configured
- **Role-based theming** for all 13 user types
- **Mobile-first responsive design** with adaptive navigation
- **Dynamic form builder** with TypeScript generics
- **Advanced data table** with sorting, filtering, pagination
- **Dark/light theme support** with system preference detection

This pattern ensures consistent, accessible, and responsive UI components across all Formula PM features while maintaining role-based user experience.