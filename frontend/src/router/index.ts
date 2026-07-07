import { createRouter, createWebHashHistory } from 'vue-router'
import { RouteStorage } from '@/lib/router/RouteStorage'

import '@/views/app/app.route'
import '@/views/app/dashboard/dashboard.route'
import '@/views/app/router/router.route'
import '@/views/not-found/not-found.route'

export function createAppRouter() {
    return createRouter({
        history: createWebHashHistory(),
        routes: RouteStorage.instance.getRoutes(),
    })
}
