// Debug script for checking Report Templates permissions
// Open browser console and paste this to debug the missing menu issue

console.log('=== Report Templates Permission Debug ===');

// Get current user from localStorage
const user = JSON.parse(localStorage.getItem('user') || 'null');
console.log('1. Current User:', user);
console.log('2. User Role:', user?.role);

// Check if templates sidebar menu should be visible for this role
const ROLE_PERMISSIONS = {
  super_admin: {
    sidebarMenus: [
      'dashboard',
      'patients', 
      'analytics',
      'reports',
      'templates',
      'user-management',
      'settings',
      'notifications',
      'seo-settings'
    ],
    permissions: [
      {
        module: 'templates',
        actions: ['view', 'add', 'edit', 'delete', 'export', 'import']
      }
    ]
  }
};

const userRole = user?.role;
const roleConfig = ROLE_PERMISSIONS[userRole];
console.log('3. Role Config:', roleConfig);
console.log('4. Has templates in sidebarMenus:', roleConfig?.sidebarMenus?.includes('templates'));

// Check navigation items
const navigationItems = document.querySelectorAll('[data-testid^="nav-"]');
console.log('5. Current sidebar navigation items:');
navigationItems.forEach(item => {
  console.log('  -', item.getAttribute('data-testid'), ':', item.textContent.trim());
});

// Check if report-templates menu item exists
const reportTemplatesNav = document.querySelector('[data-testid="nav-report-templates"]');
console.log('6. Report Templates nav element found:', !!reportTemplatesNav);

if (!reportTemplatesNav) {
  console.log('❌ Report Templates menu is MISSING from sidebar');
  
  // Try to find why it's missing
  console.log('7. Debugging why menu is missing...');
  
  // Check permissions function
  if (window.React && window.React.version) {
    console.log('React version:', window.React.version);
  }
  
  // Force refresh suggestion
  console.log('🔧 Try the following fixes:');
  console.log('   1. Hard refresh the page (Ctrl+F5)');
  console.log('   2. Clear browser cache');
  console.log('   3. Check browser dev tools console for errors');
  console.log('   4. Verify user role is "super_admin"');
} else {
  console.log('✅ Report Templates menu is VISIBLE in sidebar');
}

console.log('=== End Debug ===');