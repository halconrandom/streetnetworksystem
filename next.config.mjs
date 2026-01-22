const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['components-sdk'],
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
