import { inject, singleton } from "tsyringe";
import { toast } from "vue-sonner";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstanceCreatedEvent } from "@/domain/events/instances/InstanceCreatedEvent";
import { InstanceRemovedEvent } from "@/domain/events/instances/InstanceRemovedEvent";
import { InstanceRenamedEvent } from "@/domain/events/instances/InstanceRenamedEvent";
import { InstanceMoveSkippedFilesEvent } from "@/domain/events/instances/InstanceMoveSkippedFilesEvent";
import { InstancesPersistFailedEvent } from "@/domain/events/instances/InstancesPersistFailedEvent";
import { SettingsChangedEvent } from "@/domain/events/settings/SettingsChangedEvent";
import { SettingsPersistFailedEvent } from "@/domain/events/settings/SettingsPersistFailedEvent";
import { AutoSelectTimeoutChangedEvent } from "@/domain/events/settings/AutoSelectTimeoutChangedEvent";
import { ProtocolActionFailedEvent } from "@/domain/events/settings/ProtocolActionFailedEvent";
import { RouterUrlRoutedEvent } from "@/domain/events/router/RouterUrlRoutedEvent";
import { RouterUrlRouteFailedEvent } from "@/domain/events/router/RouterUrlRouteFailedEvent";

/** Turns domain events into user-facing toast notifications. */
@singleton()
export class NotificationHandler {
    constructor(@inject(EventBus) private readonly eventBus: EventBus) {
        this.registerHandlers()
    }

    private registerHandlers(): void {
        this.on(InstanceCreatedEvent, (e) => `Instance "${e.instanceName}" created`)
        this.on(InstanceRemovedEvent, (e) => `Instance "${e.instanceName}" removed`, "info")
        this.on(InstanceRenamedEvent, (e) => `Instance renamed to "${e.instanceName}"`)
        this.on(
            InstanceMoveSkippedFilesEvent,
            (e) => `"${e.instanceName}" registered, but some files couldn't be moved — they're still at ${e.oldPath}`,
            "warning",
        )
        this.on(InstancesPersistFailedEvent, (e) => `Failed to save instances: ${e.message}`, "error")
        this.on(SettingsChangedEvent, (e) => `Instances folder set to "${e.instancesRootDir}"`)
        this.on(SettingsPersistFailedEvent, (e) => `Failed to save settings: ${e.message}`, "error")
        this.on(AutoSelectTimeoutChangedEvent, (e) => `Auto-select timeout set to ${e.seconds}s`)
        this.on(ProtocolActionFailedEvent, (e) => `Couldn't open Default Apps settings: ${e.message}`, "error")
        this.on(RouterUrlRoutedEvent, (e) => `Redirected to ${e.targetLabel}`)
        this.on(RouterUrlRouteFailedEvent, (e) => `Failed to route URL: ${e.message}`, "error")
    }

    private on<T>(event: new (...args: any[]) => T, message: (e: T) => string, level: "success" | "info" | "warning" | "error" = "success"): void {
        this.eventBus.registerHandler(event, (e) => {
            toast[level](message(e))
        })
    }
}
