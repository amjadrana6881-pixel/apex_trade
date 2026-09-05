/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['mongoose', 'mongodb', 'bcryptjs'],
};

module.exports = nextConfig;
