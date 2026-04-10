import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mydailyhub.app',
  appName: 'My Daily Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
