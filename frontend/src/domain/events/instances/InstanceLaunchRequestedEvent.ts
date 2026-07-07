export class InstanceLaunchRequestedEvent {
    constructor(
        public readonly instanceId: string,
        public readonly instanceName: string,
        public readonly path: string,
    ) {}
}
