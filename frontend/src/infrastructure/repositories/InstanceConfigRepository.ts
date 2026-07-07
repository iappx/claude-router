import { singleton } from "tsyringe";
import { InstanceService as InstanceServiceBinding } from "../../../bindings/claude_router/core/services/instance";
import type { InstanceProps } from "@/domain/models/instance";

@singleton()
export class InstanceConfigRepository {
  async load(): Promise<InstanceProps[]> {
    const instances = await InstanceServiceBinding.List();
    return instances.map((instance) => ({
      id: instance.id,
      name: instance.name,
      profileDir: instance.profileDir,
      path: instance.path,
      createdAt: instance.createdAt,
    }));
  }

  async save(instances: InstanceProps[]): Promise<void> {
    await InstanceServiceBinding.Save(instances.map((instance) => ({ ...instance })));
  }
}
