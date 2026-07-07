import { RoutePage, RouteTitle } from '@/lib/router/decorators/RouterDecorators'
import { RouteBase } from '@/lib/router/base/RouteBase'

@RoutePage(() => import('./index.vue'), '/:pathMatch(.*)*')
@RouteTitle('Not found')
export class NotFoundRoute extends RouteBase {}
