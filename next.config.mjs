import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['components-sdk'],
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ejs$/,
      type: 'asset/source',
    });
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
