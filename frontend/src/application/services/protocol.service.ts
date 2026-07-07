import { inject, injectable } from "tsyringe";
import { ProtocolRepository } from "@/infrastructure/repositories/ProtocolRepository";

@injectable()
export class ProtocolService {
  constructor(
    @inject(ProtocolRepository) private readonly repository: ProtocolRepository,
  ) {}

  async openDefaultAppsSettings(): Promise<void> {
    await this.repository.openDefaultAppsSettings();
  }
}
