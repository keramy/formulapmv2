'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Database,
  Users,
  Building,
  CreditCard,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Database, permission: 'system.settings.admin' },
  { id: 'billing', label: 'Billing', icon: CreditCard, permission: 'billing.view' },
  { id: 'team', label: 'Team', icon: Users, permission: 'users.manage' },
  { id: 'company', label: 'Company', icon: Building, permission: 'company.settings' }
];

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { hasPermission } = usePermissions();
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Profile
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    jobTitle: profile?.department || '',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    taskReminders: true,
    clientMessages: true,
    
    // Appearance
    theme: 'light',
    compactMode: false,
    sidebarCollapsed: false,
    
    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const visibleSections = settingsSections.filter(section => 
    !section.permission || hasPermission(section.permission as any)
  );

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // In a real app, this would make API calls to update settings
    console.log('Saving settings:', formData);
    // Show success message
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${formData.firstName} ${formData.lastName}`} />
          <AvatarFallback className="text-2xl">
            {formData.firstName[0]}{formData.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Change Photo
          </Button>
          <p className="text-sm text-gray-600">JPG, PNG or GIF. Max size 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => updateFormData('jobTitle', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Email Notifications</h4>
            <p className="text-sm text-gray-600">Receive notifications via email</p>
          </div>
          <Switch
            checked={formData.emailNotifications}
            onCheckedChange={(checked) => updateFormData('emailNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Push Notifications</h4>
            <p className="text-sm text-gray-600">Receive browser push notifications</p>
          </div>
          <Switch
            checked={formData.pushNotifications}
            onCheckedChange={(checked) => updateFormData('pushNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Project Updates</h4>
            <p className="text-sm text-gray-600">Notifications about project milestones</p>
          </div>
          <Switch
            checked={formData.projectUpdates}
            onCheckedChange={(checked) => updateFormData('projectUpdates', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Task Reminders</h4>
            <p className="text-sm text-gray-600">Reminders for upcoming task deadlines</p>
          </div>
          <Switch
            checked={formData.taskReminders}
            onCheckedChange={(checked) => updateFormData('taskReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Client Messages</h4>
            <p className="text-sm text-gray-600">Notifications for new client messages</p>
          </div>
          <Switch
            checked={formData.clientMessages}
            onCheckedChange={(checked) => updateFormData('clientMessages', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex space-x-2">
            {['light', 'dark', 'auto'].map((theme) => (
              <Button
                key={theme}
                variant={formData.theme === theme ? 'default' : 'outline'}
                onClick={() => updateFormData('theme', theme)}
                className="capitalize"
              >
                {theme}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Compact Mode</h4>
            <p className="text-sm text-gray-600">Reduce spacing and padding</p>
          </div>
          <Switch
            checked={formData.compactMode}
            onCheckedChange={(checked) => updateFormData('compactMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Collapsed Sidebar</h4>
            <p className="text-sm text-gray-600">Start with sidebar collapsed</p>
          </div>
          <Switch
            checked={formData.sidebarCollapsed}
            onCheckedChange={(checked) => updateFormData('sidebarCollapsed', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => updateFormData('currentPassword', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => updateFormData('newPassword', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            />
          </div>
          <Button className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-600">Add an extra layer of security</p>
          </div>
          <Switch
            checked={formData.twoFactorEnabled}
            onCheckedChange={(checked) => updateFormData('twoFactorEnabled', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderPlaceholderSection = (title: string) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Settings className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title} Settings</h3>
      <p className="text-gray-600">This section is coming soon.</p>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'notifications': return renderNotificationsSection();
      case 'appearance': return renderAppearanceSection();
      case 'security': return renderSecuritySection();
      case 'system': return renderPlaceholderSection('System');
      case 'billing': return renderPlaceholderSection('Billing');
      case 'team': return renderPlaceholderSection('Team');
      case 'company': return renderPlaceholderSection('Company');
      default: return renderProfileSection();
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const section = visibleSections.find(s => s.id === activeSection);
                    const Icon = section?.icon || Settings;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  {visibleSections.find(s => s.id === activeSection)?.label} Settings
                </CardTitle>
                <CardDescription>
                  Manage your {activeSection} preferences and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSectionContent()}
                
                {/* Save Button */}
                {['profile', 'notifications', 'appearance'].includes(activeSection) && (
                  <div className="flex justify-end pt-6 border-t mt-6">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}