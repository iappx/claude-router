import { RoutePage, RouteRedirect, RouteTitle } from '@/lib/router/decorators/RouterDecorators'
import { RouteBase } from '@/lib/router/base/RouteBase'

@RoutePage(() => import('./index.vue'), '/app')
@RouteRedirect('/app/dashboard')
@RouteTitle('Claude Router')
export class AppRoute extends RouteBase {
}

@RoutePage(() => import('./index.vue'), '/')
@RouteRedirect('/app/dashboard')
@RouteTitle('Claude Router')
export class RootRoute extends RouteBase {
}
