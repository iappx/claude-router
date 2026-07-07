import { singleton } from "tsyringe";
import { InstanceService as InstanceServiceBinding } from "../../../bindings/claude_router/core/services/instance";

export type RunningInstanceSnapshot = {
  profileDir: string;
  path: string;
  isDefault: boolean;
};

export type DefaultInstanceSnapshot = {
  profileDir: string;
  path: string;
};

@singleton()
export class InstanceProcessRepository {
  async ensureProfileDir(path: string): Promise<void> {
    await InstanceServiceBinding.EnsureProfileDir(path);
  }

  /** The packaged (MSIX/AppX) default Claude Desktop install, resolved statically — no running process required. */
  async defaultInstance(): Promise<DefaultInstanceSnapshot> {
    const result = await InstanceServiceBinding.DefaultInstance();
    return { profileDir: result.profileDir, path: result.path };
  }

  /** Launches Claude Desktop with targetUrl as an argument. An empty dataDir targets the packaged default install. */
  async routeURL(dataDir: string, targetUrl: string): Promise<void> {
    await InstanceServiceBinding.RouteURL(dataDir, targetUrl);
  }

  async launch(path: string): Promise<void> {
    await InstanceServiceBinding.Launch(path);
  }

  /** Every currently running Claude Desktop process, matched to its profile directory. */
  async listRunning(): Promise<RunningInstanceSnapshot[]> {
    const running = await InstanceServiceBinding.RunningProfileDirs();
    return running.map((r) => ({ profileDir: r.profileDir, path: r.path, isDefault: r.isDefault }));
  }

  async stop(profileDir: string): Promise<void> {
    await InstanceServiceBinding.Stop(profileDir);
  }

  async openProfileDir(path: string): Promise<void> {
    await InstanceServiceBinding.OpenProfileDir(path);
  }

  /** Permanently deletes the profile folder and everything inside it. */
  async deleteProfileDir(path: string): Promise<void> {
    await InstanceServiceBinding.DeleteProfileDir(path);
  }

  /**
   * Relocates a profile folder. Emits "instance:move-progress" events while
   * it runs, and "instance:move-conflict" if a file can't be copied (the
   * caller must answer via resolveMoveConflict). Returns whether any
   * file/folder had to be skipped — when true, the old folder was
   * deliberately left in place instead of being deleted, so nothing skipped
   * is lost.
   */
  async moveProfileDir(profileDir: string, oldPath: string, newPath: string): Promise<boolean> {
    return await InstanceServiceBinding.MoveProfileDir(profileDir, oldPath, newPath);
  }

  /**
   * Relocates the packaged default Claude Desktop install's data. Stops
   * every running claude.exe process (not just this one) since the default
   * install can't be reliably isolated by profile directory.
   */
  async moveDefaultProfileDir(profileDir: string, oldPath: string, newPath: string): Promise<boolean> {
    return await InstanceServiceBinding.MoveDefaultProfileDir(profileDir, oldPath, newPath);
  }

  /** Answers a pending "instance:move-conflict" event. */
  async resolveMoveConflict(action: "skip" | "abort"): Promise<void> {
    await InstanceServiceBinding.ResolveMoveConflict(action);
  }
}
