# Purchase Department Workflow Pattern

## Overview
The Purchase Department Workflow pattern provides a simplified procurement management system for construction projects, focusing on core functionality without complex payment processing or time-consuming delivery management.

## Pattern Classification
**Type**: Business Process Pattern  
**Complexity**: High  
**Dependencies**: Authentication, Project Management, Scope Management  
**User Roles**: purchase_director, purchase_specialist, project_manager, site_engineer, field_worker

## Core Components

### Database Schema
```sql
-- Core tables for simplified purchase workflow
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  requester_id UUID NOT NULL REFERENCES user_profiles(user_id),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  item_description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  estimated_cost DECIMAL(10,2),
  required_date DATE NOT NULL,
  urgency_level urgency_level NOT NULL DEFAULT 'normal',
  justification TEXT,
  status request_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  total_amount DECIMAL(10,2) NOT NULL,
  po_date DATE NOT NULL,
  expected_delivery_date DATE,
  status po_status NOT NULL DEFAULT 'draft',
  terms_conditions TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  payment_terms VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  rater_id UUID NOT NULL REFERENCES user_profiles(user_id),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  delivery_score INTEGER CHECK (delivery_score >= 1 AND delivery_score <= 5),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id),
  approver_role user_role NOT NULL,
  approver_id UUID REFERENCES user_profiles(user_id),
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  confirmed_by UUID NOT NULL REFERENCES user_profiles(user_id),
  delivery_date DATE NOT NULL,
  quantity_received DECIMAL(10,2) NOT NULL,
  quantity_ordered DECIMAL(10,2) NOT NULL,
  condition_notes TEXT,
  photos TEXT[], -- Array of photo URLs
  status delivery_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enums
CREATE TYPE urgency_level AS ENUM ('low', 'normal', 'high', 'emergency');
CREATE TYPE request_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled');
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'confirmed', 'delivered', 'completed', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'delegated');
CREATE TYPE delivery_status AS ENUM ('pending', 'partial', 'completed', 'damaged', 'rejected');
```

### API Routes Structure
```
/api/purchase/
  ├── requests/
  │   ├── GET    /          # List requests (filtered by role)
  │   ├── POST   /          # Create request
  │   ├── GET    /[id]      # Get specific request
  │   ├── PUT    /[id]      # Update request
  │   └── DELETE /[id]      # Delete request
  ├── orders/
  │   ├── GET    /          # List orders
  │   ├── POST   /          # Create order
  │   ├── GET    /[id]      # Get specific order
  │   └── PUT    /[id]      # Update order
  ├── vendors/
  │   ├── GET    /          # List vendors
  │   ├── POST   /          # Create vendor
  │   ├── GET    /[id]      # Get vendor details
  │   ├── PUT    /[id]      # Update vendor
  │   └── POST   /[id]/rate # Rate vendor
  ├── approvals/
  │   ├── GET    /pending   # Get pending approvals
  │   ├── POST   /[id]      # Approve/reject request
  │   └── GET    /history   # Approval history
  └── deliveries/
      ├── GET    /pending   # Pending deliveries
      ├── POST   /[id]      # Confirm delivery
      └── GET    /history   # Delivery history
```

### Component Architecture
```
PurchaseCoordinator (Main orchestrator)
├── PurchaseRequestManager
│   ├── RequestForm
│   ├── RequestList
│   └── RequestDetails
├── PurchaseOrderManager
│   ├── OrderForm
│   ├── OrderList
│   └── OrderDetails
├── VendorManager
│   ├── VendorDatabase
│   ├── VendorRating
│   └── VendorSelection
├── ApprovalWorkflow
│   ├── ApprovalQueue
│   ├── ApprovalActions
│   └── ApprovalHistory
└── DeliveryConfirmation
    ├── DeliveryForm
    ├── DeliveryList
    └── DeliveryPhotos
```

## Implementation Requirements

### Authentication & Authorization
- **Role-based access**: purchase_director, purchase_specialist, project_manager
- **Field access**: field_worker can confirm deliveries
- **Site access**: site_engineer can create requests
- **Cost visibility**: Restricted to authorized roles only

### Business Rules
1. **Approval Workflow**: 
   - Site Engineer → Project Manager → Purchase Department
   - Emergency requests can skip to Purchase Department
   - Amount-based approval thresholds

2. **Vendor Management**:
   - Only active vendors can receive orders
   - PM ratings required after project completion
   - Rating system: 1-5 scale for quality, delivery, communication

3. **Order Processing**:
   - Email integration for PO sending
   - Phone confirmation tracking
   - Simple delivery confirmation (no complex scheduling)

4. **Cost Control**:
   - Budget validation against project allocations
   - Real-time cost tracking
   - Expense reporting (no payment processing)

### Performance Requirements
- **API Response**: <200ms for all endpoints
- **Database**: Strategic indexing on frequently queried fields
- **Mobile**: Touch-optimized interface for field workers
- **Offline**: Basic offline capability for delivery confirmations

### Security Requirements
- **RLS Policies**: Project-based access control
- **Input Validation**: Zod schemas for all API inputs
- **Audit Trail**: Complete transaction history
- **File Upload**: Secure photo upload for deliveries

## Integration Points

### Existing Systems
- **Project Management**: Link requests to projects and budgets
- **Scope Management**: Connect to scope items and cost tracking
- **Task Management**: Use @mention system for approvals
- **Notification System**: Real-time alerts for status changes

### External Communications
- **Email Integration**: Automated PO sending to vendors
- **Phone Integration**: Track phone confirmations
- **Document Storage**: Secure storage for delivery photos

## Mobile Considerations
- **Field Worker Access**: Simple delivery confirmation
- **Manager Approval**: Mobile-friendly approval interface
- **Photo Upload**: Camera integration for delivery documentation
- **Offline Mode**: Queue actions when offline

## Simplified Approach
- **No Complex Payment**: Track expenses only, no payment processing
- **No Advanced Scheduling**: Basic delivery confirmation
- **No Over-Engineering**: Focus on core procurement workflow
- **Email/Phone Orders**: System tracks but doesn't replace traditional communication

## Quality Metrics
- **Evaluation Target**: 90+ score required
- **Pattern Compliance**: Must follow Formula PM conventions
- **TypeScript Coverage**: 100% type safety
- **Security**: Role-based access throughout
- **Performance**: Sub-200ms response times

## Success Indicators
- Streamlined purchase request process
- Improved vendor management with PM ratings
- Basic order tracking and delivery confirmation
- Cost visibility and budget compliance
- Mobile accessibility for field operations

## Implementation Notes
- Follow existing Formula PM patterns exactly
- Use Supabase for database operations
- Implement using Next.js 15 App Router
- Use Shadcn/ui for consistent UI components
- Maintain compatibility with existing authentication system