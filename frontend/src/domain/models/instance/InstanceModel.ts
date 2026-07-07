import { Entity } from "@/domain/decorators/entity-metadata";

export type InstanceProps = {
  id: string;
  name: string;
  profileDir: string;
  /** Absolute profile directory, pinned at creation/registration time. */
  path: string;
  createdAt: string;
};

@Entity({ name: "Instance", collection: "instances", displayName: "Instance" })
export class InstanceModel implements InstanceProps {
  readonly id: string;
  readonly name: string;
  readonly profileDir: string;
  readonly path: string;
  readonly createdAt: string;

  constructor(props: InstanceProps) {
    this.id = props.id;
    this.name = props.name;
    this.profileDir = props.profileDir;
    this.path = props.path;
    this.createdAt = props.createdAt;
  }

  static create(props: InstanceProps): InstanceModel {
    return new InstanceModel(props);
  }

  withChanges(changes: Partial<InstanceProps>): InstanceModel {
    return new InstanceModel({ ...this, ...changes });
  }
}
