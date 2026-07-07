import { InjectableStore, StoreBase } from "@/lib/vue-store";
import { inject } from "tsyringe";
import { InstanceService } from "@/application/services/instance.service";
import { InstanceProcessService } from "@/application/services/instance-process.service";
import type { RunningInstanceSnapshot } from "@/infrastructure/repositories/InstanceProcessRepository";
import type { InstanceModel } from "@/domain/models/instance";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstancesChangedEvent } from "@/domain/events/instances/InstancesChangedEvent";
import { InstanceCreatedEvent } from "@/domain/events/instances/InstanceCreatedEvent";
import { InstanceRemovedEvent } from "@/domain/events/instances/InstanceRemovedEvent";
import { InstanceLaunchRequestedEvent } from "@/domain/events/instances/InstanceLaunchRequestedEvent";
import { InstanceStopRequestedEvent } from "@/domain/events/instances/InstanceStopRequestedEvent";
import { InstanceOpenFolderRequestedEvent } from "@/domain/events/instances/InstanceOpenFolderRequestedEvent";
import { InstanceFolderDeletionRequestedEvent } from "@/domain/events/instances/InstanceFolderDeletionRequestedEvent";
import { InstanceRenamedEvent } from "@/domain/events/instances/InstanceRenamedEvent";
import { InstanceMoveSkippedFilesEvent } from "@/domain/events/instances/InstanceMoveSkippedFilesEvent";
import { Slugifier } from "@/domain/support/Slugifier";
import { PathJoiner } from "@/domain/support/PathJoiner";
import { appContainer } from "@/application/di/container";
import { SettingsStore } from "@/store/modules/settings/SettingsStore";

const RUNNING_POLL_INTERVAL_MS = 3000

@InjectableStore
export class InstanceStore extends StoreBase<InstanceStore> {
    public instances: InstanceModel[] = []
    public loading = true
    public storageError = ""
    public running: RunningInstanceSnapshot[] = []

    constructor(
        @inject(InstanceService) private readonly instanceService: InstanceService,
        @inject(InstanceProcessService) private readonly processService: InstanceProcessService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        super()
    }

    /**
     * Resolved lazily (not constructor-injected) — @InjectableStore builds
     * this store's state as soon as this module is imported, which happens
     * before `app.use(pinia)` runs. Injecting another store by constructor
     * would try to activate its Pinia-backed instance too early and throw.
     */
    private resolveSettingsStore(): SettingsStore {
        return appContainer.resolve(SettingsStore)
    }

    public async init(): Promise<void> {
        try {
            this.instances = await this.instanceService.loadInstances(this.resolveSettingsStore().instancesRootDir)
            this.storageError = ""
        } catch (error) {
            this.storageError = error instanceof Error ? error.message : String(error)
        } finally {
            this.loading = false
        }

        await this.refreshRunning()
        setInterval(() => void this.refreshRunning(), RUNNING_POLL_INTERVAL_MS)
    }

    public isRunning(profileDir: string): boolean {
        return this.running.some((r) => r.profileDir === profileDir)
    }

    /** Running claude.exe processes whose profile folder isn't tracked as an instance yet, sorted for a stable display order. */
    get unregisteredInstances(): RunningInstanceSnapshot[] {
        return this.running
            .filter((r) => !this.instances.some((instance) => instance.profileDir === r.profileDir))
            .slice()
            .sort((a, b) => a.profileDir.localeCompare(b.profileDir))
    }

    private async refreshRunning(): Promise<void> {
        try {
            this.running = await this.processService.listRunning()
        } catch {
            // Transient failures (e.g. process listing hiccups) just keep the last known state.
        }
    }

    /** Mutated by InstancePersistenceHandler to surface persistence failures. */
    public setStorageError(message: string): void {
        this.storageError = message
    }

    public addInstance(name: string, profileDir: string): void {
        const next = this.instanceService.addInstance(this.instances, name, profileDir, this.resolveSettingsStore().instancesRootDir)
        const created = next[next.length - 1]
        this.instances = next
        this.eventBus.emitEvent(new InstancesChangedEvent(next))
        this.eventBus.emitEvent(new InstanceCreatedEvent(created.name, created.path))
    }

    public removeInstance(id: string, deleteFolder: boolean): void {
        const instance = this.instances.find((i) => i.id === id)
        this.commit((prev) => this.instanceService.removeInstance(prev, id))
        if (!instance) return

        this.eventBus.emitEvent(new InstanceRemovedEvent(instance.name))
        if (deleteFolder) {
            this.eventBus.emitEvent(new InstanceFolderDeletionRequestedEvent(instance.name, instance.path))
        }
    }

    public requestLaunch(id: string): void {
        const instance = this.instances.find((i) => i.id === id)
        if (!instance) return
        this.eventBus.emitEvent(new InstanceLaunchRequestedEvent(instance.id, instance.name, instance.path))
    }

    public requestStop(id: string): void {
        const instance = this.instances.find((i) => i.id === id)
        if (!instance) return
        this.eventBus.emitEvent(new InstanceStopRequestedEvent(instance.id, instance.name, instance.profileDir))
    }

    public requestOpenFolder(id: string): void {
        const instance = this.instances.find((i) => i.id === id)
        if (!instance) return
        this.eventBus.emitEvent(new InstanceOpenFolderRequestedEvent(instance.name, instance.path))
    }

    /** For a running-but-unregistered process — no InstanceModel exists yet. */
    public requestStopByProfileDir(profileDir: string): void {
        const name = Slugifier.toTitleCase(profileDir)
        this.eventBus.emitEvent(new InstanceStopRequestedEvent(profileDir, name, profileDir))
    }

    /** For a running-but-unregistered process — no InstanceModel exists yet. */
    public requestOpenFolderByProfileDir(profileDir: string): void {
        const running = this.running.find((r) => r.profileDir === profileDir)
        if (!running) return
        this.eventBus.emitEvent(new InstanceOpenFolderRequestedEvent(Slugifier.toTitleCase(profileDir), running.path))
    }

    /** Starts tracking an already-running process as a managed instance, using its real, already-existing path. */
    public registerRunningInstance(profileDir: string, name: string): void {
        const running = this.running.find((r) => r.profileDir === profileDir)
        if (!running) return

        const next = this.instanceService.registerInstance(this.instances, name, profileDir, running.path)
        const created = next[next.length - 1]
        this.instances = next
        this.eventBus.emitEvent(new InstancesChangedEvent(next))
        this.eventBus.emitEvent(new InstanceCreatedEvent(created.name, created.path))
    }

    /**
     * Registers a discovered instance under a new profile folder: stops the
     * running process, relocates its data under the current instances root,
     * then relaunches it from the new location before registering.
     *
     * oldPath is passed in by the caller (rather than looked up from
     * `running`) so a retry after a failed attempt still works even though
     * the process — already stopped by that earlier attempt — no longer
     * shows up as running.
     */
    public async registerRunningInstanceWithMove(profileDir: string, name: string, folderName: string, oldPath: string): Promise<void> {
        const slug = Slugifier.toKebabCase(folderName) || Slugifier.toKebabCase(name) || profileDir
        const newPath = PathJoiner.join(this.resolveSettingsStore().instancesRootDir, slug)

        if (newPath.toLowerCase() === oldPath.toLowerCase()) {
            // Already at the target location — nothing to move, just register in place.
            this.registerRunningInstance(profileDir, name)
            return
        }

        try {
            await this.processService.stop(profileDir)
        } catch {
            // Already stopped by an earlier attempt at this same move — fine, proceed.
        }

        const hadSkips = await this.processService.moveProfileDir(profileDir, oldPath, newPath)
        await this.processService.launch(newPath)

        this.registerAtNewPath(name, slug, newPath)
        if (hadSkips) {
            this.eventBus.emitEvent(new InstanceMoveSkippedFilesEvent(name, oldPath))
        }
    }

    /**
     * Registers the packaged default Claude Desktop install by relocating
     * its data. Unlike registerRunningInstanceWithMove, this can't skip
     * straight to "register in place" — the default install must always be
     * moved out of its virtualized location — and it stops every running
     * Claude process (see InstanceProcessService.moveDefaultProfileDir),
     * not just this one. oldPath is caller-supplied for the same retry
     * reason as registerRunningInstanceWithMove.
     */
    public async registerDefaultInstanceWithMove(profileDir: string, name: string, folderName: string, oldPath: string): Promise<void> {
        const slug = Slugifier.toKebabCase(folderName) || Slugifier.toKebabCase(name) || profileDir
        const newPath = PathJoiner.join(this.resolveSettingsStore().instancesRootDir, slug)

        const hadSkips = await this.processService.moveDefaultProfileDir(profileDir, oldPath, newPath)
        await this.processService.launch(newPath)

        this.registerAtNewPath(name, slug, newPath)
        if (hadSkips) {
            this.eventBus.emitEvent(new InstanceMoveSkippedFilesEvent(name, oldPath))
        }
    }

    private registerAtNewPath(name: string, profileDir: string, path: string): void {
        const next = this.instanceService.registerInstance(this.instances, name, profileDir, path)
        const created = next[next.length - 1]
        this.instances = next
        this.eventBus.emitEvent(new InstancesChangedEvent(next))
        this.eventBus.emitEvent(new InstanceCreatedEvent(created.name, created.path))
    }

    public renameInstance(id: string, name: string): void {
        const trimmed = name.trim()
        if (!trimmed) return
        this.commit((prev) => this.instanceService.renameInstance(prev, id, trimmed))
        this.eventBus.emitEvent(new InstanceRenamedEvent(trimmed))
    }

    private commit(mutate: (instances: InstanceModel[]) => InstanceModel[]): void {
        const next = mutate(this.instances)
        this.instances = next
        this.eventBus.emitEvent(new InstancesChangedEvent(next))
    }
}
