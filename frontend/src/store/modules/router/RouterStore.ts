import { InjectableStore, StoreBase } from "@/lib/vue-store";
import { inject } from "tsyringe";
import { RouterPickerService } from "@/application/services/router-picker.service";
import type { DefaultInstanceSnapshot } from "@/infrastructure/repositories/InstanceProcessRepository";
import { EventBus } from "@/services/eventBus/EventBus";
import { RouterUrlRoutedEvent } from "@/domain/events/router/RouterUrlRoutedEvent";
import { RouterUrlRouteFailedEvent } from "@/domain/events/router/RouterUrlRouteFailedEvent";
import { appContainer } from "@/application/di/container";
import { SettingsStore } from "@/store/modules/settings/SettingsStore";

@InjectableStore
export class RouterStore extends StoreBase<RouterStore> {
    public pendingUrl = ""
    public defaultInstance: DefaultInstanceSnapshot | null = null
    public countdown = 0
    public routing = false

    private timer: ReturnType<typeof setInterval> | null = null

    constructor(
        @inject(RouterPickerService) private readonly pickerService: RouterPickerService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        super()
    }

    /**
     * Resolved lazily (not constructor-injected) — see InstanceStore for why
     * store-to-store constructor injection breaks @InjectableStore's timing.
     */
    private resolveSettingsStore(): SettingsStore {
        return appContainer.resolve(SettingsStore)
    }

    /** Loads the pending URL and starts the auto-select countdown. No-ops if nothing is pending. */
    public async start(): Promise<void> {
        this.stopCountdown()
        this.pendingUrl = await this.pickerService.getPendingUrl()
        this.defaultInstance = await this.pickerService.getDefaultInstance()
        if (!this.pendingUrl) return

        this.countdown = this.resolveSettingsStore().autoSelectTimeoutSeconds
        this.startCountdown()
    }

    private startCountdown(): void {
        this.timer = setInterval(() => {
            this.countdown -= 1
            if (this.countdown <= 0) {
                this.stopCountdown()
                // Auto-select always targets the system default install.
                void this.selectTarget("")
            }
        }, 1000)
    }

    private stopCountdown(): void {
        if (this.timer !== null) {
            clearInterval(this.timer)
            this.timer = null
        }
    }

    /** An empty dataDir routes to the system default install. Returns whether routing succeeded. */
    public async selectTarget(dataDir: string): Promise<boolean> {
        this.stopCountdown()
        if (!this.pendingUrl) return false

        this.routing = true
        try {
            await this.pickerService.routeUrl(dataDir, this.pendingUrl)
            await this.pickerService.clearPendingUrl()
            this.eventBus.emitEvent(new RouterUrlRoutedEvent(dataDir ? dataDir : "the default instance"))
            this.pendingUrl = ""
            return true
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.eventBus.emitEvent(new RouterUrlRouteFailedEvent(message))
            return false
        } finally {
            this.routing = false
        }
    }

    public dispose(): void {
        this.stopCountdown()
    }
}
