import 'reflect-metadata'
import '@/application/di/container'
import '@/lib/extendedTypes/include'
import { AppBootstrap } from '@/AppBootstrap'
import '@/index.css'

AppBootstrap.createApp().catch((err) => {
    console.error('Cannot run app:', err)
})
