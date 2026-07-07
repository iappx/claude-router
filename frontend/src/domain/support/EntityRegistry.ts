export type TEntityMetadata = {
  readonly name: string;
  readonly collection: string;
  readonly displayName: string;
};

/** Stores entity metadata declared via the `@Entity` decorator. */
export class EntityRegistry {
  private static readonly metadata = new WeakMap<Function, TEntityMetadata>();

  static set(target: Function, metadata: TEntityMetadata): void {
    this.metadata.set(target, metadata);
  }

  static get(target: Function): TEntityMetadata | undefined {
    return this.metadata.get(target);
  }
}
