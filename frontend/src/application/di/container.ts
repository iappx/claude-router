import "@/application/di/reflect-lite";
import { container } from "tsyringe";

// Services, repositories and event handlers register themselves via their
// `@injectable()` / `@singleton()` decorators when their modules are imported,
// and resolve their dependencies through explicit `@inject(Token)` params.
// No manual wiring is required here.

export { container as appContainer };
