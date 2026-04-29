const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ejs$/,
      type: 'asset/source',
    });
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      async: false,
    };
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    config.module.rules.push({
      test: /\.(wasm|bin)$/,
      type: 'asset/resource',
    });
    config.module.rules.push({
      oneOf: [
        {
          test: /node_modules\/onnxruntime-web\/.*\.wasm$/,
          type: 'asset/resource',
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
