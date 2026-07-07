import { injectable } from "tsyringe";

/** Detects whether the Wails runtime (Go bindings) is available in the host. */
@injectable()
export class WailsRuntimeService {
  isAvailable(): boolean {
    return typeof window !== "undefined" && "_wails" in window;
  }
}
