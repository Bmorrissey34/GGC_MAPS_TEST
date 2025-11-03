export function getAssetPath(path) {
  const basePath = process.env.NODE_ENV === 'production' ? '/ggcmaps-fall25' : '';
  return `${basePath}${path}`;
}