import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: () => import('../views/Layout/index.vue')
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/Home/index.vue')
    },
    {
      path: '/api',
      name: 'Api',
      component: () => import('../views/Api/index.vue')
    },
    {
      path: '/office',
      name: 'Office',
      component: () => import('../views/Office/index.vue')
    },
    {
      path: '/docs',
      name: 'Docs',
      component: () => import('../views/Docs/index.vue')
    },
    {
      path: '/mysql',
      name: 'Mysql',
      component: () => import('../views/Mysql/index.vue')
    }
  ]
})

export default router