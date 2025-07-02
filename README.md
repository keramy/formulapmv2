# Formula PM 2.0

A comprehensive construction project management system built with Next.js 15 and Supabase.

## 🏗️ Project Overview

Formula PM 2.0 is a modern construction project management platform designed to streamline project workflows, scope management, document approvals, and team collaboration across 13 different user roles.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Supabase (Database + Authentication)
- **UI Components**: Shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth with custom RBAC
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 👥 User Roles Supported

1. Company Owner
2. General Manager
3. Deputy General Manager
4. Technical Director
5. Admin
6. Project Manager
7. Architect
8. Technical Engineer
9. Purchase Director
10. Purchase Specialist
11. Field Worker
12. Client
13. Subcontractor

## 🎯 Key Features

### Wave 1 - Foundation
- ✅ Authentication system with 13 user roles
- ✅ Global sidebar navigation with permission-based filtering
- ✅ Project creation and management system
- ✅ Core UI framework with responsive design
- ✅ Database schema with RLS policies

### Wave 2 - Business Logic
- 🔄 4-category scope management (Construction, Millwork, Electrical, Mechanical)
- 🔄 Document approval workflows
- 🔄 Shop drawings integration
- 🔄 Purchase department workflows
- 🔄 Material specifications system

### Wave 3 - External Access
- 📋 Client portal system
- 📋 Mobile field interface (PWA)
- 📋 Subcontractor access controls

### Wave 4 - Optimization
- 📋 Performance optimization
- 📋 Real-time collaboration features
- 📋 Production deployment setup

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/keramy/FORMULAPMV2.git
cd FORMULAPMV2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Supabase:
- Create a new Supabase project
- Add your Supabase URL and anon key to `.env.local`
- Run the database migrations

5. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
FORMULAPMV2/
├── Planing App/                 # Comprehensive project documentation
│   ├── Wave-1-Foundation/       # Core system architecture
│   ├── Wave-2-Business-Logic/   # Business workflow implementations
│   ├── Wave-3-External-Access/  # Client and mobile interfaces
│   ├── Wave-4-Optimization/     # Performance and deployment
│   └── Implementation-Support/  # Development guidelines
├── Patterns/                    # Development patterns and templates
├── app/                         # Next.js 15 app directory
├── components/                  # Reusable UI components
├── lib/                         # Utility functions and configurations
├── types/                       # TypeScript type definitions
└── public/                      # Static assets
```

## 🔐 Authentication & Permissions

The system implements a comprehensive role-based access control (RBAC) system:

- **13 distinct user roles** with granular permissions
- **Global navigation** with authentication-based filtering
- **Project-level assignments** for role-based data access
- **Row Level Security (RLS)** at the database level

## 🧭 Global Navigation

Users can access key features directly through the global sidebar:
- **Tasks**: Role-filtered task management
- **Scope**: 4-category scope items with permissions
- **Shop Drawings**: Drawing management and approvals
- **Clients**: Client relationship management
- **Procurement**: Purchase orders and supplier management

## 📖 Documentation

Comprehensive documentation is available in the `Planing App/` directory:

- **Development Plan**: `updated_development_plan.md`
- **User Workflows**: `management_user_workflow.md`
- **Architecture Guides**: Individual wave documentation
- **Implementation Patterns**: `Patterns/` directory

## 🚢 Deployment

The application is designed for deployment on:
- **Frontend**: Vercel
- **Backend**: Supabase
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions, please contact the development team or create an issue in this repository.

---

**Formula PM 2.0** - Streamlining construction project management with modern technology.