import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  allowedDevOrigins: ['10.22.104.189', 'localhost', '127.0.0.1'],
};

export default nextConfig;
