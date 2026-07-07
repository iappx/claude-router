import { singleton } from "tsyringe";
import { RouterService as RouterServiceBinding } from "../../../bindings/claude_router/core/services/router";

@singleton()
export class RouterRepository {
  /** The claude:// URL that triggered this launch, or "" if none is pending. */
  async getPendingUrl(): Promise<string> {
    return await RouterServiceBinding.GetPendingURL();
  }

  /** Forgets the pending URL once it's been routed. */
  async clearPendingUrl(): Promise<void> {
    await RouterServiceBinding.ClearPendingURL();
  }
}
