<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AppMenuItem from './AppMenuItem.vue';

const store = useStore();
const router = useRouter();

// Logout function
const logout = async () => {
  try {
    await store.dispatch('auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    router.push('/auth/login');
  }
};

// Define menu items with their role requirements
const allMenuItems = [
    {
        label: 'Main',
        items: [
            { 
                label: 'Dashboard', 
                icon: 'pi pi-fw pi-home', 
                to: '/app/dashboard',
                roles: ['Admin', 'User']
            },
            {
                label: 'Profile', 
                icon: 'pi pi-user', 
                to: '/app/profile',
                roles: ['Admin', 'User']
            }
        ]
    },
    {
        label: 'Rota Management',
        items: [
            { 
                label: 'Weekly Rota', 
                icon: 'pi pi-fw pi-calendar', 
                to: '/app/rota',
                roles: ['Admin', 'User']
            },
            { 
                label: 'Officers', 
                icon: 'pi pi-fw pi-id-card', 
                to: '/app/officers',
                roles: ['Admin', 'User']
            },
            { 
                label: 'Import Data', 
                icon: 'pi pi-fw pi-upload', 
                to: '/app/import',
                roles: ['Admin']
            }
        ]
    },
    {
      label: 'Administration',
      items: [
          { 
              label: 'Users', 
              icon: 'pi pi-fw pi-users', 
              to: '/app/users',
              roles: ['Admin']
          },
      ]
    },
];

// Check if user is authenticated
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

// Get current user info
const currentUser = computed(() => store.getters['auth/user']);
const userRoles = computed(() => store.getters['auth/userRoles']);

// Helper function to check if user has any of the required roles
const hasAnyRole = (requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return store.getters['auth/hasAnyRole'](requiredRoles);
};

// Create a computed property that filters menu items based on user's roles
const model = computed(() => {
  if (!isAuthenticated.value) {
    return [
      {
        label: 'Menu',
        items: [
          { label: 'Login', icon: 'pi pi-fw pi-sign-in', to: '/auth/login' }
        ]
      }
    ];
  }

  // Filter menu sections and items based on user role
  const filteredMenuItems = allMenuItems
    .map(section => {
      if (section.roles && !hasAnyRole(section.roles)) {
        return null;
      }

      const filteredItems = section.items.filter(item => {
        return hasAnyRole(item.roles);
      });

      if (filteredItems.length > 0) {
        return {
          ...section,
          items: filteredItems
        };
      }

      return null;
    })
    .filter(section => section !== null);

  // Add logout item for all authenticated users
  filteredMenuItems.push({
    items: [{ 
      label: 'Logout', 
      icon: 'pi pi-fw pi-sign-out', 
      command: logout
    }]
  });

  return filteredMenuItems;
});

// Get current user info for display
const userDisplayInfo = computed(() => {
  if (!currentUser.value) return null;
  
  const roles = userRoles.value;
  const displayRole = Array.isArray(roles) && roles.length > 0 
    ? roles[0] 
    : currentUser.value.role || 'User';
  
  return {
    name: currentUser.value.fullName || store.getters['auth/userName'] || currentUser.value.username,
    role: displayRole,
    email: store.getters['auth/userEmail'] || currentUser.value.email
  };
});

onMounted(() => {
  // Initialize any required data here
});
</script>

<template>
  <div>
    <!-- User info display -->
    <div v-if="isAuthenticated && userDisplayInfo" class="user-info-card">
      <div class="user-avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="user-details">
        <div class="user-name">{{ userDisplayInfo.name }}</div>
        <div class="user-role">{{ userDisplayInfo.role }}</div>
      </div>
    </div>
    
    <!-- Role-based menu -->
    <ul class="layout-menu">
      <template v-for="(item, i) in model" :key="i">
        <template v-if="!item.separator">
          <app-menu-item :item="item" :index="i" />
        </template>
        <li v-if="item.separator" class="menu-separator"></li>
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.user-info-card {
  display: flex;
  align-items: center;
  padding: 12px;
  margin: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    
    i {
      font-size: 18px;
    }
  }

  .user-details {
    flex: 1;
    
    .user-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
    }
    
    .user-role {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.layout-menu {
  margin-top: 8px;
}
</style>
