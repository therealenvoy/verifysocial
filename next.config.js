/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;