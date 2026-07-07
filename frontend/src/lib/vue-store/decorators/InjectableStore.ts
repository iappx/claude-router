import { container, singleton } from 'tsyringe'
import { defineStore } from 'pinia'
import { Constructor } from '../types/Constructor'
import { transformClass } from '../utils/class-transformer/transformClass'
import { TypeInfo } from '@/lib/extendedTypes/TypeInfo'

export const InjectableStore = (target: Constructor<any>) => {
    singleton()(target)
    const name = TypeInfo.create(target).getTypeId()
    container.register(name + '_token', target)
    const storeFunc = defineStore(name, transformClass(target))
    container.register(target, { useFactory: () => storeFunc() })
}
