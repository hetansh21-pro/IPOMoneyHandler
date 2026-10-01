import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@capacitor/core',
    '@capacitor/app',
    '@capacitor/clipboard',
    '@capacitor/filesystem',
    '@capacitor/share',
    '@capacitor/status-bar',
  ],
  allowedDevOrigins: ['10.79.168.189', '10.79.168.189:3000', '10.58.125.189', '10.58.125.189:3000', '10.22.104.189', 'localhost', '127.0.0.1'],
};

export default nextConfig;
