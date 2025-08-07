# Formula PM 3.0 - Deployment Guide

## 🚀 Vercel Deployment (Recommended)

### Why Vercel for Construction Management
- Zero configuration for Next.js 15
- Fast global CDN for field workers
- Automatic HTTPS and SSL certificates  
- Preview deployments for testing
- Environment variable management
- $0 for development, $20/month production

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial Formula PM V3 setup"
   git branch -M main
   git remote add origin https://github.com/username/formulapmv3.git
   git push -u origin main
   ```

2. **Connect Vercel**
   - Go to vercel.com and sign in
   - Click "New Project"  
   - Import from GitHub repository
   - Select formulapmv3 repository

3. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

4. **Deploy**
   - Vercel auto-deploys on git push
   - Check deployment logs for issues
   - Test production environment

### Custom Domain Setup
1. Go to Vercel project settings
2. Add custom domain (e.g., app.yourcompany.com)
3. Configure DNS records as shown
4. SSL certificate auto-generated

## 🗄️ Database Setup

### Production Database Migration
```bash
# Apply all v2 migrations to production database
supabase db push --project-ref your-prod-project-ref

# Apply v3 permission enhancements
supabase migration up --project-ref your-prod-project-ref
```

### User Migration Script
```sql
-- Migrate existing v2 users to v3 permission system
UPDATE user_profiles SET 
  permissions = CASE role
    WHEN 'management' THEN ARRAY['admin_panel_access', 'manage_users', 'create_projects', 'view_all_projects', 'view_project_costs', 'approve_expenses']
    WHEN 'project_manager' THEN ARRAY['create_projects', 'edit_projects', 'view_project_costs', 'assign_team_members', 'internal_review_drawings']
    WHEN 'technical_lead' THEN ARRAY['create_shop_drawings', 'internal_review_drawings', 'create_material_specs', 'submit_to_client']
    WHEN 'client' THEN ARRAY['view_assigned_projects', 'review_submitted_drawings', 'view_milestones']
    ELSE ARRAY[]::text[]
  END,
  job_title = role,
  department = CASE 
    WHEN role IN ('management', 'admin') THEN 'Administration'
    WHEN role = 'project_manager' THEN 'Project Management'
    WHEN role = 'technical_lead' THEN 'Technical'
    WHEN role = 'client' THEN 'Client'
    ELSE 'General'
  END
WHERE permissions IS NULL OR array_length(permissions, 1) IS NULL;
```

## ⚡ Alternative: Azure Static Web Apps

If Azure ecosystem is required:

### Setup Steps
1. **Azure CLI Setup**
   ```bash
   az login
   az staticwebapp create \
     --name formulapm-v3 \
     --resource-group your-resource-group \
     --source https://github.com/username/formulapmv3 \
     --location "Central US" \
     --branch main
   ```

2. **Environment Variables**
   - Configure in Azure portal
   - Same variables as Vercel setup

3. **Build Configuration**
   ```json
   // staticwebapp.config.json
   {
     "routes": [
       {
         "route": "/api/*",
         "allowedRoles": ["authenticated"]
       }
     ],
     "responseOverrides": {
       "401": {
         "redirect": "/auth/login"
       }
     }
   }
   ```

## 🔒 Security Checklist

### Pre-Deployment Security
- [ ] Environment variables secured
- [ ] No hardcoded secrets in code
- [ ] Database RLS policies enabled
- [ ] HTTPS enforced
- [ ] Admin panel access restricted
- [ ] Audit logging enabled

### Post-Deployment Monitoring
- [ ] Error tracking (Sentry or Vercel Analytics)
- [ ] Performance monitoring
- [ ] Database query performance
- [ ] User access patterns
- [ ] Failed login attempts

## 📊 Production Checklist

### Technical Requirements
- [ ] All migrations applied successfully
- [ ] Environment variables configured
- [ ] SSL certificates active
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring enabled
- [ ] Performance metrics tracking

### Business Requirements
- [ ] Test accounts created for all user types
- [ ] Permission templates configured
- [ ] Company settings populated
- [ ] Admin users have full access
- [ ] Client access properly restricted

### Testing Checklist
- [ ] Login/logout flow works
- [ ] Permission system functions correctly
- [ ] Project workspace navigation smooth
- [ ] Mobile experience optimized
- [ ] All workflows function end-to-end
- [ ] Excel import/export working
- [ ] Admin panel accessible to admins only

## 🚨 Rollback Plan

If critical issues arise:

1. **Immediate Rollback**
   - Revert to previous Vercel deployment
   - Or redirect traffic back to v2 temporarily

2. **Database Rollback**
   - Keep v2 database unchanged during testing
   - V3 should use separate database initially

3. **User Communication**
   - Prepare downtime notification
   - Have support contact ready

## 📈 Go-Live Strategy

### Phase 1: Internal Testing (Week 7)
- Deploy to staging environment
- Internal team testing
- Bug fixes and performance tuning

### Phase 2: Limited Beta (Week 8)
- Select power users test production
- Monitor performance and feedback
- Address critical issues

### Phase 3: Full Launch
- All users migrate to v3
- Monitor system performance
- Provide user support

---

*Last Updated: January 2025*
*Target: Production deployment by March 4, 2025*