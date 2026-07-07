import { inject, singleton } from "tsyringe";
import { toast } from "vue-sonner";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstanceProcessService } from "@/application/services/instance-process.service";
import { InstanceOpenFolderRequestedEvent } from "@/domain/events/instances/InstanceOpenFolderRequestedEvent";
import { InstanceFolderDeletionRequestedEvent } from "@/domain/events/instances/InstanceFolderDeletionRequestedEvent";

/** Reveals or permanently deletes an instance's profile folder on disk. */
@singleton()
export class InstanceFolderHandler {
    constructor(
        @inject(InstanceProcessService) private readonly processService: InstanceProcessService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        this.eventBus.registerHandler(InstanceOpenFolderRequestedEvent, (e) => this.onOpenFolderRequested(e))
        this.eventBus.registerHandler(InstanceFolderDeletionRequestedEvent, (e) => this.onFolderDeletionRequested(e))
    }

    private async onOpenFolderRequested(event: InstanceOpenFolderRequestedEvent): Promise<void> {
        try {
            await this.processService.openProfileDir(event.path)
        } catch (error) {
            toast.error(`Failed to open folder for "${event.instanceName}": ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    private async onFolderDeletionRequested(event: InstanceFolderDeletionRequestedEvent): Promise<void> {
        try {
            await this.processService.deleteProfileDir(event.path)
            toast.success(`Deleted folder for "${event.instanceName}"`)
        } catch (error) {
            toast.error(`Failed to delete folder for "${event.instanceName}": ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
