import { RoutePage, RouteTitle } from '@/lib/router/decorators/RouterDecorators'
import { RouteBase } from '@/lib/router/base/RouteBase'
import { AppRoute } from '@/views/app/app.route'

@RoutePage(() => import('./index.vue'), 'dashboard', () => AppRoute)
@RouteTitle('Instances')
export class DashboardRoute extends RouteBase {}
