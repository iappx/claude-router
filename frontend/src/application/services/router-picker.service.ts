import { inject, injectable } from "tsyringe";
import { RouterRepository } from "@/infrastructure/repositories/RouterRepository";
import { InstanceProcessRepository, type DefaultInstanceSnapshot } from "@/infrastructure/repositories/InstanceProcessRepository";

@injectable()
export class RouterPickerService {
  constructor(
    @inject(RouterRepository) private readonly routerRepository: RouterRepository,
    @inject(InstanceProcessRepository) private readonly processRepository: InstanceProcessRepository,
  ) {}

  async getPendingUrl(): Promise<string> {
    return await this.routerRepository.getPendingUrl();
  }

  async clearPendingUrl(): Promise<void> {
    await this.routerRepository.clearPendingUrl();
  }

  /** null when Claude Desktop isn't installed. */
  async getDefaultInstance(): Promise<DefaultInstanceSnapshot | null> {
    try {
      return await this.processRepository.defaultInstance();
    } catch {
      return null;
    }
  }

  /** An empty dataDir targets the packaged default install. */
  async routeUrl(dataDir: string, url: string): Promise<void> {
    await this.processRepository.routeURL(dataDir, url);
  }
}
