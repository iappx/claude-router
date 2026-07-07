type ReflectWithMetadata = typeof Reflect & {
  getMetadata?: (key: unknown, target: object) => unknown;
  defineMetadata?: (key: unknown, value: unknown, target: object) => void;
};

const reflect = Reflect as ReflectWithMetadata;

reflect.getMetadata ??= () => undefined;
reflect.defineMetadata ??= () => undefined;
