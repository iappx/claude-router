import { inject, singleton } from "tsyringe";
import { toast } from "vue-sonner";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstanceProcessService } from "@/application/services/instance-process.service";
import { InstanceStopRequestedEvent } from "@/domain/events/instances/InstanceStopRequestedEvent";

/** Terminates the running Claude Desktop process(es) for the requested instance. */
@singleton()
export class InstanceStopHandler {
    constructor(
        @inject(InstanceProcessService) private readonly processService: InstanceProcessService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        this.eventBus.registerHandler(InstanceStopRequestedEvent, (e) => this.onStopRequested(e))
    }

    private async onStopRequested(event: InstanceStopRequestedEvent): Promise<void> {
        try {
            await this.processService.stop(event.profileDir)
            toast.success(`Stopped "${event.instanceName}"`)
        } catch (error) {
            toast.error(`Failed to stop "${event.instanceName}": ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
