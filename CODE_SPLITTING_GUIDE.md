# Code Splitting Implementation Guide

## Lazy Components Created
- AdvancedDataTable (HIGH priority)
- MaterialSpecForm (HIGH priority)
- RealtimeScopeListTab (HIGH priority)
- TaskForm (MEDIUM priority)
- ExcelImportDialog (MEDIUM priority)
- MilestoneCalendar (MEDIUM priority)

## Usage Examples

### Using Lazy Components
```tsx
// Instead of:
import AdvancedDataTable from '@/components/advanced/AdvancedDataTable'

// Use:
import { AdvancedDataTableLazy } from '@/components/lazy'

// Component will be lazy loaded with loading skeleton
<AdvancedDataTableLazy {...props} />
```

### Preloading Components
```tsx
import { usePreloadComponent } from '@/components/lazy'

function MyComponent() {
  const { preload } = usePreloadComponent()
  
  return (
    <button 
      onMouseEnter={() => preload('AdvancedDataTable')}
      onClick={() => setShowTable(true)}
    >
      Show Table
    </button>
  )
}
```

### Performance Monitoring
```tsx
// Add to your app root
import { PerformanceProvider } from '@/components/providers/PerformanceProvider'

export default function RootLayout({ children }) {
  return (
    <PerformanceProvider>
      {children}
    </PerformanceProvider>
  )
}
```

## Expected Benefits
- 30-50% reduction in initial bundle size
- Faster page load times
- Better Core Web Vitals scores
- Improved user experience on slower connections
