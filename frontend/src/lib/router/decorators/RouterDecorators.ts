import { Component } from 'vue'
import { RouteBaseConstructor } from '@/lib/router/types/RouteBaseConstructor'
import { RouteMetaData } from '@/lib/router/types/RouteMetaData'
import { RouteStorage } from '@/lib/router/RouteStorage'
import { TypeInfo } from '@/lib/extendedTypes/TypeInfo'

export const RoutePage = (component: Component, path: string, parent?: () => RouteBaseConstructor) => (module: RouteBaseConstructor) => {
    const name = TypeInfo.create(module).getTypeId()
    RouteStorage.instance.addOrUpdate(name, {
        path,
        parent: parent ? parent() : undefined,
        module,
        component,
        name,
    })
}

export const PropsRoute = () => (module: RouteBaseConstructor) => {
    RouteStorage.instance.addOrUpdate(TypeInfo.create(module).getTypeId(), { props: true })
}

export const RouteMeta = (data: RouteMetaData) => (module: RouteBaseConstructor) => {
    RouteStorage.instance.addOrUpdate(TypeInfo.create(module).getTypeId(), { meta: data })
}

export const RouteRedirect = (to: string) => (module: RouteBaseConstructor) => {
    RouteStorage.instance.addOrUpdate(TypeInfo.create(module).getTypeId(), { redirect: to })
}

export const RouteTitle = (title: string) => (module: RouteBaseConstructor) => {
    RouteStorage.instance.addMeta(TypeInfo.create(module).getTypeId(), 'title', title)
}

export const MenuIncluded = (order?: number) => (module: RouteBaseConstructor) => {
    RouteStorage.instance.addMeta(TypeInfo.create(module).getTypeId(), 'includeToMenu', true)
    RouteStorage.instance.addMeta(TypeInfo.create(module).getTypeId(), 'menuOrder', order)
}
