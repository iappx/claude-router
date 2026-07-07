export class Uuid {
    static v4(): string {
        return crypto.randomUUID()
    }
}
