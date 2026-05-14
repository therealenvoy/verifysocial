/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Memory optimization for Railway
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Reduce memory usage
  swcMinify: true,
};

module.exports = nextConfig;