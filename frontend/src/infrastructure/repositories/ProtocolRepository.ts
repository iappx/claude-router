import { singleton } from "tsyringe";
import { ProtocolService as ProtocolServiceBinding } from "../../../bindings/claude_router/core/services/protocol";

@singleton()
export class ProtocolRepository {
  /** Opens Windows' own Default Apps settings page. */
  async openDefaultAppsSettings(): Promise<void> {
    await ProtocolServiceBinding.OpenDefaultAppsSettings();
  }
}
