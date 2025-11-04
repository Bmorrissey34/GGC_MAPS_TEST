/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/ggcmaps-fall25' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ggcmaps-fall25/' : '',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
