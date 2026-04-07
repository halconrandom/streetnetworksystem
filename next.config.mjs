import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
    });
    config.module.rules.push({
      test: /\.ejs$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
