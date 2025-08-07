# Formula PM V3 - Package Dependencies

## Core Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    
    "supabase": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0",
    
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    
    "tailwindcss": "^3.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    
    "date-fns": "^3.0.0",
    "recharts": "^2.0.0",
    "lucide-react": "^0.400.0",
    
    "react-dropzone": "^14.0.0",
    "xlsx": "^0.18.0",
    "@react-pdf/renderer": "^3.0.0",
    "sonner": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "@tailwindcss/forms": "^0.5.0",
    "@tailwindcss/typography": "^0.5.0"
  }
}
```

## Installation Commands

```bash
# Core Next.js and React
npm install next@^15.0.0 react@^18.0.0 react-dom@^18.0.0 typescript@^5.0.0

# Supabase
npm install @supabase/supabase-js@^2.0.0

# Data Management
npm install @tanstack/react-query@^5.0.0 @tanstack/react-table@^8.0.0

# Forms and Validation
npm install react-hook-form@^7.0.0 zod@^3.0.0

# UI Components (Shadcn/ui dependencies)
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-checkbox @radix-ui/react-tabs class-variance-authority clsx tailwind-merge

# Utilities
npm install date-fns@^3.0.0 recharts@^2.0.0 lucide-react@^0.400.0

# File Handling
npm install react-dropzone@^14.0.0 xlsx@^0.18.0 @react-pdf/renderer@^3.0.0

# Notifications
npm install sonner@^1.0.0

# Styling
npm install tailwindcss@^3.0.0 @tailwindcss/forms @tailwindcss/typography

# Dev Dependencies
npm install -D @types/node @types/react @types/react-dom eslint eslint-config-next prettier
```

## Shadcn/ui Setup Commands

```bash
# Initialize Shadcn/ui
npx shadcn-ui@latest init

# Add core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
```

## Copy from V2
- Environment variables (.env.local)
- Supabase configuration
- TypeScript types (adapt for permissions)
- Database migrations (all of them)