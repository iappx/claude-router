import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { container } from 'tsyringe'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { InstanceStore } from '@/store/modules/instance/InstanceStore'
import { SettingsStore } from '@/store/modules/settings/SettingsStore'
import { RouterPickerService } from '@/application/services/router-picker.service'
import { NotificationHandler } from '@/application/handlers/NotificationHandler'
import { InstancePersistenceHandler } from '@/application/handlers/InstancePersistenceHandler'
import { InstanceProvisioningHandler } from '@/application/handlers/InstanceProvisioningHandler'
import { InstanceLaunchHandler } from '@/application/handlers/InstanceLaunchHandler'
import { InstanceStopHandler } from '@/application/handlers/InstanceStopHandler'
import { InstanceFolderHandler } from '@/application/handlers/InstanceFolderHandler'

export class AppBootstrap {
    public static async createApp(): Promise<void> {
        const pinia = createPinia()
        const app = createApp(App)

        app.use(pinia)

        // Instantiate the event-handler subscribers so they register on the bus.
        container.resolve(NotificationHandler)
        container.resolve(InstancePersistenceHandler)
        container.resolve(InstanceProvisioningHandler)
        container.resolve(InstanceLaunchHandler)
        container.resolve(InstanceStopHandler)
        container.resolve(InstanceFolderHandler)

        const settingsStore = container.resolve(SettingsStore)
        await settingsStore.init()

        const instanceStore = container.resolve(InstanceStore)
        await instanceStore.init()

        const router = createAppRouter()
        app.use(router)

        app.mount('#app')

        // Launched via a claude:// link — skip the dashboard and go
        // straight to the picker.
        const pendingUrl = await container.resolve(RouterPickerService).getPendingUrl()
        if (pendingUrl) {
            await router.isReady()
            await router.push('/app/router')
        }
    }
}
