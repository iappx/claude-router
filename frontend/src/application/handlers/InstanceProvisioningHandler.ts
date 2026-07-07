import { inject, singleton } from "tsyringe";
import { toast } from "vue-sonner";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstanceProcessService } from "@/application/services/instance-process.service";
import { InstanceCreatedEvent } from "@/domain/events/instances/InstanceCreatedEvent";

/** Creates the isolated profile folder on disk whenever a new instance is added. */
@singleton()
export class InstanceProvisioningHandler {
    constructor(
        @inject(InstanceProcessService) private readonly processService: InstanceProcessService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        this.eventBus.registerHandler(InstanceCreatedEvent, (e) => this.provision(e))
    }

    private async provision(event: InstanceCreatedEvent): Promise<void> {
        try {
            await this.processService.ensureProfileDir(event.path)
        } catch (error) {
            toast.error(`Failed to create profile folder for "${event.instanceName}": ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
