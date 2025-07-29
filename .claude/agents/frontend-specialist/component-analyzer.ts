/**
 * Component Analysis Tools for Frontend Specialist
 * Provides comprehensive React component architecture and performance analysis
 */

export interface ComponentAnalysis {
  components: ComponentMetrics[]
  architectureScore: ArchitectureScore
  performanceIssues: PerformanceIssue[]
  accessibilityIssues: AccessibilityIssue[]
  designSystemCompliance: DesignSystemCompliance
  recommendations: ComponentRecommendation[]
}

export interface ComponentMetrics {
  name: string
  path: string
  type: 'page' | 'layout' | 'ui' | 'feature' | 'hook'
  linesOfCode: number
  complexity: 'low' | 'medium' | 'high' | 'critical'
  dependencies: string[]
  props: ComponentProp[]
  hooks: string[]
  hasTypeScript: boolean
  hasTests: boolean
  accessibilityScore: number
  performanceScore: number
  reusabilityScore: number
}

export interface ComponentProp {
  name: string
  type: string
  required: boolean
  hasDefault: boolean
  documentation?: string
}

export interface ArchitectureScore {
  overall: number // 0-100
  modularity: number
  reusability: number
  maintainability: number
  typeScriptCoverage: number
  testCoverage: number
  details: {
    componentStructure: number
    propValidation: number
    stateManagement: number
    errorHandling: number
  }
}

export interface PerformanceIssue {
  component: string
  type: 'unnecessary_renders' | 'missing_memoization' | 'large_bundle' | 'memory_leak' | 'slow_operations'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  fix: string
  estimatedImprovement: string
}

export interface AccessibilityIssue {
  component: string
  type: 'missing_aria' | 'keyboard_navigation' | 'color_contrast' | 'screen_reader' | 'focus_management'
  severity: 'low' | 'medium' | 'high' | 'critical'
  wcagLevel: 'A' | 'AA' | 'AAA'
  description: string
  fix: string
  impact: string
}

export interface DesignSystemCompliance {
  score: number // 0-100
  consistentStyling: number
  componentUsage: number
  brandingCompliance: number
  responsiveDesign: number
  issues: DesignSystemIssue[]
}

export interface DesignSystemIssue {
  component: string
  type: 'inconsistent_colors' | 'wrong_typography' | 'spacing_violations' | 'component_misuse'
  description: string
  fix: string
}

export interface ComponentRecommendation {
  category: 'performance' | 'accessibility' | 'maintainability' | 'design_system'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  components: string[]
  implementation: string
  estimatedEffort: string
  expectedBenefit: string
}

export class ComponentAnalyzer {
  /**
   * Comprehensive component codebase analysis
   */
  static async analyzeComponents(srcDirectory: string = 'src'): Promise<ComponentAnalysis> {
    const analysis: ComponentAnalysis = {
      components: [],
      architectureScore: {
        overall: 0,
        modularity: 0,
        reusability: 0,
        maintainability: 0,
        typeScriptCoverage: 0,
        testCoverage: 0,
        details: {
          componentStructure: 0,
          propValidation: 0,
          stateManagement: 0,
          errorHandling: 0
        }
      },
      performanceIssues: [],
      accessibilityIssues: [],
      designSystemCompliance: {
        score: 0,
        consistentStyling: 0,
        componentUsage: 0,
        brandingCompliance: 0,
        responsiveDesign: 0,
        issues: []
      },
      recommendations: []
    }

    // This would contain file system analysis of React components
    // For now, providing the analysis framework
    
    return analysis
  }

  /**
   * Analyze component performance patterns
   */
  static analyzePerformancePatterns(components: ComponentMetrics[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    components.forEach(component => {
      // Check for missing React.memo on reusable components
      if (component.reusabilityScore > 70 && !component.name.includes('memo')) {
        issues.push({
          component: component.name,
          type: 'unnecessary_renders',
          severity: 'medium',
          description: 'Highly reusable component without memoization',
          impact: 'Unnecessary re-renders in parent components',
          fix: 'Wrap component with React.memo() or implement useMemo for expensive calculations',
          estimatedImprovement: '20-40% render performance boost'
        })
      }

      // Check for large components (high complexity)
      if (component.complexity === 'critical') {
        issues.push({
          component: component.name,
          type: 'large_bundle',
          severity: 'high',
          description: 'Component has high complexity and large bundle size',
          impact: 'Increased initial load time and runtime performance',
          fix: 'Split into smaller components, implement lazy loading, or code splitting',
          estimatedImprovement: '30-50% bundle size reduction'
        })
      }

      // Check for missing cleanup in useEffect
      if (component.hooks.includes('useEffect') && component.linesOfCode > 100) {
        issues.push({
          component: component.name,
          type: 'memory_leak',
          severity: 'high',
          description: 'Component with useEffect hooks may have memory leaks',
          impact: 'Memory consumption increases over time',
          fix: 'Ensure all useEffect hooks have proper cleanup functions',
          estimatedImprovement: 'Prevent memory leaks and improve stability'
        })
      }
    })

    return issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
  }

  /**
   * Analyze accessibility compliance
   */
  static analyzeAccessibility(components: ComponentMetrics[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    components.forEach(component => {
      if (component.type === 'ui' || component.type === 'feature') {
        // Check for forms without proper labels
        if (component.name.toLowerCase().includes('form') && component.accessibilityScore < 80) {
          issues.push({
            component: component.name,
            type: 'missing_aria',
            severity: 'high',
            wcagLevel: 'AA',
            description: 'Form component missing proper ARIA labels and descriptions',
            fix: 'Add aria-label, aria-describedby, and proper form associations',
            impact: 'Screen readers cannot properly navigate form fields'
          })
        }

        // Check for interactive elements without keyboard support
        if (component.name.toLowerCase().includes('button') || component.name.toLowerCase().includes('modal')) {
          issues.push({
            component: component.name,
            type: 'keyboard_navigation',
            severity: 'medium',
            wcagLevel: 'AA',
            description: 'Interactive component may lack proper keyboard navigation',
            fix: 'Implement proper tabIndex, onKeyDown handlers, and focus management',
            impact: 'Users cannot navigate using keyboard only'
          })
        }

        // Check for data display components without screen reader support
        if (component.name.toLowerCase().includes('table') || component.name.toLowerCase().includes('chart')) {
          issues.push({
            component: component.name,
            type: 'screen_reader',
            severity: 'medium',
            wcagLevel: 'AA',
            description: 'Data display component needs screen reader optimization',
            fix: 'Add table headers, captions, and alternative text for charts',
            impact: 'Screen reader users cannot understand data presentation'
          })
        }
      }
    })

    return issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
  }

  /**
   * Generate component improvement recommendations
   */
  static generateRecommendations(analysis: ComponentAnalysis): ComponentRecommendation[] {
    const recommendations: ComponentRecommendation[] = []

    // Performance recommendations
    const criticalPerformanceIssues = analysis.performanceIssues.filter(issue => issue.severity === 'critical')
    if (criticalPerformanceIssues.length > 0) {
      recommendations.push({
        category: 'performance',
        priority: 'critical',
        title: 'Fix Critical Performance Issues',
        description: `${criticalPerformanceIssues.length} components have critical performance problems`,
        components: criticalPerformanceIssues.map(issue => issue.component),
        implementation: this.generatePerformanceFixImplementation(criticalPerformanceIssues),
        estimatedEffort: '4-8 hours',
        expectedBenefit: '40-60% performance improvement'
      })
    }

    // TypeScript migration
    const jsComponents = analysis.components.filter(comp => !comp.hasTypeScript)
    if (jsComponents.length > 0 && jsComponents.length < analysis.components.length / 2) {
      recommendations.push({
        category: 'maintainability',
        priority: 'high',
        title: 'Complete TypeScript Migration',
        description: `${jsComponents.length} components still use JavaScript`,
        components: jsComponents.map(comp => comp.name),
        implementation: this.generateTypeScriptMigration(),
        estimatedEffort: '2-4 hours',
        expectedBenefit: 'Better type safety and developer experience'
      })
    }

    // Accessibility improvements
    const criticalA11yIssues = analysis.accessibilityIssues.filter(issue => issue.severity === 'critical')
    if (criticalA11yIssues.length > 0) {
      recommendations.push({
        category: 'accessibility',
        priority: 'critical',
        title: 'Fix Critical Accessibility Issues',
        description: `${criticalA11yIssues.length} components have critical accessibility problems`,
        components: criticalA11yIssues.map(issue => issue.component),
        implementation: this.generateAccessibilityFixes(criticalA11yIssues),
        estimatedEffort: '3-6 hours',
        expectedBenefit: 'WCAG 2.1 AA compliance, improved user experience'
      })
    }

    // Design system compliance
    if (analysis.designSystemCompliance.score < 70) {
      recommendations.push({
        category: 'design_system',
        priority: 'medium',
        title: 'Improve Design System Compliance',
        description: `Components have ${analysis.designSystemCompliance.score}% design system compliance`,
        components: analysis.designSystemCompliance.issues.map(issue => issue.component),
        implementation: this.generateDesignSystemFixes(analysis.designSystemCompliance.issues),
        estimatedEffort: '2-4 hours',
        expectedBenefit: 'Consistent user experience and easier maintenance'
      })
    }

    return recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
  }

  /**
   * Generate component templates for common patterns
   */
  static generateComponentTemplates(): Record<string, string> {
    return {
      'data-table': `// Enterprise Data Table Component
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  onRowClick?: (row: T) => void
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  className?: string
}

const DataTable = <T,>({
  data,
  columns,
  loading = false,
  onRowClick,
  pagination = true,
  sorting = true,
  filtering = false,
  className
}: DataTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (loading) {
    return <DataTableSkeleton />
  }

  return (
    <div className={cn("space-y-4", className)}>
      {filtering && <DataTableToolbar table={table} />}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && <DataTablePagination table={table} />}
    </div>
  )
}`,

      'form-component': `// Validated Form Component with React Hook Form
interface FormComponentProps {
  onSubmit: (data: FormData) => Promise<void>
  initialValues?: Partial<FormData>
  disabled?: boolean
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'user', 'manager'])
})

type FormData = z.infer<typeof formSchema>

const FormComponent: React.FC<FormComponentProps> = ({
  onSubmit,
  initialValues,
  disabled = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      ...initialValues
    }
  })

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      toast({
        title: 'Success',
        description: 'Form submitted successfully'
      })
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit form',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter name"
                  {...field}
                  disabled={disabled || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email"
                  {...field}
                  disabled={disabled || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={disabled || isSubmitting}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={disabled || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={disabled || isSubmitting}
          >
            Reset
          </Button>
        </div>
      </form>
    </Form>
  )
}`,

      'dashboard-widget': `// Dashboard Widget Component
interface DashboardWidgetProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  value,
  change,
  icon,
  loading = false,
  onClick,
  className
}) => {
  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "p-6 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:shadow-primary/10",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              change.trend === 'up' && "text-green-600",
              change.trend === 'down' && "text-red-600",
              change.trend === 'neutral' && "text-muted-foreground"
            )}>
              {change.trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {change.trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {change.trend === 'neutral' && <Minus className="h-3 w-3" />}
              {Math.abs(change.value)}% vs {change.period}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}`
    }
  }

  /**
   * Generate performance fix implementations
   */
  private static generatePerformanceFixImplementation(issues: PerformanceIssue[]): string {
    return `// Performance Optimization Fixes
//
${issues.map(issue => `
// Fix for ${issue.component}: ${issue.type}
// Problem: ${issue.description}
// Solution: ${issue.fix}
// Expected Improvement: ${issue.estimatedImprovement}
`).join('\n')}

// Common Performance Patterns:

// 1. React.memo for preventing unnecessary renders
const OptimizedComponent = React.memo(({ data, onAction }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison logic if needed
  return prevProps.data === nextProps.data
})

// 2. useMemo for expensive calculations
const ExpensiveComponent = ({ data }) => {
  const expensiveValue = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0)
  }, [data])

  return <div>{expensiveValue}</div>
}

// 3. useCallback for stable function references
const ParentComponent = ({ items }) => {
  const handleItemClick = useCallback((id: string) => {
    // Handle click
  }, [])

  return (
    <div>
      {items.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onClick={handleItemClick} 
        />
      ))}
    </div>
  )
}

// 4. Lazy loading for code splitting
const LazyComponent = lazy(() => import('./HeavyComponent'))

const App = () => {
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <LazyComponent />
    </Suspense>
  )
}`
  }

  /**
   * Generate TypeScript migration guide
   */
  private static generateTypeScriptMigration(): string {
    return `// TypeScript Migration Guide
//
// 1. Add proper interface definitions for props
interface ComponentProps {
  title: string
  items: Item[]
  onSelect?: (item: Item) => void
  loading?: boolean
}

// 2. Type component properly
const Component: React.FC<ComponentProps> = ({ 
  title, 
  items, 
  onSelect, 
  loading = false 
}) => {
  // Component implementation
}

// 3. Add state typing
const [data, setData] = useState<Item[]>([])
const [loading, setLoading] = useState<boolean>(false)

// 4. Type custom hooks
const useCustomHook = (id: string): { data: Item | null; loading: boolean } => {
  const [data, setData] = useState<Item | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  
  return { data, loading }
}

// 5. Add event handler typing
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  // Handle form submission
}

const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  // Handle click
}`
  }

  /**
   * Generate accessibility fixes
   */
  private static generateAccessibilityFixes(issues: AccessibilityIssue[]): string {
    return `// Accessibility Fixes
//
${issues.map(issue => `
// Fix for ${issue.component}: ${issue.type}
// WCAG Level: ${issue.wcagLevel}
// Problem: ${issue.description}
// Solution: ${issue.fix}
`).join('\n')}

// Common Accessibility Patterns:

// 1. Proper form labeling
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-help"
    aria-required="true"
  />
  <p id="email-help">We'll never share your email</p>
</div>

// 2. Keyboard navigation
const Modal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <dialog 
      open={isOpen}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Modal content */}
    </dialog>
  )
}

// 3. Screen reader support for data tables
<Table role="table" aria-label="Project data">
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Progress</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
        <TableCell>
          <span aria-label={\`Status: \${row.status}\`}>
            {row.status}
          </span>
        </TableCell>
        <TableCell>
          <progress 
            value={row.progress} 
            max="100"
            aria-label={\`Progress: \${row.progress}%\`}
          >
            {row.progress}%
          </progress>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// 4. Focus management
const useFocusManagement = (isOpen: boolean) => {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])
}`
  }

  /**
   * Generate design system fixes
   */
  private static generateDesignSystemFixes(issues: DesignSystemIssue[]): string {
    return `// Design System Compliance Fixes
//
${issues.map(issue => `
// Fix for ${issue.component}: ${issue.type}
// Problem: ${issue.description}
// Solution: ${issue.fix}
`).join('\n')}

// Design System Best Practices:

// 1. Use design tokens consistently
const theme = {
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    muted: 'hsl(var(--muted))',
    // Use these instead of hardcoded colors
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    // Use these instead of arbitrary values
  }
}

// 2. Consistent component usage
// ✅ CORRECT - Use design system components
<Button variant="primary" size="md">
  Submit
</Button>

// ❌ WRONG - Custom styling
<button className="bg-blue-500 px-4 py-2 text-white">
  Submit  
</button>

// 3. Responsive design patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// 4. Typography consistency
<div>
  <h1 className="text-2xl font-bold text-foreground">Title</h1>
  <p className="text-base text-muted-foreground">Description</p>
</div>`
  }

  /**
   * Helper methods for priority and severity weights
   */
  private static getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  private static getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }
}