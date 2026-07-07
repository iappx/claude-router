/** Framework-free Windows path joining for building profile directory paths. */
export class PathJoiner {
  static join(root: string, leaf: string): string {
    return `${root.replace(/[\\/]+$/, "")}\\${leaf}`;
  }
}
