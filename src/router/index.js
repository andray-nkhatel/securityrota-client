import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import { authGuard } from './guard/auth.guard';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        // Redirect root to login
        {
            path: '/',
            redirect: '/auth/login'
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/register',
            name: 'register',
            component: () => import('@/views/pages/auth/Register.vue')
        },
        // All authenticated routes under /app
        {
            path: '/app',
            component: AppLayout,
            redirect: '/app/dashboard',
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/dashboard/Dashboard.vue')
                },
                {   
                    path: 'profile',
                    name: 'profile',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/users/Profile.vue')
                },
                {
                    path: 'users',
                    name: 'users',
                    meta: {
                        requiresAuth: true,
                        roles: ['Admin']
                    },
                    component: () => import('@/views/users/Users.vue')
                },
                {
                    path: 'officers',
                    name: 'officers',
                    meta: {
                        requiresAuth: true,
                        roles: ['Admin', 'User']
                    },
                    component: () => import('@/views/rota/Officers.vue')
                },
                {
                    path: 'rota',
                    name: 'rota',
                    meta: {
                        requiresAuth: true,
                        roles: ['Admin', 'User']
                    },
                    component: () => import('@/views/rota/WeeklyRota.vue')
                },
                {
                    path: 'import',
                    name: 'import',
                    meta: {
                        requiresAuth: true,
                        roles: ['Admin']
                    },
                    component: () => import('@/views/rota/ImportData.vue')
                }
            ]
        }
    ]
});

router.beforeEach(authGuard);
export default router;
