# Formula PM 2.0 - Admin User Guide

## 🎯 Quick Start for Administrators

Welcome to Formula PM 2.0! This guide will help you get started with the admin features and user impersonation system.

## 🔐 Admin Access Credentials

### Primary Admin Account
- **Email**: `admin@formulapm.com`
- **Password**: `testpass123`
- **Role**: Company Owner (Full Access)

### Secondary Admin Account  
- **Email**: `owner.test@formulapm.com`
- **Password**: `testpass123`
- **Role**: Company Owner (Full Access)

## 🎭 User Impersonation System

### What is User Impersonation?
User impersonation allows you to temporarily experience the application as any other user without knowing their password. This is perfect for:
- **Testing**: Verify features work for different user types
- **Support**: Troubleshoot issues users are experiencing
- **Training**: Demonstrate workflows to team members
- **QA**: Validate user permissions and access controls

### How to Use Impersonation

#### Step 1: Access the Feature
1. Login as an admin user
2. Click your profile avatar in the top-right corner
3. Look for the **"Switch User"** option in the dropdown
4. Click **"Switch User"**

#### Step 2: Select a User
1. The User Impersonation Modal will open
2. Browse users by role categories or use search
3. Search by name, email, role, or department
4. Click **"Impersonate"** next to your target user

#### Step 3: Experience as Target User
- You'll see a blue banner at the top indicating impersonation
- Navigate the app exactly as that user would
- All permissions and restrictions apply
- Features appear/disappear based on their role

#### Step 4: Return to Admin
- Click **"Return to Admin"** in the blue banner
- Or use the user dropdown menu
- Session automatically expires after 4 hours

## 👥 Available User Types for Testing

### Management Level
| Role | Email | Use Case |
|------|-------|----------|
| General Manager | `gm.test@formulapm.com` | Executive oversight, all project access |
| Deputy General Manager | `deputy.test@formulapm.com` | Operations management, budget control |
| Technical Director | `tdirector.test@formulapm.com` | Technical decision making, quality control |

### Project Teams
| Role | Email | Use Case |
|------|-------|----------|
| Project Manager | `pm.test@formulapm.com` | Project leadership, team coordination |
| Senior Architect | `architect.test@formulapm.com` | Design reviews, shop drawings |
| Technical Engineer | `engineer.test@formulapm.com` | Technical specifications, field support |

### Procurement
| Role | Email | Use Case |
|------|-------|----------|
| Purchase Director | `pdirector.test@formulapm.com` | Vendor management, procurement strategy |
| Purchase Specialist | `purchase.test@formulapm.com` | Purchase orders, supplier coordination |

### Field Operations
| Role | Email | Use Case |
|------|-------|----------|
| Field Worker | `field.test@formulapm.com` | On-site updates, task completion |

### External Access
| Role | Email | Use Case |
|------|-------|----------|
| Client | `client.test@formulapm.com` | Project visibility, document approvals |

## 🔧 Admin Features & Permissions

As an admin, you have access to:

### Core Management
- ✅ **All Projects**: Create, view, edit, and delete any project
- ✅ **User Management**: View and manage all user accounts  
- ✅ **Scope Management**: Full control over project scope items
- ✅ **Financial Data**: Access to budgets, costs, and financial reports
- ✅ **Document Management**: All document types and approval workflows

### Administrative Tools
- ✅ **User Impersonation**: Switch to any user account
- ✅ **System Settings**: Configure application behavior
- ✅ **Audit Trails**: Monitor user activities and changes
- ✅ **Backup & Restore**: Data management capabilities
- ✅ **Permission Management**: Assign and modify user roles

### Reporting & Analytics
- ✅ **Executive Dashboards**: High-level project insights
- ✅ **Performance Metrics**: Team productivity and project health
- ✅ **Financial Reports**: Budget analysis and cost tracking
- ✅ **User Activity**: Login patterns and feature usage

## 🛠️ Common Admin Tasks

### Adding New Users
1. Navigate to **User Management**
2. Click **"Add New User"**
3. Fill in user details and select role
4. Set initial permissions
5. Send invitation email

### Managing Project Access
1. Go to **Projects** → Select project
2. Click **"Team Management"**
3. Add/remove team members
4. Adjust permission levels
5. Set project-specific roles

### Troubleshooting User Issues
1. Use **impersonation** to experience their exact view
2. Check their **permissions** in User Management
3. Review **activity logs** for recent actions
4. Verify **project assignments** are correct

### System Health Monitoring
1. Check **Dashboard** for system alerts
2. Review **Error Logs** for technical issues
3. Monitor **Performance Metrics**
4. Validate **Backup Status**

## 🚨 Security Best Practices

### Impersonation Security
- ✅ **Always log out** when finished with impersonation
- ✅ **Use impersonation briefly** - don't leave sessions open
- ✅ **Document the reason** for impersonation (for audit purposes)
- ✅ **Verify your admin status** before making system changes

### Account Security
- ✅ **Change default passwords** immediately in production
- ✅ **Use strong passwords** with special characters
- ✅ **Enable two-factor authentication** when available
- ✅ **Review access logs** regularly for suspicious activity

### Data Protection
- ✅ **Backup data regularly** using system tools
- ✅ **Limit admin access** to necessary personnel only
- ✅ **Monitor user permissions** for privilege escalation
- ✅ **Audit sensitive operations** like user creation/deletion

## 📋 Daily Admin Checklist

### Morning Tasks
- [ ] Check system health dashboard
- [ ] Review overnight alerts and logs
- [ ] Verify backup completion status
- [ ] Monitor user login issues

### Throughout the Day
- [ ] Respond to user support requests
- [ ] Process new user account requests
- [ ] Review and approve project changes
- [ ] Monitor system performance

### End of Day
- [ ] Check impersonation audit logs
- [ ] Review any security alerts
- [ ] Ensure all admin sessions are closed
- [ ] Verify data backup schedules

## 🔍 Troubleshooting Common Issues

### "Switch User button not visible"
- ✅ Verify you're logged in as admin/owner role
- ✅ Check if your account has impersonation permissions
- ✅ Refresh the page and try again

### "No users available for impersonation"
- ✅ Check if other users exist in the system
- ✅ Verify users have active status
- ✅ Contact system administrator if issue persists

### "Cannot return to admin"
- ✅ Refresh the browser page
- ✅ Clear browser cache and cookies
- ✅ Log out and log back in as admin

### General System Issues
- ✅ Check browser console for JavaScript errors
- ✅ Verify internet connection stability
- ✅ Try a different browser or incognito mode
- ✅ Contact technical support with error details

## 📞 Support & Resources

### Getting Help
- **Technical Support**: Create an issue in the project repository
- **User Training**: Refer to role-specific documentation
- **Feature Requests**: Submit via project management system
- **Bug Reports**: Include steps to reproduce and error messages

### Additional Documentation
- 📖 **Complete Feature Guide**: `docs/ADMIN_IMPERSONATION_GUIDE.md`
- 🔧 **Technical Documentation**: `docs/` directory
- 🎯 **User Workflows**: `Planing App/` directory
- ⚙️ **Development Setup**: Main `README.md`

---

**Quick Reference**: Login → Click Avatar → Switch User → Select Target → Experience → Return to Admin

**Remember**: With great power comes great responsibility. Use admin features wisely and always prioritize user data security! 🛡️