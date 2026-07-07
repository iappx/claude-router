import { singleton } from "tsyringe";
import { SettingsService as SettingsServiceBinding, Settings } from "../../../bindings/claude_router/core/services/settings";

export type SettingsSnapshot = {
  instancesRootDir: string;
  isOnSystemDrive: boolean;
  autoSelectTimeoutSeconds: number;
};

@singleton()
export class SettingsRepository {
  async load(): Promise<SettingsSnapshot> {
    const view = await SettingsServiceBinding.Get();
    return {
      instancesRootDir: view.instancesRootDir,
      isOnSystemDrive: view.isOnSystemDrive,
      autoSelectTimeoutSeconds: view.autoSelectTimeoutSeconds,
    };
  }

  /**
   * Persists the full settings shape — Save replaces app.json wholesale on
   * the Go side, so every field must be passed together or an unrelated one
   * (e.g. the other field) would silently reset.
   */
  async save(settings: { instancesRootDir: string; autoSelectTimeoutSeconds: number }): Promise<void> {
    await SettingsServiceBinding.Save(new Settings(settings));
  }

  /** Opens the native folder picker. Returns "" if the user cancelled. */
  async pickInstancesRootDir(): Promise<string> {
    return await SettingsServiceBinding.PickInstancesRootDir();
  }
}
