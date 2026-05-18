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
};

module.exports = nextConfig;
