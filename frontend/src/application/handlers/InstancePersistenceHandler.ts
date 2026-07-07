import { inject, singleton } from "tsyringe";
import { EventBus } from "@/services/eventBus/EventBus";
import { InstanceService } from "@/application/services/instance.service";
import { InstancesChangedEvent } from "@/domain/events/instances/InstancesChangedEvent";
import { InstancesPersistFailedEvent } from "@/domain/events/instances/InstancesPersistFailedEvent";

/** Persists the instance list to disk whenever it changes. */
@singleton()
export class InstancePersistenceHandler {
    constructor(
        @inject(InstanceService) private readonly instanceService: InstanceService,
        @inject(EventBus) private readonly eventBus: EventBus,
    ) {
        this.eventBus.registerHandler(InstancesChangedEvent, (e) => this.persist(e))
    }

    private async persist(event: InstancesChangedEvent): Promise<void> {
        try {
            await this.instanceService.saveInstances(event.instances)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.eventBus.emitEvent(new InstancesPersistFailedEvent(message))
        }
    }
}
