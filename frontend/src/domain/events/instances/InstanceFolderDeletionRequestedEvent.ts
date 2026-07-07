export class InstanceFolderDeletionRequestedEvent {
    constructor(
        public readonly instanceName: string,
        public readonly path: string,
    ) {}
}
