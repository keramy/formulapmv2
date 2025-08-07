# Formula PM 3.0 - Architecture & Technology Stack

## 🏗️ Core Technology Stack

### Framework & Runtime
- **Next.js 15** with App Router (NOT Pages Router)
- **TypeScript** - Type safety throughout
- **React 18+** - Latest React features

### Database & Authentication  
- **Supabase PostgreSQL** - Keep existing excellent schema
- **Supabase Auth** - Simplified implementation (no complex hooks)

### Styling & UI Components
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - High-quality, customizable components
- **lucide-react** - Consistent icon system

## 📦 Strategic Libraries

### Data Management
- **@tanstack/react-query** - Server state management, caching, background updates
- **@tanstack/react-table** - Complex data tables (scope items, material specs)

### Forms & Validation
- **react-hook-form** - Performant form handling
- **zod** - Schema validation for forms and API

### Date & Time
- **date-fns** or **dayjs** - Date manipulation for timelines, milestones, Gantt charts

### File Handling
- **react-dropzone** - Drag & drop file uploads for drawings, documents
- **xlsx** or **exceljs** - Excel import/export for scope items

### Visualizations
- **recharts** - Charts, Gantt charts, progress tracking

### PDF Generation
- **@react-pdf/renderer** or **jspdf** - Generate PDF reports

### User Feedback
- **sonner** or **react-hot-toast** - Toast notifications

## 🚀 Deployment

### Primary: Vercel
- Zero-config Next.js deployment
- Automatic preview deployments
- Built-in performance optimization
- $0 development, $20/month production

### Alternative: Azure Static Web Apps
- If Azure ecosystem is required
- Good integration with Azure services

### NOT Using
- ❌ Docker - Unnecessary complexity
- ❌ Kubernetes - Overkill for this project
- ❌ Complex CI/CD pipelines - Vercel handles it

## 🎯 Architecture Principles

### DO's
✅ **Server Components by default** - Better performance, less client JS
✅ **Component-level permissions** - Filter data in components, not routes
✅ **Smart caching with React Query** - Reduce unnecessary API calls
✅ **Parallel data fetching** - Load multiple resources simultaneously
✅ **Optimistic updates** - Instant UI feedback

### DON'Ts
❌ **Route-level permission blocking** - Slows navigation
❌ **Complex state management** - React Query handles most needs
❌ **Over-abstracted components** - Keep components simple and focused
❌ **Manual cache management** - Let React Query handle it
❌ **Premature optimization** - Build first, optimize based on real usage

## 📁 Project Structure

```
formulapmv3/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── projects/           # Project workspace
│   │   │   └── [id]/          # Dynamic project routes
│   │   └── dashboard/          # Dashboard
│   ├── components/             # React components
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── forms/             # Form components
│   │   └── layouts/           # Layout components
│   ├── hooks/                 # Custom React hooks
│   │   ├── auth/              # Auth hooks (< 50 lines each)
│   │   └── permissions/       # Permission hooks
│   ├── lib/                   # Utilities
│   │   ├── supabase/         # Supabase client
│   │   └── utils/            # Helper functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── package.json              # Dependencies
```

## 🔧 Development Tools

### Required
- Node.js 18+
- npm or pnpm
- Git

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

## 💡 Key Technical Decisions

1. **App Router over Pages Router** - Better performance, layouts, server components
2. **React Query over Redux** - Simpler, built for server state
3. **Shadcn/ui over Material-UI** - More control, smaller bundle
4. **Zod over Yup** - Better TypeScript integration
5. **Vercel over custom hosting** - Zero-config, optimized for Next.js

---

*Last Updated: January 2025*
*Status: Approved Stack*
*Next Step: Revolutionary RBAC System*