// Simple debug script to check templates permissions
// Run this in browser console to debug permission issues

console.log('=== Debug Report Templates Permissions ===');

// Check user data
const user = JSON.parse(localStorage.getItem('user') || 'null');
console.log('Current user:', user);
console.log('User role:', user?.role);

// Check if user has templates permissions
const rolePermissions = {
  super_admin: {
    sidebarMenus: ['dashboard', 'patients', 'analytics', 'reports', 'templates', 'user-management', 'settings', 'notifications', 'seo-settings'],
    permissions: [
      {
        module: 'templates',
        actions: ['view', 'add', 'edit', 'delete', 'export', 'import']
      }
    ]
  },
  doctor: {
    sidebarMenus: ['dashboard', 'patients', 'reports', 'notifications'],
    permissions: []
  },
  technician: {
    sidebarMenus: ['dashboard', 'patients', 'notifications'],
    permissions: []
  }
};

const userRole = user?.role || 'unknown';
const userPermissions = rolePermissions[userRole];

console.log('User permissions config:', userPermissions);
console.log('Has templates sidebar access:', userPermissions?.sidebarMenus?.includes('templates'));
console.log('Has templates module permissions:', userPermissions?.permissions?.find(p => p.module === 'templates'));

// Check navigation items
const navigationItems = [
  { path: "/", label: "Dashboard", icon: "fa-chart-pie", key: "dashboard" },
  { path: "/patients", label: "Patients", icon: "fa-users", key: "patients" },
  { path: "/add-patient", label: "Add Patient", icon: "fa-user-plus", key: "patients" },
  { path: "/notifications", label: "Notifications", icon: "fa-bell", key: "notifications" },
  { path: "/reports", label: "Medical Reports", icon: "fa-file-medical", key: "reports" },
  { path: "/report-templates", label: "Report Templates", icon: "fa-file-text", key: "templates" },
  { path: "/analytics", label: "Analytics", icon: "fa-chart-bar", key: "analytics" },
  { path: "/users", label: "User Management", icon: "fa-user-cog", key: "user-management" },
  { path: "/medical-centers", label: "Medical Centers", icon: "fa-hospital", key: "settings" },
  { path: "/settings", label: "Settings", icon: "fa-cog", key: "settings" },
  { path: "/seo-settings", label: "SEO Settings", icon: "fa-cog", key: "seo-settings" }
];

const templatesMenuItem = navigationItems.find(item => item.key === 'templates');
console.log('Report Templates menu item:', templatesMenuItem);

console.log('=== End Debug ===');