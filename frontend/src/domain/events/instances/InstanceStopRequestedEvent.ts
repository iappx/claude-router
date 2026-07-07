export class InstanceStopRequestedEvent {
    constructor(
        public readonly instanceId: string,
        public readonly instanceName: string,
        public readonly profileDir: string,
    ) {}
}
