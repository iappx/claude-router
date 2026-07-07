import { injectable } from "tsyringe";

@injectable()
export class IdService {
  next(): string {
    return crypto.randomUUID();
  }
}
