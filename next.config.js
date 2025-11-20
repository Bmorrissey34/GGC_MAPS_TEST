/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/GGC_MAPS_TEST' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/GGC_MAPS_TEST/' : '',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
