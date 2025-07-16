// Mock Data Generator for Formula PM 2.0
// Run with: node generate-mock-data.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Mock data generators
const generateUsers = () => [
  // Management Team
  { email: 'admin@formulapm.com', firstName: 'Admin', lastName: 'User', role: 'company_owner', department: 'Management' },
  { email: 'owner@formulapm.com', firstName: 'John', lastName: 'Owner', role: 'company_owner', department: 'Executive' },
  { email: 'gm@formulapm.com', firstName: 'Sarah', lastName: 'Manager', role: 'general_manager', department: 'Operations' },
  
  // Project Management
  { email: 'pm1@formulapm.com', firstName: 'Mike', lastName: 'Johnson', role: 'project_manager', department: 'Projects' },
  { email: 'pm2@formulapm.com', firstName: 'Lisa', lastName: 'Chen', role: 'project_manager', department: 'Projects' },
  { email: 'pm3@formulapm.com', firstName: 'David', lastName: 'Wilson', role: 'project_manager', department: 'Projects' },
  
  // Technical Team
  { email: 'architect1@formulapm.com', firstName: 'Emma', lastName: 'Taylor', role: 'architect', department: 'Design' },
  { email: 'engineer1@formulapm.com', firstName: 'James', lastName: 'Brown', role: 'technical_office', department: 'Engineering' },
  { email: 'engineer2@formulapm.com', firstName: 'Anna', lastName: 'Davis', role: 'technical_office', department: 'Engineering' },
  
  // Field Team
  { email: 'supervisor1@formulapm.com', firstName: 'Robert', lastName: 'Miller', role: 'site_supervisor', department: 'Field Operations' },
  { email: 'supervisor2@formulapm.com', firstName: 'Maria', lastName: 'Garcia', role: 'site_supervisor', department: 'Field Operations' },
  { email: 'worker1@formulapm.com', firstName: 'Tom', lastName: 'Anderson', role: 'field_worker', department: 'Construction' },
  { email: 'worker2@formulapm.com', firstName: 'Carlos', lastName: 'Rodriguez', role: 'field_worker', department: 'Construction' },
  
  // Support Teams
  { email: 'finance@formulapm.com', firstName: 'Jennifer', lastName: 'Lee', role: 'finance_team', department: 'Finance' },
  { email: 'purchase@formulapm.com', firstName: 'Kevin', lastName: 'White', role: 'purchase_department', department: 'Procurement' },
  { email: 'safety@formulapm.com', firstName: 'Patricia', lastName: 'Martinez', role: 'safety_officer', department: 'Safety' },
  
  // Clients
  { email: 'client1@testcorp.com', firstName: 'Michael', lastName: 'Thompson', role: 'client', department: 'Operations' },
  { email: 'client2@buildco.com', firstName: 'Susan', lastName: 'Clark', role: 'client', department: 'Development' },
  
  // External
  { email: 'supplier1@materials.com', firstName: 'Daniel', lastName: 'Lewis', role: 'supplier', department: 'Sales' },
  { email: 'subcontractor1@builders.com', firstName: 'Rachel', lastName: 'Hall', role: 'subcontractor', department: 'Construction' }
]

const generateProjects = (userIds) => [
  {
    name: 'Downtown Office Complex',
    description: 'Modern 15-story office building with retail space',
    status: 'in_progress',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    budget: 2500000.00,
    actualCost: 1200000.00,
    location: 'Downtown Business District',
    projectType: 'Commercial',
    priority: 1
  },
  {
    name: 'Residential Tower Phase 1',
    description: '25-story luxury residential tower with amenities',
    status: 'planning',
    startDate: '2024-03-01',
    endDate: '2025-08-15',
    budget: 4200000.00,
    actualCost: 150000.00,
    location: 'Waterfront District',
    projectType: 'Residential',
    priority: 1
  },
  {
    name: 'Shopping Mall Renovation',
    description: 'Complete renovation of existing shopping center',
    status: 'in_progress',
    startDate: '2023-11-01',
    endDate: '2024-06-30',
    budget: 1800000.00,
    actualCost: 1650000.00,
    location: 'Suburban Mall',
    projectType: 'Renovation',
    priority: 2
  },
  {
    name: 'Industrial Warehouse Complex',
    description: 'Multi-building warehouse and distribution center',
    status: 'completed',
    startDate: '2023-05-01',
    endDate: '2023-12-15',
    budget: 3200000.00,
    actualCost: 3150000.00,
    location: 'Industrial Park',
    projectType: 'Industrial',
    priority: 3
  },
  {
    name: 'School Campus Extension',
    description: 'New classroom building and sports facilities',
    status: 'planning',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    budget: 1500000.00,
    actualCost: 0.00,
    location: 'Education District',
    projectType: 'Educational',
    priority: 2
  }
]

const generateClients = () => [
  {
    companyName: 'TechCorp Industries',
    contactPerson: 'Michael Thompson',
    email: 'client1@testcorp.com',
    phone: '+1-555-0101',
    billingAddress: '123 Business Ave, Downtown, NY 10001'
  },
  {
    companyName: 'BuildCo Development',
    contactPerson: 'Susan Clark',
    email: 'client2@buildco.com',
    phone: '+1-555-0102',
    billingAddress: '456 Development St, Midtown, NY 10002'
  },
  {
    companyName: 'Metro Properties',
    contactPerson: 'Robert Johnson',
    email: 'contact@metroproperties.com',
    phone: '+1-555-0103',
    billingAddress: '789 Property Blvd, Uptown, NY 10003'
  }
]

async function createMockData() {
  console.log('🚀 Starting mock data generation...')
  
  try {
    // Step 1: Create users
    console.log('👥 Creating users...')
    const users = generateUsers()
    const createdUsers = []
    
    for (const user of users) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'testpass123',
        email_confirm: true,
        user_metadata: {
          full_name: `${user.firstName} ${user.lastName}`,
          role: user.role
        },
        app_metadata: {
          user_role: user.role
        }
      })
      
      if (authError && !authError.message.includes('already registered')) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError.message)
        continue
      }
      
      const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === user.email)?.id
      
      if (!userId) {
        console.error(`❌ Could not get user ID for ${user.email}`)
        continue
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
          department: user.department,
          company: 'Formula PM',
          is_active: true,
          hire_date: new Date().toISOString().split('T')[0],
          permissions: '{}'
        })
      
      if (profileError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, profileError.message)
        continue
      }
      
      createdUsers.push({ ...user, id: userId })
      console.log(`✅ Created user: ${user.email} (${user.role})`)
    }
    
    console.log(`✅ Created ${createdUsers.length} users`)
    
    // Step 2: Create clients
    console.log('🏢 Creating clients...')
    const clients = generateClients()
    const createdClients = []
    
    for (const client of clients) {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: client.companyName,
          contact_person: client.contactPerson,
          email: client.email,
          phone: client.phone,
          billing_address: client.billingAddress
        })
        .select()
      
      if (error) {
        console.error(`❌ Failed to create client ${client.companyName}:`, error.message)
        continue
      }
      
      createdClients.push(data[0])
      console.log(`✅ Created client: ${client.companyName}`)
    }
    
    // Step 3: Create projects
    console.log('📋 Creating projects...')
    const projects = generateProjects(createdUsers)
    const projectManagers = createdUsers.filter(u => u.role === 'project_manager')
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      const pm = projectManagers[i % projectManagers.length]
      const client = createdClients[i % createdClients.length]
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          description: project.description,
          status: project.status,
          start_date: project.startDate,
          end_date: project.endDate,
          budget: project.budget,
          actual_cost: project.actualCost,
          location: project.location,
          project_type: project.projectType,
          priority: project.priority,
          project_manager_id: pm.id,
          client_id: client.id,
          created_by: pm.id
        })
        .select()
      
      if (error) {
        console.error(`❌ Failed to create project ${project.name}:`, error.message)
        continue
      }
      
      console.log(`✅ Created project: ${project.name} (PM: ${pm.firstName} ${pm.lastName})`)
    }
    
    // Step 4: Create scope items and tasks for projects
    console.log('📝 Creating scope items and tasks...')
    const { data: createdProjects } = await supabase.from('projects').select('*')

    for (const project of createdProjects || []) {
      // Create scope items
      const scopeItems = [
        { name: 'Foundation Work', description: 'Excavation and foundation pouring', category: 'structural', status: 'completed', estimated_cost: 150000 },
        { name: 'Steel Framework', description: 'Steel structure installation', category: 'structural', status: 'in_progress', estimated_cost: 300000 },
        { name: 'Electrical Systems', description: 'Electrical wiring and systems', category: 'mep', status: 'not_started', estimated_cost: 120000 },
        { name: 'HVAC Installation', description: 'Heating and cooling systems', category: 'mep', status: 'not_started', estimated_cost: 180000 },
        { name: 'Interior Finishing', description: 'Flooring, painting, fixtures', category: 'finishing', status: 'not_started', estimated_cost: 200000 }
      ]

      for (const item of scopeItems) {
        const { data: scopeData, error: scopeError } = await supabase
          .from('scope_items')
          .insert({
            project_id: project.id,
            name: item.name,
            description: item.description,
            category: item.category,
            status: item.status,
            estimated_cost: item.estimated_cost,
            actual_cost: item.status === 'completed' ? item.estimated_cost * 0.95 : 0,
            created_by: project.project_manager_id
          })
          .select()

        if (scopeError) continue

        // Create tasks for each scope item
        const tasks = [
          { title: `Plan ${item.name}`, description: `Planning phase for ${item.name}`, status: 'completed', priority: 'high' },
          { title: `Execute ${item.name}`, description: `Implementation of ${item.name}`, status: item.status === 'completed' ? 'completed' : 'in_progress', priority: 'high' },
          { title: `Review ${item.name}`, description: `Quality review for ${item.name}`, status: 'pending', priority: 'medium' }
        ]

        for (const task of tasks) {
          await supabase.from('tasks').insert({
            project_id: project.id,
            scope_item_id: scopeData[0].id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigned_to: project.project_manager_id,
            created_by: project.project_manager_id,
            due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        }
      }
    }

    console.log('🎉 Mock data generation completed successfully!')
    console.log('\n📋 Test Credentials (All password: testpass123):')
    console.log('🔑 Admin: admin@formulapm.com')
    console.log('👨‍💼 Project Manager: pm1@formulapm.com')
    console.log('🏗️ Site Supervisor: supervisor1@formulapm.com')
    console.log('👷 Field Worker: worker1@formulapm.com')
    console.log('🏢 Client: client1@testcorp.com')
    console.log('💰 Finance: finance@formulapm.com')
    console.log('\n📊 Generated Data:')
    console.log(`• ${createdUsers.length} users across all roles`)
    console.log(`• ${createdClients.length} client companies`)
    console.log(`• ${createdProjects?.length || 0} projects with different statuses`)
    console.log(`• Scope items and tasks for each project`)
    console.log(`• Realistic budget and cost data`)

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the script
createMockData()
