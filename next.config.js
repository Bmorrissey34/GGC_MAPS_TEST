/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/ggcmaps-fall25',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
