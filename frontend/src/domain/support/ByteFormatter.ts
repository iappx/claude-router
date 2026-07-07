/** Framework-free human-readable byte size formatting. */
export class ByteFormatter {
  private static readonly UNITS = ["B", "KB", "MB", "GB", "TB"];

  static format(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), ByteFormatter.UNITS.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${ByteFormatter.UNITS[exponent]}`;
  }
}
