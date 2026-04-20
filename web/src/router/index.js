import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: () => import('../views/Layout.vue')
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/api',
      name: 'Api',
      component: () => import('../views/ApiView.vue')
    },
    {
      path: '/office',
      name: 'Office',
      component: () => import('../views/OfficeView.vue')
    },
    {
      path: '/docs',
      name: 'Docs',
      component: () => import('../views/DocsView.vue')
    }
  ]
})

export default router