export function formatFileSize(sizeInKb: number): string {
  if (sizeInKb < 1024) {
    return `${sizeInKb} KB`;
  }
  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}
