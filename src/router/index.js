import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'musichall',
      component: () => import('../views/MusicHall.vue'),
    },
    {
      path: '/mymusic',
      name: 'mymusic',
      component: () => import('../views/MyMusic.vue'),
    },
    {
      path:'/login',
      name:'login',
      component:()=>import('../views/Login.vue')
    },
    {
      path:'/player',
      name:'player',
      component:()=>import('../views/Player.vue')
    },
    {
      path:'/search',
      name:'search',
      component:()=>import('../views/Search.vue')
    },{
      path:'/musiclist',
      name:'musiclist',
      component:()=>import('../views/MusicList.vue')
    }
  ],
})

export default router
