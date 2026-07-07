import { EntityRegistry, type TEntityMetadata } from "@/domain/support/EntityRegistry";

export type { TEntityMetadata };

/** Class decorator that registers entity metadata into the {@link EntityRegistry}. */
export function Entity(metadata: TEntityMetadata): ClassDecorator {
  return (target) => {
    EntityRegistry.set(target, metadata);
  };
}
