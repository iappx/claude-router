import { InjectableStore, StoreBase } from "@/lib/vue-store";
import { inject } from "tsyringe";
import { SettingsRepository, type SettingsSnapshot } from "@/infrastructure/repositories/SettingsRepository";
import { ProtocolService } from "@/application/services/protocol.service";
import { EventBus } from "@/services/eventBus/EventBus";
import { SettingsChangedEvent } from "@/domain/events/settings/SettingsChangedEvent";
import { SettingsPersistFailedEvent } from "@/domain/events/settings/SettingsPersistFailedEvent";
import { AutoSelectTimeoutChangedEvent } from "@/domain/events/settings/AutoSelectTimeoutChangedEvent";
import { ProtocolActionFailedEvent } from "@/domain/events/settings/ProtocolActionFailedEvent";

const MIN_AUTO_SELECT_TIMEOUT_SECONDS = 5
const MAX_AUTO_SELECT_TIMEOUT_SECONDS = 30

@InjectableStore
export class SettingsStore extends StoreBase<SettingsStore> {
    public instancesRootDir = ""
    public isOnSystemDrive = true
    public autoSelectTimeoutSeconds = 10
    public initializing = true

    constructor(
        @inject(SettingsRepository) private readonly repository: SettingsRepository,
        @inject(ProtocolService) private readonly protocolService: ProtocolService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        super()
    }

    public async init(): Promise<void> {
        try {
            this.applySnapshot(await this.repository.load())
        } finally {
            this.initializing = false
        }
    }

    /** Opens the native folder picker and persists the choice. No-ops if the user cancels. */
    public async pickInstancesRootDir(): Promise<void> {
        const picked = await this.repository.pickInstancesRootDir()
        if (!picked) return

        await this.persist({ instancesRootDir: picked, autoSelectTimeoutSeconds: this.autoSelectTimeoutSeconds }, (snapshot) => {
            this.eventBus.emitEvent(new SettingsChangedEvent(snapshot.instancesRootDir))
        })
    }

    /** Clamped to [5, 30] seconds — how long the protocol router picker waits before auto-selecting the default instance. */
    public async setAutoSelectTimeoutSeconds(seconds: number): Promise<void> {
        const clamped = Math.min(MAX_AUTO_SELECT_TIMEOUT_SECONDS, Math.max(MIN_AUTO_SELECT_TIMEOUT_SECONDS, Math.round(seconds)))
        await this.persist({ instancesRootDir: this.instancesRootDir, autoSelectTimeoutSeconds: clamped }, (snapshot) => {
            this.eventBus.emitEvent(new AutoSelectTimeoutChangedEvent(snapshot.autoSelectTimeoutSeconds))
        })
    }

    /**
     * Opens Windows' own Default Apps settings. Claude Router registers
     * itself as a candidate automatically on startup, but Claude Desktop is
     * a packaged app that already claims claude:// itself — Windows still
     * requires the user to explicitly pick Claude Router here.
     */
    public async openDefaultAppsSettings(): Promise<void> {
        try {
            await this.protocolService.openDefaultAppsSettings()
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.eventBus.emitEvent(new ProtocolActionFailedEvent(message))
        }
    }

    private async persist(settings: { instancesRootDir: string; autoSelectTimeoutSeconds: number }, onSuccess: (snapshot: SettingsSnapshot) => void): Promise<void> {
        try {
            await this.repository.save(settings)
            const snapshot = await this.repository.load()
            this.applySnapshot(snapshot)
            onSuccess(snapshot)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.eventBus.emitEvent(new SettingsPersistFailedEvent(message))
        }
    }

    private applySnapshot(snapshot: SettingsSnapshot): void {
        this.instancesRootDir = snapshot.instancesRootDir
        this.isOnSystemDrive = snapshot.isOnSystemDrive
        this.autoSelectTimeoutSeconds = snapshot.autoSelectTimeoutSeconds
    }
}
