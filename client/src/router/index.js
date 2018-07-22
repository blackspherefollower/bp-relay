import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Relay from '@/components/Relay'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/:room',
      name: 'Relay',
      component: Relay
    },
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    }
  ]
})
