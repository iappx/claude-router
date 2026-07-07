import { NavigationGuardNext, RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

type NavigationGuardReturn = void | Error | RouteLocationRaw | boolean

export abstract class RouteBase {
    path: string

    public async beforeEnter(
        to: RouteLocationNormalized,
        from: RouteLocationNormalized,
        next: NavigationGuardNext,
    ): Promise<NavigationGuardReturn> {
        await next()
    }

    public async getRouteTitle(): Promise<string> {
        return ''
    }
}
