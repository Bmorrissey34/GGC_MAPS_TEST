export function getAssetPath(path) {
  const basePath = process.env.NODE_ENV === 'production' ? '/GGC_MAPS_TEST' : '';
  return `${basePath}${path}`;
}