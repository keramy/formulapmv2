# Company User Workflow Schema

## **Management Level Users**

```mermaid
graph TD
    MGMT[👔 Management Level Users] --> CO1[👑 Company Owner 1]
    MGMT --> CO2[👑 Company Owner 2]
    MGMT --> GM[🎯 General Manager]
    MGMT --> DGM[⚡ Deputy General Manager]
    MGMT --> TOD[🔧 Technical Office Director]
    MGMT --> ADMIN[⚙️ Admin - Kerem]
    
    %% Access Levels
    CO1 --> ACCESS[📊 Full Company Access]
    CO2 --> ACCESS
    GM --> ACCESS
    DGM --> ACCESS
    TOD --> ACCESS
    ADMIN --> ACCESS
    
    %% What They See
    ACCESS --> SEE1[📈 Overall Progress]
    ACCESS --> SEE2[🏗️ Project Completions]
    ACCESS --> SEE3[🏢 Projects on Tender Process]
    ACCESS --> SEE4[💰 Budgets & Financials]
    ACCESS --> SEE5[👥 Team Performance]
    ACCESS --> SEE6[🚨 Critical Issues]
    
    %% What They Can Do
    ACCESS --> DO1[✅ Approve Major Decisions]
    ACCESS --> DO2[📊 Generate Reports]
    ACCESS --> DO3[💰 Budget Overrides]
    ACCESS --> DO4[👥 Resource Allocation]
    ACCESS --> DO5[🎯 Set Company Goals]
    
    %% DGM Additional Powers
    DGM --> DGM_EXTRA1[📝 Create Tasks]
    DGM --> DGM_EXTRA2[👥 Assign Team Members]
    DGM --> DGM_EXTRA3[✅ Approve Supplier Selection]
    
    %% GM Additional Powers
    GM --> GM_EXTRA1[✅ Approve Supplier Selection]
    
    %% Project Managers Level
    PM_LEVEL[👷‍♂️ Project Managers] --> PM1[Project Manager 1]
    PM_LEVEL --> PM2[Project Manager 2]
    PM_LEVEL --> PM3[Project Manager 3]
    
    PM1 --> PM_ACCESS[🏗️ Project Management Access]
    PM2 --> PM_ACCESS
    PM3 --> PM_ACCESS
    
    %% What Project Managers See
    PM_ACCESS --> PM_SEE1[📋 Full App Access for Their Projects]
    PM_ACCESS --> PM_SEE2[📊 Project Progress]
    PM_ACCESS --> PM_SEE3[📐 Shop Drawings Status]
    PM_ACCESS --> PM_SEE4[📋 Material Specs Status]
    PM_ACCESS --> PM_SEE5[✅ Pending Approvals]
    PM_ACCESS --> PM_SEE6[📝 Site Reports]
    PM_ACCESS --> PM_SEE7[📝 Field Worker Reports]
    PM_ACCESS --> PM_SEE8[👥 Team Members & Tasks]
    
    %% What Project Managers Can Do
    PM_ACCESS --> PM_DO1[🆕 Create Projects]
    PM_ACCESS --> PM_DO2[📝 Add Scope Lists]
    PM_ACCESS --> PM_DO3[✏️ Edit Scope Lists]
    PM_ACCESS --> PM_DO4[📅 Create Timelines]
    PM_ACCESS --> PM_DO5[📐 Create Shop Drawing Lists]
    PM_ACCESS --> PM_DO6[✏️ Edit Shop Drawings]
    PM_ACCESS --> PM_DO7[📋 Create Material Specs]
    PM_ACCESS --> PM_DO8[📝 Create Tasks]
    PM_ACCESS --> PM_DO9[👥 Assign Team Members to Tasks]
    PM_ACCESS --> PM_DO10[✅ Manage Internal Approvals]
    PM_ACCESS --> PM_DO11[👥 Manage Client Approvals]
    PM_ACCESS --> PM_DO12[📝 Create Site Reports]
    PM_ACCESS --> PM_DO13[📞 Main Project Contact]
    PM_ACCESS --> PM_DO14[🏭 Select Scope Item Suppliers]
    PM_ACCESS --> PM_DO15[✅ Participate in Supplier Selection]
    PM_ACCESS --> PM_DO16[👀 Review Field Worker Reports]
    PM_ACCESS --> PM_DO17[📊 Create Internal Reports]
    PM_ACCESS --> PM_DO18[👥 Create Client Reports]
    
    %% Architectural Design Team
    ARCH_LEVEL[🎨 Architectural Design Team] --> ARCH1[Architect 1]
    ARCH_LEVEL --> ARCH2[Architect 2]
    ARCH_LEVEL --> ARCH3[Designer 1]
    
    ARCH1 --> ARCH_ACCESS[🎨 Design & Drawing Access]
    ARCH2 --> ARCH_ACCESS
    ARCH3 --> ARCH_ACCESS
    
    %% What Arch Team Sees
    ARCH_ACCESS --> ARCH_SEE1[📐 All Shop Drawings]
    ARCH_ACCESS --> ARCH_SEE2[📋 Project Scope Items]
    ARCH_ACCESS --> ARCH_SEE3[💬 Client Comments/Feedback]
    ARCH_ACCESS --> ARCH_SEE4[✅ Drawing Approval Status]
    ARCH_ACCESS --> ARCH_SEE5[📄 Project Documents]
    
    %% What Arch Team Can Do
    ARCH_ACCESS --> ARCH_DO1[🎨 Create Shop Drawings]
    ARCH_ACCESS --> ARCH_DO2[✏️ Edit Shop Drawings]
    ARCH_ACCESS --> ARCH_DO3[📤 Upload Drawings to System]
    ARCH_ACCESS --> ARCH_DO4[💬 Respond to Client Comments]
    ARCH_ACCESS --> ARCH_DO5[📋 Update Drawing Versions]
    ARCH_ACCESS --> ARCH_DO6[📥 Download Project Documents]
    
    %% Purchase Department
    PURCHASE[🛒 Purchase Department] --> PD[📊 Purchase Director]
    PURCHASE --> PS[📋 Purchase Specialist]
    
    PD --> PUR_ACCESS[💰 Procurement Access]
    PS --> PUR_ACCESS
    
    %% What Purchase Department See
    PUR_ACCESS --> PUR_SEE1[🏭 Supplier Database]
    PUR_ACCESS --> PUR_SEE2[📊 Scope Item Suppliers]
    PUR_ACCESS --> PUR_SEE3[💰 Project Payments by Client]
    PUR_ACCESS --> PUR_SEE4[💵 General Payment Overview]
    PUR_ACCESS --> PUR_SEE5[✅ Supplier Selection Status]
    
    %% What Purchase Department Can Do
    PUR_ACCESS --> PUR_DO1[🏭 Create Supplier Database]
    PUR_ACCESS --> PUR_DO2[✅ Select Suppliers with GM/DGM/PM]
    PUR_ACCESS --> PUR_DO3[📋 Assign Scope Items to Suppliers]
    PUR_ACCESS --> PUR_DO4[💰 Track Client Payments per Project]
    PUR_ACCESS --> PUR_DO5[📊 Monitor General Payments]
    PUR_ACCESS --> PUR_DO6[🔍 Evaluate Supplier Performance]
    
    %% Client Access Level
    CLIENT_LEVEL[👥 Client Access] --> CL1[Client 1]
    CLIENT_LEVEL --> CL2[Client 2]
    CLIENT_LEVEL --> CL3[Client 3]
    
    CL1 --> CLIENT_ACCESS[📋 Project View Access]
    CL2 --> CLIENT_ACCESS
    CL3 --> CLIENT_ACCESS
    
    %% What Clients See
    CLIENT_ACCESS --> CLIENT_SEE1[📋 Their Project Scope Items]
    CLIENT_ACCESS --> CLIENT_SEE2[📐 Shop Drawings]
    CLIENT_ACCESS --> CLIENT_SEE3[✅ Approval Statuses]
    CLIENT_ACCESS --> CLIENT_SEE4[📸 Shared Photo Galleries]
    CLIENT_ACCESS --> CLIENT_SEE5[📊 Shared Progress Reports]
    CLIENT_ACCESS --> CLIENT_SEE6[📅 Timeline Updates]
    CLIENT_ACCESS --> CLIENT_SEE7[📄 Project Documents]
    
    %% What Clients Can Do
    CLIENT_ACCESS --> CLIENT_DO1[📐 Review Shop Drawings]
    CLIENT_ACCESS --> CLIENT_DO2[✅ Approve/Reject Drawings]
    CLIENT_ACCESS --> CLIENT_DO3[💬 Add Comments]
    CLIENT_ACCESS --> CLIENT_DO4[📤 Upload Documents]
    CLIENT_ACCESS --> CLIENT_DO5[📥 Download Documents]
    CLIENT_ACCESS --> CLIENT_DO6[🔔 Send Notifications to PM]
    
    %% External Subcontractors
    SUB_LEVEL[🔧 External Subcontractors] --> SUB1[Subcontractor 1]
    SUB_LEVEL --> SUB2[Subcontractor 2]
    SUB_LEVEL --> SUB3[Subcontractor 3]
    
    SUB1 --> SUB_ACCESS[📝 Limited Project Access]
    SUB2 --> SUB_ACCESS
    SUB3 --> SUB_ACCESS
    
    %% What Subcontractors Can Do
    SUB_ACCESS --> SUB_DO1[📝 Create Reports for Assigned Projects]
    SUB_ACCESS --> SUB_DO2[📸 Upload Progress Photos]
    SUB_ACCESS --> SUB_DO3[✅ Update Task Status]
    
    %% Technical Office Engineers (Updated)
    TECH_OFFICE[📐 Technical Office Engineers] --> TO1[Technical Engineer 1]
    TECH_OFFICE --> TO2[Technical Engineer 2]
    TECH_OFFICE --> TO3[Technical Engineer 3]
    
    TO1 --> TO_ACCESS[📋 Tender & Proposal Access]
    TO2 --> TO_ACCESS
    TO3 --> TO_ACCESS
    
    %% What Technical Office Engineers See
    TO_ACCESS --> TO_SEE1[📄 Client Bidding Projects]
    TO_ACCESS --> TO_SEE2[📊 BOQ Status]
    TO_ACCESS --> TO_SEE3[💰 Cost Analysis]
    TO_ACCESS --> TO_SEE4[📋 Proposal Status]
    TO_ACCESS --> TO_SEE5[📈 Scope Lists with Prices]
    
    %% What Technical Office Engineers Can Do
    TO_ACCESS --> TO_DO1[📄 Examine Client Projects]
    TO_ACCESS --> TO_DO2[📊 Prepare BOQ]
    TO_ACCESS --> TO_DO3[💰 Create Cost Analysis]
    TO_ACCESS --> TO_DO4[📋 Prepare Proposals]
    TO_ACCESS --> TO_DO5[📤 Upload Scope Lists via Excel]
    TO_ACCESS --> TO_DO6[💵 Set Selling Prices]
    
    %% Mobile Field Features
    MOBILE_FEATURES[📱 Mobile Field Features] --> MOB1[📝 Mobile Report Creation]
    MOBILE_FEATURES --> MOB2[📸 Photo Upload on Site]
    MOBILE_FEATURES --> MOB3[🌍 GPS Location (Future)]
    
    %% Notification System
    NOTIFICATIONS[🔔 Notification System] --> NOT1[📝 Task Created & Assigned]
    NOTIFICATIONS --> NOT2[📊 Report Shared Internally]
    NOTIFICATIONS --> NOT3[📈 Daily EOD Progress Reports]
    NOTIFICATIONS --> NOT4[📐 Shop Drawing Approvals]
    
    %% Field Level Workers (Updated)
    FIELD_LEVEL[🔨 Field Level Workers] --> FL1[Field Worker 1]
    FIELD_LEVEL --> FL2[Field Worker 2]
    FIELD_LEVEL --> FL3[Field Worker 3]
    
    FL1 --> FIELD_ACCESS[🏗️ Site Access]
    FL2 --> FIELD_ACCESS
    FL3 --> FIELD_ACCESS
    
    %% What Field Workers See (No Prices)
    FIELD_ACCESS --> FIELD_SEE1[📋 Project Scope]
    FIELD_ACCESS --> FIELD_SEE2[📐 Project Drawings/Shop Drawings]
    FIELD_ACCESS --> FIELD_SEE3[📅 Timeline]
    FIELD_ACCESS --> FIELD_SEE4[📝 Their Assigned Tasks]
    FIELD_ACCESS --> FIELD_SEE5[📄 Download/View Documents]
    
    %% What Field Workers Can Do (Mobile Focused)
    FIELD_ACCESS --> FIELD_DO1[📱 Create Mobile Reports on Site]
    FIELD_ACCESS --> FIELD_DO2[📸 Upload Progress Photos with Reports]
    FIELD_ACCESS --> FIELD_DO3[✅ Update Task Status]
    FIELD_ACCESS --> FIELD_DO4[🚨 Report Issues/Problems]
    FIELD_ACCESS --> FIELD_DO5[📥 Download Documents]
    
    %% Styling
    classDef management fill:#1a237e,stroke:#000051,stroke-width:2px,color:#fff
    classDef access fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef visibility fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef actions fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef pm_level fill:#4a148c,stroke:#1a237e,stroke-width:2px,color:#fff
    classDef pm_access fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px
    classDef pm_functions fill:#f8bbd9,stroke:#880e4f,stroke-width:2px
    classDef dgm_extra fill:#ff6f00,stroke:#e65100,stroke-width:2px,color:#fff
    classDef to_level fill:#2e7d32,stroke:#1b5e20,stroke-width:2px,color:#fff
    classDef to_access fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    classDef to_functions fill:#a5d6a7,stroke:#388e3c,stroke-width:2px
    classDef pur_level fill:#d84315,stroke:#bf360c,stroke-width:2px,color:#fff
    classDef pur_access fill:#ffccbc,stroke:#ff5722,stroke-width:2px
    classDef pur_functions fill:#ffab91,stroke:#f4511e,stroke-width:2px
    classDef field_level fill:#5d4037,stroke:#3e2723,stroke-width:2px,color:#fff
    classDef field_access fill:#d7ccc8,stroke:#8d6e63,stroke-width:2px
    classDef field_functions fill:#bcaaa4,stroke:#6d4c41,stroke-width:2px
    
    class MGMT,CO1,CO2,GM,DGM,TOD,ADMIN management
    class ACCESS access
    class SEE1,SEE2,SEE3,SEE4,SEE5,SEE6 visibility
    class DO1,DO2,DO3,DO4,DO5 actions
    class DGM_EXTRA1,DGM_EXTRA2,DGM_EXTRA3,GM_EXTRA1 dgm_extra
    class PM_LEVEL,PM1,PM2,PM3 pm_level
    class PM_ACCESS pm_access
    class PM_SEE1,PM_SEE2,PM_SEE3,PM_SEE4,PM_SEE5,PM_SEE6,PM_SEE7,PM_DO1,PM_DO2,PM_DO3,PM_DO4,PM_DO5,PM_DO6,PM_DO7,PM_DO8,PM_DO9,PM_DO10,PM_DO11,PM_DO12,PM_DO13,PM_DO14,PM_DO15 pm_functions
    class TECH_OFFICE,TO1,TO2,TO3 to_level
    class TO_ACCESS to_access
    class TO_SEE1,TO_SEE2,TO_SEE3,TO_SEE4,TO_SEE5,TO_DO1,TO_DO2,TO_DO3,TO_DO4,TO_DO5,TO_DO6 to_functions
    class PURCHASE,PD,PS pur_level
    class PUR_ACCESS pur_access
    class PUR_SEE1,PUR_SEE2,PUR_SEE3,PUR_SEE4,PUR_SEE5,PUR_DO1,PUR_DO2,PUR_DO3,PUR_DO4,PUR_DO5,PUR_DO6 pur_functions
    class FIELD_LEVEL,FL1,FL2,FL3 field_level
    class FIELD_ACCESS field_access
    class FIELD_SEE1,FIELD_SEE2,FIELD_SEE3,FIELD_SEE4,FIELD_SEE5,FIELD_DO1,FIELD_DO2,FIELD_DO3,FIELD_DO4,FIELD_DO5 field_functions
    
    class ARCH_LEVEL,ARCH1,ARCH2,ARCH3 arch_level
    class ARCH_ACCESS arch_access
    class ARCH_SEE1,ARCH_SEE2,ARCH_SEE3,ARCH_SEE4,ARCH_SEE5,ARCH_DO1,ARCH_DO2,ARCH_DO3,ARCH_DO4,ARCH_DO5,ARCH_DO6 arch_functions
    
    %% Updated Styling for Report System
    classDef report_system fill:#9c27b0,stroke:#6a1b9a,stroke-width:2px,color:#fff
    classDef report_features fill:#e1bee7,stroke:#9c27b0,stroke-width:2px
    
    class REPORT_SYSTEM,REPORT1,REPORT2,REPORT3,REPORT4,REPORT5 report_system
    class REPORT_FEATURES,RF1,RF2,RF3,RF4,RF5,RF6,RF7,RF8 report_features
```

---

## **Management Information Hierarchy**

### **Level 1: Strategic Overview (First Screen)**
- **Company Health Score** - Single metric (Green/Yellow/Red)
- **Key Performance Indicators**
  - Active Projects: X projects
  - Monthly Revenue: $XXX,XXX
  - Projects On Time: XX%
  - Budget Performance: +/- XX%

### **Level 2: Operational Insights (One Click)**
- **Project Portfolio Status**
  - Projects requiring attention
  - Upcoming milestones
  - Resource conflicts
- **Financial Performance**
  - Cash flow position
  - Profit margin trends
  - Cost variance alerts

### **Level 3: Detailed Analysis (Two Clicks)**
- **Individual Project Deep Dive**
- **Team Performance Analytics**
- **Client Satisfaction Metrics**
- **Operational Efficiency Reports**

---

## **Decision Points for Management Users**

### **Daily Decisions**
- Which projects need immediate attention?
- Resource reallocation needs?
- Client communication priorities?

### **Weekly Decisions**
- Project timeline adjustments
- Budget variance approvals
- Team performance reviews

### **Monthly Decisions**
- Strategic planning adjustments
- Investment in new resources
- Process improvement initiatives

---

## **Management User Permissions**

### **Full Access Rights**
- ✅ View all projects
- ✅ View all financial data
- ✅ View team performance
- ✅ Access all reports
- ✅ Override project decisions
- ✅ Approve budget changes
- ✅ Access audit trails

### **Key Management Actions**
- 📊 Generate executive reports
- 💰 Approve budget variances
- 👥 Reassign resources
- 📝 Add strategic notes
- 🚨 Set priority levels
- 📞 Escalate critical issues

---

## **Alert System for Management**

### **Immediate Alerts (Real-time)**
- 🔴 Project budget exceeded by >10%
- 🔴 Critical timeline delay
- 🔴 Quality failure requiring rework
- 🔴 Client complaint escalation

### **Daily Digest**
- 📊 Yesterday's progress summary
- 💰 Financial position update
- ⚠️ Items requiring attention
- 🎯 Goals vs actuals

### **Weekly Reports**
- 📈 Company performance trends
- 💼 Project portfolio health
- 👥 Team productivity analysis
- 💰 Financial performance review