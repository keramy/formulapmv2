/**
 * Lazy loaded components index
 * Centralized exports for all lazy loaded components
 */

// High priority lazy components
export { default as AdvancedDataTableLazy } from './AdvancedDataTableLazy'
export { default as MaterialSpecFormLazy } from './MaterialSpecFormLazy'
export { default as RealtimeScopeListTabLazy } from './RealtimeScopeListTabLazy'

// Medium priority lazy components
export { default as TaskFormLazy } from './TaskFormLazy'
export { default as ExcelImportDialogLazy } from './ExcelImportDialogLazy'
export { default as MilestoneCalendarLazy } from './MilestoneCalendarLazy'

// Utility function to preload components
export function preloadComponent(componentName: string) {
  switch (componentName) {
    case 'AdvancedDataTable':
      return import('./AdvancedDataTableLazy')
    case 'MaterialSpecForm':
      return import('./MaterialSpecFormLazy')
    case 'RealtimeScopeListTab':
      return import('./RealtimeScopeListTabLazy')
    case 'TaskForm':
      return import('./TaskFormLazy')
    case 'ExcelImportDialog':
      return import('./ExcelImportDialogLazy')
    case 'MilestoneCalendar':
      return import('./MilestoneCalendarLazy')
    default:
      console.warn(`Unknown component for preloading: ${componentName}`)
      return Promise.resolve()
  }
}

// Hook for preloading components on hover or focus
export function usePreloadComponent() {
  const preload = (componentName: string) => {
    preloadComponent(componentName)
  }

  return { preload }
}
