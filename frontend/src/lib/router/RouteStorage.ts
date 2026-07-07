import { RouteRecordRaw } from 'vue-router'
import { RouteMetaData } from '@/lib/router/types/RouteMetaData'
import { StorageBase } from '@/lib/storage/base/StorageBase'
import { RouteInfo } from '@/lib/router/models/RouteInfo'
import { TypeInfo } from '@/lib/extendedTypes/TypeInfo'

export class RouteStorage extends StorageBase<RouteInfo> {
    public static readonly instance = new RouteStorage()

    private routeTree: RouteInfo[] = []
    private flatRouteInfo: RouteInfo[] = []
    private routesLoaded = false

    public addMeta<TKey extends keyof RouteMetaData>(key: string, metKey: TKey, value: RouteMetaData[TKey]): void {
        const item = this.addOrUpdate(key, {})
        if (!item.meta) item.meta = {}
        item.meta[metKey] = value
    }

    public getRoutes(): RouteRecordRaw[] {
        this.loadRoutes()
        return this.routeTree.map((p) => RouteStorage.createRouteRecord(p))
    }

    private static createRouteRecord(routeInfo: RouteInfo): RouteRecordRaw {
        return {
            path: routeInfo.path,
            component: routeInfo.component,
            name: TypeInfo.create(routeInfo.module).getTypeId(),
            redirect: routeInfo.redirect || undefined,
            beforeEnter: routeInfo.moduleInstance?.beforeEnter?.bind(routeInfo.moduleInstance) as any,
            meta: routeInfo.meta,
            props: routeInfo.props || false,
            children: routeInfo.children ? routeInfo.children.map((p) => this.createRouteRecord(p)) : [],
        }
    }

    private static createTree(nodes: RouteInfo[]): RouteInfo[] {
        const map: Record<string, number> = {}
        const roots: RouteInfo[] = []

        for (let i = 0; i < nodes.length; i++) {
            map[TypeInfo.create(nodes[i].module).getTypeId()] = i
            nodes[i].children = []
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            if (node.parent) {
                const parentId = TypeInfo.create(node.parent).getTypeId()
                const parentIndex = map[parentId]
                if (parentIndex !== undefined) {
                    node.parentInfo = nodes[parentIndex]
                    nodes[parentIndex].children.push(node)
                } else {
                    roots.push(node)
                }
            } else {
                roots.push(node)
            }
        }
        return roots
    }

    private loadRoutes(): void {
        if (!this.routesLoaded) {
            const array = this.getAsArray().map((p) => {
                p.moduleInstance = new p.module()
                return p
            })
            this.flatRouteInfo = array
            this.routeTree = RouteStorage.createTree(array)
            this.routesLoaded = true
        }
    }
}
