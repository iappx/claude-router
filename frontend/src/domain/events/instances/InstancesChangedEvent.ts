import type { InstanceModel } from "@/domain/models/instance";

export class InstancesChangedEvent {
    constructor(public readonly instances: InstanceModel[]) {}
}
