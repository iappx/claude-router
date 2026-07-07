/** Framework-free kebab-case normalization for filesystem-safe folder names. */
export class Slugifier {
  static toKebabCase(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "");
  }

  /** Best-effort reversal of toKebabCase, for labelling folders we didn't name ourselves. */
  static toTitleCase(value: string): string {
    return value
      .split(/[-_]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }
}
