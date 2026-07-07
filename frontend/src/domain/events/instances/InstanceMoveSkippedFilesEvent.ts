export class InstanceMoveSkippedFilesEvent {
    constructor(
        public readonly instanceName: string,
        public readonly oldPath: string,
    ) {}
}
