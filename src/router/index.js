import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  { path: '/login', component: () => import('@/components/views/Login/index.vue'), meta: { public: true } },
  { path: '/', redirect: '/today' },
  {
    path: '/today',
    component: () => import('@/components/views/Today/index.vue'),
    meta: { title: 'Today' },
  },
  {
    path: '/week',
    component: () => import('@/components/views/Week/index.vue'),
    meta: { title: 'Week' },
  },
  {
    path: '/month',
    component: () => import('@/components/views/Month/index.vue'),
    meta: { title: 'Month' },
  },
  {
    path: '/categories',
    component: () => import('@/components/views/Category/index.vue'),
    meta: { title: 'Categories' },
  },
  {
    path: '/categories/:id',
    component: () => import('@/components/views/CategoryDetail/index.vue'),
    meta: { title: 'Category' },
  },
  {
    path: '/history',
    component: () => import('@/components/views/History/index.vue'),
    meta: { title: 'History' },
  },
  {
    path: '/settings',
    component: () => import('@/components/views/Settings/index.vue'),
    meta: { title: 'Settings' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.waitForReady()
  if (!to.meta.public && !authStore.user) return '/login'
})
