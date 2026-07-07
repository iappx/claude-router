import { inject, injectable } from "tsyringe";
import { IdService } from "@/application/services/id.service";
import { InstanceConfigRepository } from "@/infrastructure/repositories/InstanceConfigRepository";
import { InstanceModel, type InstanceProps } from "@/domain/models/instance";
import { Slugifier } from "@/domain/support/Slugifier";
import { PathJoiner } from "@/domain/support/PathJoiner";

@injectable()
export class InstanceService {
  constructor(
    @inject(IdService) private readonly ids: IdService,
    @inject(InstanceConfigRepository) private readonly config: InstanceConfigRepository,
  ) {}

  /** fallbackRootDir backfills instances persisted before `path` existed. */
  hydrate(instances: InstanceProps[], fallbackRootDir: string): InstanceModel[] {
    return instances.map((instance) =>
      InstanceModel.create({
        ...instance,
        path: instance.path || PathJoiner.join(fallbackRootDir, instance.profileDir),
      }),
    );
  }

  async loadInstances(fallbackRootDir: string): Promise<InstanceModel[]> {
    return this.hydrate(await this.config.load(), fallbackRootDir);
  }

  async saveInstances(instances: InstanceModel[]): Promise<void> {
    await this.config.save(instances.map((instance) => this.toInstanceProps(instance)));
  }

  addInstance(instances: InstanceModel[], name: string, profileDir: string, rootDir: string): InstanceModel[] {
    const id = this.ids.next();
    const slug = Slugifier.toKebabCase(profileDir) || Slugifier.toKebabCase(name) || id;
    return [
      ...instances,
      InstanceModel.create({
        id,
        name,
        profileDir: slug,
        path: PathJoiner.join(rootDir, slug),
        createdAt: new Date().toISOString(),
      }),
    ];
  }

  /**
   * Registers an instance discovered from an already-running process. Unlike
   * addInstance, the profile directory and path are used verbatim — they're
   * the real, already-existing location backing that process, not something
   * to slugify or derive from the current settings.
   */
  registerInstance(instances: InstanceModel[], name: string, profileDir: string, path: string): InstanceModel[] {
    return [
      ...instances,
      InstanceModel.create({
        id: this.ids.next(),
        name,
        profileDir,
        path,
        createdAt: new Date().toISOString(),
      }),
    ];
  }

  removeInstance(instances: InstanceModel[], id: string): InstanceModel[] {
    return instances.filter((instance) => instance.id !== id);
  }

  renameInstance(instances: InstanceModel[], id: string, name: string): InstanceModel[] {
    return instances.map((instance) => (instance.id === id ? instance.withChanges({ name }) : instance));
  }

  private toInstanceProps(instance: InstanceModel): InstanceProps {
    return {
      id: instance.id,
      name: instance.name,
      profileDir: instance.profileDir,
      path: instance.path,
      createdAt: instance.createdAt,
    };
  }
}
