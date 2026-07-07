export class InstanceOpenFolderRequestedEvent {
    constructor(
        public readonly instanceName: string,
        public readonly path: string,
    ) {}
}
