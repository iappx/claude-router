export class InstanceCreatedEvent {
    constructor(
        public readonly instanceName: string,
        public readonly path: string,
    ) {}
}
