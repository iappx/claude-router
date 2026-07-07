import { ISetupStore } from '@/lib/vue-store'
import { Store } from 'pinia-class-transformer'

export abstract class StoreBase<T extends Record<string, any>> extends Store<T> implements ISetupStore {
    setup(): void {}
}
