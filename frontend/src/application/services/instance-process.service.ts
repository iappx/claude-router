import { inject, injectable } from "tsyringe";
import { InstanceProcessRepository, type RunningInstanceSnapshot } from "@/infrastructure/repositories/InstanceProcessRepository";

@injectable()
export class InstanceProcessService {
  constructor(
    @inject(InstanceProcessRepository) private readonly repository: InstanceProcessRepository,
  ) {}

  async ensureProfileDir(path: string): Promise<void> {
    await this.repository.ensureProfileDir(path);
  }

  async launch(path: string): Promise<void> {
    await this.repository.launch(path);
  }

  async listRunning(): Promise<RunningInstanceSnapshot[]> {
    return await this.repository.listRunning();
  }

  async stop(profileDir: string): Promise<void> {
    await this.repository.stop(profileDir);
  }

  async openProfileDir(path: string): Promise<void> {
    await this.repository.openProfileDir(path);
  }

  async deleteProfileDir(path: string): Promise<void> {
    await this.repository.deleteProfileDir(path);
  }

  /** Returns whether any file/folder had to be skipped during the move. */
  async moveProfileDir(profileDir: string, oldPath: string, newPath: string): Promise<boolean> {
    return await this.repository.moveProfileDir(profileDir, oldPath, newPath);
  }

  /** Returns whether any file/folder had to be skipped during the move. */
  async moveDefaultProfileDir(profileDir: string, oldPath: string, newPath: string): Promise<boolean> {
    return await this.repository.moveDefaultProfileDir(profileDir, oldPath, newPath);
  }

  async resolveMoveConflict(action: "skip" | "abort"): Promise<void> {
    await this.repository.resolveMoveConflict(action);
  }
}
