// Base skeleton components
export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard,
  skeletonWaveCSS
} from './Skeleton';

// Specialized skeleton components
export { 
  ProjectCardSkeleton, 
  ProjectCardsSkeleton 
} from './ProjectCardSkeleton';

export { 
  TaskListSkeleton, 
  TaskBoardSkeleton 
} from './TaskListSkeleton';

export { 
  DashboardSkeleton 
} from './DashboardSkeleton';

export { 
  DataTableSkeleton, 
  SimpleTableSkeleton, 
  StatsTableSkeleton 
} from './DataTableSkeleton';

// Skeleton utility types
export type SkeletonVariant = 'default' | 'rounded' | 'circular' | 'text' | 'rectangular';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';
export type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';

// Skeleton configuration presets
export const SkeletonPresets = {
  // Common use cases
  button: { variant: 'rounded' as const, className: 'h-10 w-24' },
  avatar: { variant: 'circular' as const, className: 'w-10 h-10' },
  text: { variant: 'text' as const, className: 'h-4' },
  title: { variant: 'default' as const, className: 'h-6 w-48' },
  
  // Card components
  cardHeader: { variant: 'default' as const, className: 'h-6 w-40 mb-2' },
  cardContent: { variant: 'text' as const, className: 'h-4 mb-1' },
  
  // Table components
  tableHeader: { variant: 'default' as const, className: 'h-4 w-20' },
  tableCell: { variant: 'default' as const, className: 'h-4 w-full' },
  
  // Form components
  input: { variant: 'rounded' as const, className: 'h-10 w-full' },
  select: { variant: 'rounded' as const, className: 'h-10 w-32' },
  
  // Status indicators
  badge: { variant: 'rounded' as const, className: 'h-5 w-16' },
  statusDot: { variant: 'circular' as const, className: 'w-3 h-3' },
} as const;

// Helper functions
export const createSkeletonArray = (count: number, component: React.ComponentType) => 
  Array.from({ length: count }, (_, i) => ({ key: i, component }));

export const getRandomSkeletonWidth = (min = 50, max = 100) => 
  `${Math.floor(Math.random() * (max - min) + min)}%`;

// Animation CSS classes
export const skeletonAnimations = {
  pulse: 'animate-pulse',
  wave: 'animate-wave bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
  none: ''
};

// Theme-aware colors
export const skeletonColors = {
  light: {
    primary: 'bg-gray-200',
    secondary: 'bg-gray-100',
    tertiary: 'bg-gray-50'
  },
  dark: {
    primary: 'bg-gray-800',
    secondary: 'bg-gray-700',
    tertiary: 'bg-gray-600'
  }
};