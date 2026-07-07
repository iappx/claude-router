import { RoutePage, RouteTitle } from '@/lib/router/decorators/RouterDecorators'
import { RouteBase } from '@/lib/router/base/RouteBase'
import { AppRoute } from '@/views/app/app.route'

@RoutePage(() => import('./index.vue'), 'router', () => AppRoute)
@RouteTitle('Route redirect')
export class ProtocolRouterRoute extends RouteBase {}
