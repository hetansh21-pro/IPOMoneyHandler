import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ipomoneyhandler.app',
  appName: 'IPO Money Handler',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
