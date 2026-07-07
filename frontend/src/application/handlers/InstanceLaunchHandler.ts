import { inject, singleton } from "tsyringe";
import { toast } from "vue-sonner";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstanceProcessService } from "@/application/services/instance-process.service";
import { InstanceLaunchRequestedEvent } from "@/domain/events/instances/InstanceLaunchRequestedEvent";

/** Finds and starts an isolated Claude Desktop process for the requested instance. */
@singleton()
export class InstanceLaunchHandler {
    constructor(
        @inject(InstanceProcessService) private readonly processService: InstanceProcessService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        this.eventBus.registerHandler(InstanceLaunchRequestedEvent, (e) => this.onLaunchRequested(e))
    }

    private async onLaunchRequested(event: InstanceLaunchRequestedEvent): Promise<void> {
        try {
            await this.processService.launch(event.path)
            toast.success(`Launching "${event.instanceName}"`)
        } catch (error) {
            toast.error(`Failed to launch "${event.instanceName}": ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
